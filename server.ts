import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';
import path from 'path';
import { generateCaseStudyFromText, generatePharmacologyMemoFiche, generateExhaustiveMemoFiche, getEmbedding } from './services/geminiService';
import { updateKnowledgeBase, indexSingleMemoFiche } from './services/indexingService';
import { getCustomChatResponse } from './services/geminiService';
import clientPromise from './services/mongo';
import { ObjectId } from 'mongodb'; // Ajout de l'import ObjectId
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from './types'; // Import User and UserRole
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// --- EMAIL SENDING SETUP ---
// Create a transporter object using SMTP transport.
// You must configure these environment variables.
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g., 'smtp.sendgrid.net'
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: (process.env.EMAIL_PORT || '587') === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, // e.g., 'apikey' for SendGrid
        pass: process.env.EMAIL_PASS, // Your SendGrid API Key or SMTP password
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

const sendEmail = async (options: EmailOptions) => {
    if (!process.env.EMAIL_HOST) {
        console.log('****************************************************************');
        console.log('*** WARNING: Email sending is not configured.             ***');
        console.log('*** Set EMAIL_HOST in your environment variables.         ***');
        console.log('*** Email content that would have been sent:             ***');
        console.log('****************************************************************');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`HTML Body: ${options.html}`);
        console.log('****************************************************************');
        return; // Skip sending email if not configured
    }

    try {
        const info = await transporter.sendMail({
            from: `"PharmIA" <${process.env.EMAIL_FROM || 'noreply@pharmia.app'}>`,
            ...options,
        });
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        // In a real app, you might want to throw this error or handle it differently
    }
};


// Extend the Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Middleware to protect routes
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = (req.headers as IncomingHttpHeaders).authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey'; // TODO: Use a strong, environment-variable-based secret

  try {
    const decoded = jwt.verify(token, jwtSecret) as { _id: string; email: string; role: UserRole };
    req.user = { _id: new ObjectId(decoded._id), email: decoded.email, role: decoded.role }; // Attach user info to request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check for admin or formateur role
const adminOrFormateurOnly = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role?.toUpperCase();
  if (userRole !== 'ADMIN' && userRole !== 'FORMATEUR') {
    return res.status(403).json({ message: 'Accès refusé. Rôle administrateur ou formateur requis.' });
  }
  next();
};

// Middleware to check for admin role
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis.' });
  }
  next();
};

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Serve static assets from the 'dist' folder
app.use(express.static(path.join(__dirname, '../dist')));

// All other API routes
app.get('/api/mongo-test', async (req, res) => {
  try {
    const client = await clientPromise;
    await client.db().admin().ping();
    res.status(200).json({ message: 'MongoDB connection successful' });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    res.status(500).json({ message: 'MongoDB connection failed' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, role, pharmacistId } = req.body;

    if (!email || !username || !password || !role) {
      return res.status(400).json({ message: 'Email, username, password, and role are required.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    // Check if email or username already exists
    const existingUser = await usersCollection.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ message: 'Ce pseudo est déjà pris.' });
      }
    }

    // Validate pharmacistId if role is PREPARATEUR
    if (role === UserRole.PREPARATEUR) {
        if (!pharmacistId) {
            return res.status(400).json({ message: 'Pharmacien référent est requis pour les préparateurs.' });
        }
        const pharmacist = await usersCollection.findOne({ _id: new ObjectId(pharmacistId), role: UserRole.PHARMACIEN });
        if (!pharmacist) {
            return res.status(400).json({ message: 'Pharmacien référent invalide.' });
        }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser: User = {
      email,
      username,
      passwordHash,
      role,
      pharmacistId: role === UserRole.PREPARATEUR ? new ObjectId(pharmacistId) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ message: 'User registered successfully.', user: userWithoutPassword });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Identifiant et mot de passe requis.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    // Find user by email or username
    const user = await usersCollection.findOne({ $or: [{ email: email }, { username: email }] });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey'; // TODO: Use a strong, environment-variable-based secret
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Exclude passwordHash from the response
    const { passwordHash: _, ...userWithoutPassword } = user;

    // Check if profile is incomplete
    let profileIncomplete = false;
    if (!user.email || (user.role === UserRole.PREPARATEUR && !user.pharmacistId)) {
        profileIncomplete = true;
    }

    res.status(200).json({ message: 'Logged in successfully.', token, user: userWithoutPassword, profileIncomplete });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ 
      $or: [{ email: identifier }, { username: identifier }] 
    });

    // Case 1: User exists
    if (user) {
      // Case 1a: It's a migrated user without a valid email -> Trigger activation flow
      // A valid email is assumed to contain an '@' character.
      if (!user.email || !user.email.includes('@')) {
        return res.status(200).json({ migrationRequired: true, username: user.username });
      }

      // Case 1b: It's a normal user -> Proceed with standard reset flow
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires } }
      );

      const resetUrl = `http://${req.headers.host}/#/reset-password?token=${resetToken}`;
      
      // Send the email
      await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe PharmIA',
        text: `Bonjour, \n\nVous avez demandé une réinitialisation de mot de passe. Veuillez cliquer sur le lien suivant pour continuer : ${resetUrl}\n\nSi vous n\'êtes pas à l\'origine de cette demande, veuillez ignorer cet email.\n\nL\'équipe PharmIA`,
        html: `<p>Bonjour,</p><p>Vous avez demandé une réinitialisation de mot de passe. Veuillez cliquer sur le lien suivant pour continuer : <a href="${resetUrl}">${resetUrl}</a></p><p>Si vous n\'êtes pas à l\'origine de cette demande, veuillez ignorer cet email.</p><p>L\'équipe PharmIA</p>`,
      });
    }

    // Case 2: User does not exist, or normal user flow was triggered
    // Always return a generic success message to prevent email/username enumeration.
    res.status(200).json({ message: 'Si votre identifiant est enregistré, vous recevrez des instructions pour réinitialiser votre mot de passe.' });

  } catch (error) {
    console.error('Error during forgot password request:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
});

// Initiate Activation for Migrated Users
app.post('/api/auth/initiate-activation', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Pseudo et email sont requis.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ username });

    // Security checks
    if (!user) {
      return res.status(404).json({ message: 'Pseudo non trouvé.' });
    }
    // A valid email is assumed to contain an '@' character.
    if (user.email && user.email.includes('@')) {
      return res.status(400).json({ message: 'Ce compte est déjà actif.' });
    }

    // Check if the proposed email is already in use by another account
    const emailExists = await usersCollection.findOne({ email });
    if (emailExists) {
        return res.status(409).json({ message: 'Cette adresse email est déjà utilisée par un autre compte.' });
    }

    // Proceed with token generation and association
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          email: email, // Associate the new email
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
          updatedAt: new Date(),
        },
      }
    );

    const resetUrl = `http://${req.headers.host}/#/reset-password?token=${resetToken}`;
    
    // Send the activation email
    await sendEmail({
      to: email,
      subject: 'Activez votre compte PharmIA',
      text: `Bonjour, \n\nBienvenue sur PharmIA. Veuillez cliquer sur le lien suivant pour activer votre compte et définir votre mot de passe : ${resetUrl}\n\nL\'équipe PharmIA`,
      html: `<p>Bonjour,</p><p>Bienvenue sur PharmIA. Veuillez cliquer sur le lien suivant pour activer votre compte et définir votre mot de passe : <a href="${resetUrl}">${resetUrl}</a></p><p>L\'équipe PharmIA</p>`,
    });

    res.status(200).json({ message: `Un lien d'activation a été envoyé à ${email}.` });

  } catch (error) {
    console.error('Error during account activation initiation:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Jeton et nouveau mot de passe requis.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Jeton de réinitialisation invalide ou expiré.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user's password and clear reset token fields
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash: passwordHash, updatedAt: new Date() },
        $unset: { resetPasswordToken: '', resetPasswordExpires: '' }, // Clear token fields
      }
    );

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });

  } catch (error) {
    console.error('Error during password reset request:', error);
    res.status(500).json({ message: 'Internal server error during password reset.' });
  }
});

// Profile update endpoint
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { email, password, pharmacistId } = req.body; // Added pharmacistId
    const userId = req.user?._id; // Get user ID from authenticated request

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const updateFields: any = { updatedAt: new Date() };

    // Fetch the current user to check their role
    const currentUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!currentUser) {
        return res.status(404).json({ message: 'User not found.' });
    }

    if (email) {
      // Check if new email is already taken by another user
      const existingUserWithEmail = await usersCollection.findOne({ email, _id: { $ne: new ObjectId(userId) } });
      if (existingUserWithEmail) {
        return res.status(409).json({ message: 'Email already in use by another account.' });
      }
      updateFields.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.passwordHash = await bcrypt.hash(password, salt);
    }

    // Handle pharmacistId update only if the user is a PREPARATEUR
    if (currentUser.role === UserRole.PREPARATEUR) {
        if (!pharmacistId) {
            return res.status(400).json({ message: 'Pharmacien référent est requis pour les préparateurs.' });
        }
        // Verify if pharmacistId corresponds to an existing PHARMACIEN user
        const pharmacist = await usersCollection.findOne({ _id: new ObjectId(pharmacistId), role: UserRole.PHARMACIEN });
        if (!pharmacist) {
            return res.status(400).json({ message: 'Pharmacien référent invalide.' });
        }
        updateFields.pharmacistId = new ObjectId(pharmacistId);
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Fetch updated user to return (excluding passwordHash)
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (updatedUser) {
      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      // Add profileIncomplete flag to the returned user object
      const profileIncomplete = !updatedUser.email || (updatedUser.role === UserRole.PREPARATEUR && !updatedUser.pharmacistId);
      res.status(200).json({ message: 'Profile updated successfully.', user: { ...userWithoutPassword, profileIncomplete } });
    } else {
      res.status(500).json({ message: 'Failed to retrieve updated user data.' });
    }

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error during profile update.' });
  }
});

// Get list of pharmacists
app.get('/api/users/pharmacists', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const pharmacists = await usersCollection.find(
      { role: UserRole.PHARMACIEN },
      { projection: { _id: 1, email: 1 } } // Only return _id and email
    ).toArray();

    res.status(200).json(pharmacists);
  } catch (error) {
    console.error('Error fetching pharmacists:', error);
    res.status(500).json({ message: 'Failed to fetch pharmacists.' });
  }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { memoFicheType, sourceText, theme, system, pathology } = req.body;

        if (!sourceText) {
            return res.status(400).json({ error: 'Source text is required.' });
        }

        let result;
        if (memoFicheType === 'pharmacologie') {
            result = await generatePharmacologyMemoFiche(sourceText, theme, pathology);
        } else if (memoFicheType === 'exhaustive') {
            result = await generateExhaustiveMemoFiche(sourceText);
        } else {
            result = await generateCaseStudyFromText(sourceText, theme || 'Général', system || 'Général');
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error in /api/generate:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({
            error: 'Failed to generate memo fiche.',
            details: errorMessage
        });
    }
});



// New endpoint for custom chat bot
app.post('/api/custom-chat', authMiddleware, async (req, res) => {
    try {
        const { userMessage, chatHistory, context } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: 'User message is required.' });
        }

        const response = await getCustomChatResponse(userMessage, chatHistory, context);
        res.json({ response });

    } catch (error) {
        console.error('Error in /api/custom-chat:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: 'Failed to get custom chat response.', details: errorMessage });
    }
});

app.get('/api/memofiches', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('pharmia'); // Specify the database name
    const memofiches = await db.collection('memofiches_v2').find({}).toArray();
    res.status(200).json(memofiches);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch memofiches' });
  }
});

app.post('/api/memofiches', async (req, res) => {
  try {
    const newCase = req.body;
    // S'assurer que _id n'est pas envoyé par le client pour une nouvelle création
    if (newCase._id) {
      delete newCase._id;
    }
    // Handle knowledgeBaseUrl
    if (newCase.knowledgeBaseUrl) {
        newCase.knowledgeBaseUrl = newCase.knowledgeBaseUrl;
    }
    const client = await clientPromise;
    const db = client.db('pharmia');
    const result = await db.collection('memofiches_v2').insertOne(newCase);
    
    // Récupérer le document inséré pour le renvoyer avec son _id généré
    const insertedDocument = await db.collection('memofiches_v2').findOne({ _id: result.insertedId });
    
    // Indexer la nouvelle fiche pour la base de connaissance
    await indexSingleMemoFiche(result.insertedId);

    res.status(201).json(insertedDocument); // Retourne le document inséré avec son _id
  } catch (error) {
    console.error('Error creating memo fiche:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: 'Failed to create memo fiche.', details: errorMessage });
  }
});

app.put('/api/memofiches/:id', authMiddleware, adminOrFormateurOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCase = req.body;

    // Retirer le champ _id de l'objet à mettre à jour
    const { _id, ...updateData } = updatedCase; 
    
    // Handle knowledgeBaseUrl
    if (updatedCase.knowledgeBaseUrl) {
        updateData.knowledgeBaseUrl = updatedCase.knowledgeBaseUrl;
    } else {
        // If knowledgeBaseUrl is not provided, ensure it's removed from the document if it existed
        updateData.knowledgeBaseUrl = null; 
    } 

    const client = await clientPromise;
    const db = client.db('pharmia');
    const result = await db.collection('memofiches_v2').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData } // Utiliser updateData sans _id
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Mémofiche non trouvée.' });
    }

    // Si la mise à jour a réussi, récupérer le document mis à jour pour le renvoyer
    const savedCase = await db.collection('memofiches_v2').findOne({ _id: new ObjectId(id) });

    // Réindexer la fiche mise à jour pour la base de connaissance
    await indexSingleMemoFiche(new ObjectId(id));

    res.status(200).json(savedCase); // Renvoie le document mis à jour
  } catch (error) {
    console.error('Error updating memo fiche:', error);
    res.status(500).json({ error: 'Failed to update memo fiche.' });
  }
});

app.delete('/api/memofiches/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientPromise;
    const db = client.db('pharmia');
    const result = await db.collection('memofiches_v2').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Mémofiche non trouvée.' });
    }

    res.status(200).json({ message: 'Mémofiche supprimée avec succès.' });
  } catch (error) {
    console.error('Error deleting memo fiche:', error);
    res.status(500).json({ error: 'Failed to delete memo fiche.' });
  }
});

// Endpoint to get total number of memo fiches
app.get('/api/memofiches/count', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('pharmia');
    const count = await db.collection('memofiches_v2').countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching memo fiches count:', error);
    res.status(500).json({ message: 'Failed to fetch memo fiches count.' });
  }
});

// Endpoint to get user progress (read fiches and quiz history)
app.get('/api/user/progress', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection('users');

    const userProgress = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { readFicheIds: 1, quizHistory: 1 } }
    );

    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found.' });
    }

    res.status(200).json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ message: 'Failed to fetch user progress.' });
  }
});

// Endpoint to get details of specific memo fiches
app.post('/api/memofiches/details', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'An array of memo fiche IDs is required.' });
    }

    const objectIds = ids.map((id: string) => new ObjectId(id));

    const client = await clientPromise;
    const db = client.db('pharmia');
    const memofiches = await db.collection('memofiches_v2').find(
      { _id: { $in: objectIds } },
      { projection: { _id: 1, title: 1, theme: 1 } }
    ).toArray();

    res.status(200).json(memofiches);
  } catch (error) {
    console.error('Error fetching memo fiche details:', error);
    res.status(500).json({ message: 'Failed to fetch memo fiche details.' });
  }
});

// Endpoint to track read memo fiches
app.post('/api/user/track-read-fiche', authMiddleware, async (req, res) => {
  try {
    const { ficheId } = req.body;
    const userId = req.user?._id;

    if (!ficheId) {
      return res.status(400).json({ message: 'Fiche ID is required.' });
    }
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection('users');

    // Add ficheId to readFicheIds array if it doesn't already exist
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { readFicheIds: ficheId } }
    );

    res.status(200).json({ message: 'Fiche marked as read.' });
  } catch (error) {
    console.error('Error tracking read fiche:', error);
    res.status(500).json({ message: 'Failed to track read fiche.' });
  }
});

// Endpoint to track quiz completion
app.post('/api/user/track-quiz-completion', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const { quizId, score } = req.body;

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection('users');

    // Ensure quizId is a string and score is a number
    const newQuizEntry: { quizId: string; score: number; completedAt: Date } = {
      quizId: String(quizId),
      score: Number(score),
      completedAt: new Date(),
    };

    // Add quiz completion to quizHistory array
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { quizHistory: newQuizEntry } }
    );


    res.status(200).json({ message: 'Quiz completion tracked.' });
  } catch (error) {
    console.error('Error tracking quiz completion:', error);
    res.status(500).json({ message: 'Failed to track quiz completion.' });
  }
});

// Endpoint to clean up invalid readFicheIds for the authenticated user
app.post('/api/admin/cleanup-read-fiches', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection('users');
    const memofichesCollection = db.collection('memofiches_v2');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentReadFicheIds = user.readFicheIds || [];
    const validReadFicheIds: string[] = [];

    for (const ficheId of currentReadFicheIds) {
      const exists = await memofichesCollection.countDocuments({ _id: new ObjectId(ficheId) });
      if (exists > 0) {
        validReadFicheIds.push(ficheId);
      }
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { readFicheIds: validReadFicheIds } }
    );

    res.status(200).json({ message: 'Read fiches cleaned up successfully.', cleanedCount: currentReadFicheIds.length - validReadFicheIds.length });
  } catch (error) {
    console.error('Error cleaning up read fiches:', error);
    res.status(500).json({ message: 'Failed to clean up read fiches.' });
  }
});

// Endpoint for admin to trigger knowledge base update
app.post('/api/admin/update-knowledge-base', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    console.log(`Knowledge base update initiated by admin: ${req.user?.email}`);
    const result = await updateKnowledgeBase();
    res.status(200).json({
      message: 'Knowledge base update completed successfully.',
      ...result
    });
  } catch (error) {
    console.error('Error during knowledge base update endpoint:', error);
    res.status(500).json({ message: 'Failed to update knowledge base.' });
  }
});

// For any other request (client-side routing), serve index.html
app.get(/.* /, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(+port, '0.0.0.0', () => {
  console.log(`Server listening at http://localhost:${port}`);
});
