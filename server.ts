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
import * as Brevo from '@getbrevo/brevo';
import axios from 'axios';

// --- PAYMENT INTERFACE ---
interface Payment {
  _id?: ObjectId;
  userId: ObjectId;
  planName: string;
  amount: number;
  isAnnual: boolean;
  paymentRef?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// --- EMAIL SENDING SETUP (Brevo API) ---
const brevoApiKey = process.env.EMAIL_API_KEY;

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

const sendEmail = async (options: EmailOptions) => {
    if (!brevoApiKey) {
        console.log('****************************************************************');
        console.log('*** WARNING: Email sending is not configured.             ***');
        console.log('*** Set EMAIL_API_KEY in your environment variables.      ***');
        console.log('*** Email content that would have been sent:             ***');
        console.log('****************************************************************');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`HTML Body: ${options.html}`);
        console.log('****************************************************************');
        return; // Skip sending email if not configured
    }

    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;
    sendSmtpEmail.textContent = options.text;
    sendSmtpEmail.sender = {
        name: 'PharmIA',
        // This email MUST be a validated sender in your Brevo account.
        email: process.env.EMAIL_FROM || 'noreply@pharmia.app',
    };
    sendSmtpEmail.to = [{ email: options.to }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully via Brevo. Response:', JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('Error sending email via Brevo:', error);
        if (error.response && error.response.body) {
            console.error('Brevo Error Details:', error.response.body);
        }
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
app.set('trust proxy', 1); // Trust proxy headers from Railway
const port = process.env.PORT || 3001;

app.use(express.json());

// Middleware to protect routes
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = (req.headers as IncomingHttpHeaders).authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  // console.log(`[DEBUG] AuthMiddleware received token: ${token ? token.substring(0, 10) + '...' : 'No token'}`); // Removed
  const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';

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

const subscriptionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  const client = await clientPromise;
  const db = client.db('pharmia');
  const usersCollection = db.collection<User>('users');

  const user = await usersCollection.findOne({ _id: new ObjectId(req.user._id) });

  if (!user) {
    return res.status(401).json({ message: 'Utilisateur non trouvé.' });
  }

  // Admins and Formateurs have unrestricted access
  if (user.role === UserRole.ADMIN || user.role === UserRole.FORMATEUR) {
    return next();
  }

  // Check for free week (1 week from registration date)
  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
  const isWithinFreeWeek = user.createdAt && (new Date().getTime() - new Date(user.createdAt).getTime() <= oneWeekInMs);

  if (isWithinFreeWeek) {
    return next(); // Allow access during free week
  }

  // Check if the specific memo fiche is free (only if accessing a fiche by ID)
  if (req.params.id && ObjectId.isValid(req.params.id)) {
    const memofichesCollection = db.collection('memofiches_v2');
    const fiche = await memofichesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (fiche && fiche.isFree) {
      return next(); // Allow access if fiche is marked as free
    }
  }

  // Standard subscription check
  const hasActiveSub = user.hasActiveSubscription === true;
  const subNotExpired = user.subscriptionEndDate && user.subscriptionEndDate > new Date();

  if (hasActiveSub && subNotExpired) {
    next();
  } else {
    res.status(403).json({ message: 'Accès réservé aux abonnés.' });
  }
};

// --- KONNECT PAYMENT ENDPOINTS ---
app.post('/api/payment/initiate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { planName, amount, isAnnual } = req.body;
    const userId = req.user?._id;

    if (!userId || !planName || !amount) {
      return res.status(400).json({ message: 'Missing required payment details.' });
    }

                const konnectApiKey = process.env.KONNECT_API_KEY;            const konnectWalletId = process.env.KONNECT_WALLET_ID;
    const konnectApiBaseUrl = process.env.KONNECT_API_BASE_URL || 'https://api.konnect.network/api/v2';

    if (!konnectApiKey || !konnectWalletId) {
      console.error('Konnect API keys not configured.');
      return res.status(500).json({ message: 'Payment service not configured.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const paymentsCollection = db.collection<Payment>('payments');

    // Create a pending payment record in our DB
    const newPayment: Payment = {
      userId: new ObjectId(userId),
      planName,
      amount,
      isAnnual,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await paymentsCollection.insertOne(newPayment);
    const paymentId = result.insertedId; // Use this as orderId for Konnect

    const konnectPayload = {
      receiverWalletId: konnectWalletId,
      token: 'TND', // Assuming TND for now
      amount: amount * 1000, // Convert to millimes
      type: 'immediate',
      description: `Subscription for ${planName} plan`,
      acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
      lifespan: 60, // 60 minutes
      checkoutForm: true,
      addPaymentFeesToAmount: false,
      firstName: req.user?.firstName || '',
      lastName: req.user?.lastName || '',
      phoneNumber: req.user?.phoneNumber || '',
      email: req.user?.email || '',
      orderId: paymentId.toHexString(), // Use our internal payment ID
      webhook: `${req.protocol}://${req.get('host')}/api/payment/webhook/konnect`, // Dynamic webhook URL
      theme: 'light',
    };

    const konnectResponse = await axios.post(`${konnectApiBaseUrl}/payments/init-payment`, konnectPayload, {
      headers: {
        'x-api-key': konnectApiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('Konnect API Response Status:', konnectResponse.status);
    console.log('Konnect API Response Data:', JSON.stringify(konnectResponse.data, null, 2));

    const { payUrl, paymentRef } = konnectResponse.data;

    // Update our payment record with Konnect's paymentRef
    await paymentsCollection.updateOne(
      { _id: paymentId },
      { $set: { paymentRef, updatedAt: new Date() } }
    );

    res.status(200).json({ payUrl });

  } catch (error: any) {
    console.error('Error initiating Konnect payment:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to initiate payment.' });
  }
});

app.get('/api/payment/webhook/konnect', async (req: Request, res: Response) => {
  try {
    const paymentRef = req.query.payment_ref as string;

    if (!paymentRef) {
      return res.status(400).json({ message: 'Missing payment_ref in webhook.' });
    }

    const konnectApiKey = process.env.KONNECT_API_KEY;
    if (!konnectApiKey) {
      console.error('Konnect API key not configured for webhook.');
      return res.status(500).json({ message: 'Payment service not configured.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const paymentsCollection = db.collection<Payment>('payments');
    const usersCollection = db.collection<User>('users');

    const konnectApiBaseUrl = process.env.KONNECT_API_BASE_URL || 'https://api.konnect.network/api/v2';

    // Get payment details from Konnect
    const konnectResponse = await axios.get(`${konnectApiBaseUrl}/payments/${paymentRef}`,
      {
        headers: {
          'x-api-key': konnectApiKey,
        },
      }
    );

    console.log('Konnect Webhook API Response Status:', konnectResponse.status);
    console.log('Konnect Webhook API Response Data:', JSON.stringify(konnectResponse.data, null, 2));

    const konnectPayment = konnectResponse.data.payment;

    if (!konnectPayment) {
      return res.status(404).json({ message: 'Payment not found in Konnect.' });
    }

    // Find our internal payment record using orderId (which is our _id)
    const internalPayment = await paymentsCollection.findOne({ _id: new ObjectId(konnectPayment.orderId) });

    if (!internalPayment) {
      console.error(`Internal payment record not found for orderId: ${konnectPayment.orderId}`);
      return res.status(404).json({ message: 'Internal payment record not found.' });
    }

    // Update payment status in our DB
    let newStatus: Payment['status'] = 'pending';
    if (konnectPayment.status === 'completed') {
      newStatus = 'completed';
      // Update user's subscription based on the plan
      const user = await usersCollection.findOne({ _id: internalPayment.userId });
      if (user) {
        const subscriptionEndDate = new Date();
        if (internalPayment.isAnnual) {
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        } else {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        }

        await usersCollection.updateOne(
          { _id: internalPayment.userId },
          { 
            $set: { 
              hasActiveSubscription: true,
              subscriptionEndDate: subscriptionEndDate,
              updatedAt: new Date() 
            }
          }
        );
        console.log(`User ${user.email} successfully subscribed to ${internalPayment.planName}. Subscription ends on ${subscriptionEndDate.toISOString()}`);
      }
    } else if (konnectPayment.status === 'failed') {
      newStatus = 'failed';
    }

    await paymentsCollection.updateOne(
      { _id: internalPayment._id },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );

    res.status(200).json({ message: 'Webhook received and processed.' });

  } catch (error: any) {
    console.error('Error processing Konnect webhook:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to process webhook.' });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
    const { email, username, password, role, pharmacistId, firstName, lastName } = req.body;

    if (!email || !username || !password || !role || !firstName || !lastName) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
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
      firstName,
      lastName,
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
    const profileIncomplete = !user.firstName || !user.lastName || !user.email || (user.role === UserRole.PREPARATEUR && !user.pharmacistId);

    res.status(200).json({ message: 'Logged in successfully.', token, user: { ...userWithoutPassword, profileIncomplete } });
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

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    await sendEmail({
      to: 'contact@pharmaconseilbmb.com',
      subject: `Nouveau message de contact: ${subject}`,
      text: `De: ${name} (${email})\n\nSujet: ${subject}\n\nMessage:\n${message}`,
      html: `<p>De: <strong>${name}</strong> (${email})</p><p>Sujet: <strong>${subject}</strong></p><p>Message:</p><p>${message}</p>`,
    });

    res.status(200).json({ message: 'Votre message a été envoyé avec succès.' });
  } catch (error) {
    console.error('Error sending contact form email:', error);
    res.status(500).json({ message: 'Une erreur est survenue lors de l\'envoi de votre message.' });
  }
});

// Profile update endpoint
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { email, password, pharmacistId, firstName, lastName } = req.body; // Added firstName and lastName
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

    // Add firstName and lastName to updateFields if provided
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;

    // Handle pharmacistId update only if the user is a PREPARATEUR
    if (currentUser.role === UserRole.PREPARATEUR) {
        if (pharmacistId) { // Only update if pharmacistId is explicitly provided
            // Verify if pharmacistId corresponds to an existing PHARMACIEN user
            const pharmacist = await usersCollection.findOne({ _id: new ObjectId(pharmacistId), role: UserRole.PHARMACIEN });
            if (!pharmacist) {
                return res.status(400).json({ message: 'Pharmacien référent invalide.' });
            }
            updateFields.pharmacistId = new ObjectId(pharmacistId);
        }
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
      { projection: { _id: 1, email: 1, firstName: 1, lastName: 1 } } // Include firstName and lastName
    ).toArray();

    res.status(200).json(pharmacists);
  } catch (error) {
    console.error('Error fetching pharmacists:', error);
    res.status(500).json({ message: 'Failed to fetch pharmacists.' });
  }
});

// Get list of preparateurs
app.get('/api/users/preparateurs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const preparateurs = await usersCollection.find(
      { role: UserRole.PREPARATEUR },
      { projection: { _id: 1, email: 1, username: 1, firstName: 1, lastName: 1, pharmacistId: 1 } }
    ).toArray();

    res.status(200).json(preparateurs);
  } catch (error) {
    console.error('Error fetching preparateurs:', error);
    res.status(500).json({ message: 'Failed to fetch preparateurs.' });
  }
});

// Assign Pharmacist to Preparateur endpoint (Admin only)
app.put('/api/users/:id/assign-pharmacist', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { pharmacistId } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID utilisateur invalide.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    // Verify the preparateur exists and has the PREPARATEUR role
    const preparateur = await usersCollection.findOne({ _id: new ObjectId(id), role: UserRole.PREPARATEUR });
    if (!preparateur) {
      return res.status(404).json({ message: 'Préparateur non trouvé ou rôle incorrect.' });
    }

    // If pharmacistId is provided, verify it corresponds to an existing PHARMACIEN user
    let newPharmacistObjectId = null;
    if (pharmacistId) {
      if (!ObjectId.isValid(pharmacistId)) {
        return res.status(400).json({ message: 'ID pharmacien invalide.' });
      }
      const pharmacist = await usersCollection.findOne({ _id: new ObjectId(pharmacistId), role: UserRole.PHARMACIEN });
      if (!pharmacist) {
        return res.status(400).json({ message: 'Pharmacien référent invalide.' });
      }
      newPharmacistObjectId = new ObjectId(pharmacistId);
    }

    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { pharmacistId: newPharmacistObjectId, updatedAt: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Préparateur non trouvé.' });
    }

    res.status(200).json({ message: 'Pharmacien référent attribué avec succès.' });

  } catch (error) {
    console.error('Error assigning pharmacist to preparateur:', error);
    res.status(500).json({ message: 'Internal server error during assignment.' });
  }
});

// Get user by ID (public profile details)
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID utilisateur invalide.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } } // Exclude sensitive fields
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
});

// Get list of preparateurs by pharmacist ID
app.get('/api/users/preparateurs-by-pharmacist/:pharmacistId', authMiddleware, async (req, res) => {
  try {
    const { pharmacistId } = req.params;

    if (!ObjectId.isValid(pharmacistId)) {
      return res.status(400).json({ message: 'ID pharmacien invalide.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    // Ensure the requesting user is the pharmacist themselves or an admin/formateur
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.FORMATEUR && req.user?._id?.toString() !== pharmacistId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const preparateurs = await usersCollection.find(
      { role: UserRole.PREPARATEUR, pharmacistId: new ObjectId(pharmacistId) },
      { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } } // Exclude sensitive fields
    ).toArray();

    res.status(200).json(preparateurs);
  } catch (error) {
    console.error('Error fetching preparateurs by pharmacist ID:', error);
    res.status(500).json({ message: 'Failed to fetch preparateurs by pharmacist ID.' });
  }
});

// Get user learning journey details by ID
app.get('/api/users/:id/learning-journey', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id; // Current authenticated user

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID utilisateur invalide.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const targetUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Authorization check: Only the user themselves, their pharmacist, or an admin/formateur can view
    const isAuthorized = (
      userId?.toString() === id || // User viewing their own journey
      (req.user?.role === UserRole.PHARMACIEN && targetUser.pharmacistId?.toString() === userId?.toString()) || // Pharmacist viewing their preparateur
      req.user?.role === UserRole.ADMIN ||
      req.user?.role === UserRole.FORMATEUR
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas autorisé à voir ce parcours.' });
    }

    // Project only the learning journey related fields
    const learningJourney = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { readFicheIds: 1, quizHistory: 1, viewedMediaIds: 1 } }
    );

    res.status(200).json(learningJourney);
  } catch (error) {
    console.error('Error fetching user learning journey:', error);
    res.status(500).json({ message: 'Failed to fetch user learning journey.' });
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
app.post('/api/custom-chat', authMiddleware, subscriptionMiddleware, async (req, res) => {
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

app.get('/api/memofiches', authMiddleware, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('pharmia'); // Specify the database name

    const usersCollection = db.collection<User>('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user!._id) });

    const hasActiveSub = user?.hasActiveSubscription === true && user?.subscriptionEndDate && user.subscriptionEndDate > new Date();
    const isAdminOrFormateur = user?.role === UserRole.ADMIN || user?.role === UserRole.FORMATEUR;

    // Check for free week
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
    const userCreationDate = user?.createdAt ? new Date(user.createdAt) : null;
    const isWithinFreeWeek = userCreationDate && !isNaN(userCreationDate.getTime()) && (new Date().getTime() - userCreationDate.getTime() <= oneWeekInMs);

    const memofiches = await db.collection('memofiches_v2').find({}).toArray();

    const processedMemofiches = memofiches.map(fiche => {
      const shouldBeLocked = !(isAdminOrFormateur || hasActiveSub || isWithinFreeWeek || fiche.isFree);
      return {
        ...fiche,
        isLocked: shouldBeLocked,
      };
    });

    res.status(200).json(processedMemofiches);
  } catch (error: any) {
    console.error('Error in /api/memofiches handler:', error);
    res.status(500).json({ message: 'Failed to fetch memofiches list.' });
  }
});

// Endpoint to get total number of memo fiches
app.get('/api/memofiches/count', async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('pharmia');
    const count = await db.collection('memofiches_v2').countDocuments();
    res.status(200).json({ count });
  } catch (error: any) {
    console.error('Error fetching memo fiches count:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch memo fiches count.' });
  }
});

// Endpoint to get a single memo fiche by ID
app.get('/api/memofiches/:id', authMiddleware, subscriptionMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de mémofiche invalide.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const memoFiche = await db.collection('memofiches_v2').findOne({ _id: new ObjectId(id) });

    if (!memoFiche) {
      return res.status(404).json({ message: 'Mémofiche non trouvée.' });
    }

    res.status(200).json(memoFiche);
  } catch (error: any) {
    console.error('Error fetching single memo fiche:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch memo fiche.' });
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
    }
    else {
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
  } catch (error: any) {
    console.error('Error fetching memo fiches count:', error.message, error.stack);
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
      { projection: { readFicheIds: 1, quizHistory: 1, viewedMediaIds: 1 } }
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

// Endpoint to track viewed media
app.post('/api/user/track-media-view', authMiddleware, async (req, res) => {
  try {
    const { mediaId } = req.body;
    const userId = req.user?._id;

    if (!mediaId) {
      return res.status(400).json({ message: 'Media ID is required.' });
    }
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection('users');

    // Add mediaId to viewedMediaIds array if it doesn't already exist
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { viewedMediaIds: mediaId } }
    );

    res.status(200).json({ message: 'Media marked as viewed.' });
  } catch (error) {
    console.error('Error tracking media view:', error);
    res.status(500).json({ message: 'Failed to track media view.' });
  }
});

// Endpoint to get details of specific memo fiches
app.post('/api/memofiches/details', authMiddleware, subscriptionMiddleware, async (req, res) => {
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

    const { quizId, score, ficheId } = req.body; // Add ficheId

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection('users');

    // Ensure quizId is a string and score is a number
    const newQuizEntry: { quizId: string; score: number; completedAt: Date; ficheId?: string } = {
      quizId: String(quizId),
      score: Number(score),
      completedAt: new Date(),
      ficheId: ficheId ? String(ficheId) : undefined, // Add ficheId
    };

    // Add quiz completion to quizHistory array
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { quizHistory: newQuizEntry } as any }
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

// Endpoint for admin to get a list of subscribers
app.get('/api/admin/subscribers', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const pharmacistsWithCollaborators = await usersCollection.aggregate<PharmacistWithCollaborators>([
      { $match: { role: UserRole.PHARMACIEN } },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'pharmacistId',
          as: 'collaborators',
          pipeline: [
            { $project: { _id: 1, email: 1, firstName: 1, lastName: 1, role: 1, hasActiveSubscription: 1, subscriptionEndDate: 1, planName: 1 } }
          ]
        }
      },
      { $project: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          role: 1,
          hasActiveSubscription: 1,
          subscriptionEndDate: 1,
          planName: 1,
          createdAt: 1,
          collaborators: 1,
        }
      }
    ]).toArray();

    res.status(200).json(pharmacistsWithCollaborators);
  } catch (error) {
    console.error('Error fetching pharmacists with collaborators:', error);
    res.status(500).json({ message: 'Failed to fetch pharmacists with collaborators.' });
  }
});

// Endpoint for admin to grant/modify subscriptions
app.post('/api/admin/grant-subscription', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { userId, durationInDays, planName } = req.body;

    if (!userId || !durationInDays || !planName) {
      return res.status(400).json({ message: 'Missing required fields: userId, durationInDays, planName.' });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId format.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationInDays);

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: {
          hasActiveSubscription: true,
          subscriptionEndDate: subscriptionEndDate,
          planName: planName, // Assuming planName can be stored on user
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'Subscription granted/modified successfully.' });

  } catch (error) {
    console.error('Error granting subscription:', error);
    res.status(500).json({ message: 'Failed to grant subscription.' });
  }
});

// For any other request (client-side routing), serve index.html
app.get(/.* /, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(+port, '0.0.0.0', () => {
  console.log(`Server listening at http://localhost:${port}`);
});
