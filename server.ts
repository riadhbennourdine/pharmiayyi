import express, { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';
import path from 'path';
import { generateCaseStudyFromText, getAssistantResponse } from './services/geminiService';
import clientPromise from './services/mongo';
import { ObjectId } from 'mongodb'; // Ajout de l'import ObjectId
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from './types'; // Import User and UserRole
import crypto from 'crypto';

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

// Middleware to check for admin role
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.ADMIN) {
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

    // Find user by email or username
    const user = await usersCollection.findOne({ 
      $or: [{ email: identifier }, { username: identifier }] 
    });

    if (user) {
      // Generate a reset token only if user exists
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires } }
      );

      // --- Email Sending Placeholder ---
      // In a real application, you would send an email here.
      // The link should be constructed carefully.
      const resetUrl = `http://${req.headers.host}/#/reset-password?token=${resetToken}`;
      console.log(`Password reset link for ${user.email}: ${resetUrl}`); // For debugging
      /*
      const transporter = nodemailer.createTransport({ ... });
      const mailOptions = {
        to: user.email,
        from: 'passwordreset@yourdomain.com',
        subject: 'Réinitialisation de mot de passe PharmIA',
        text: `... Cliquez sur ce lien pour réinitialiser: ${resetUrl} ...`,
      };
      await transporter.sendMail(mailOptions);
      */
      // --- End Email Sending Placeholder ---
    }

    // Always return a generic success message to prevent email enumeration
    res.status(200).json({ message: 'Si votre identifiant est enregistré, vous recevrez un lien de réinitialisation de mot de passe.' });

  } catch (error) {
    console.error('Error during forgot password request:', error);
    // In case of a server error, still avoid confirming if the user exists.
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
        const { text, theme, system } = req.body;
        const result = await generateCaseStudyFromText(text, theme, system);
        res.json(result);
    } catch (error) {
        console.error('Error in /api/generate-case-study-from-text:', error);
        res.status(500).json({ error: 'Failed to generate case study from text.' });
    }
});

app.post('/api/generate-case-study-from-text', async (req, res) => {
    try {
        const { sourceText, theme, system } = req.body;
        if (!sourceText) {
            return res.status(400).json({ error: 'Source text is required.' });
        }
        const generatedCaseStudy = await generateCaseStudyFromText(sourceText, theme || 'Général', system || 'Général');
        res.json(generatedCaseStudy);
    } catch (error) {
        console.error('Error generating case study from text:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ 
            error: 'Failed to generate case study from text.',
            details: errorMessage
        });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, caseContext } = req.body;
        const result = await getAssistantResponse(messages, caseContext);
        res.json({ response: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get assistant response' });
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
    const client = await clientPromise;
    const db = client.db('pharmia');
    const result = await db.collection('memofiches_v2').insertOne(newCase);
    
    // Récupérer le document inséré pour le renvoyer avec son _id généré
    const insertedDocument = await db.collection('memofiches_v2').findOne({ _id: result.insertedId });
    
    res.status(201).json(insertedDocument); // Retourne le document inséré avec son _id
  } catch (error) {
    console.error('Error creating memo fiche:', error);
    res.status(500).json({ error: 'Failed to create memo fiche.' });
  }
});

app.put('/api/memofiches/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCase = req.body;

    // Retirer le champ _id de l'objet à mettre à jour
    const { _id, ...updateData } = updatedCase; 

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

// For any other request (client-side routing), serve index.html
app.get(/.* /, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(+port, '0.0.0.0', () => {
  console.log(`Server listening at http://localhost:${port}`);
});
