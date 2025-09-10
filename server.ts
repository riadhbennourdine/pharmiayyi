import express, { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';
import path from 'path';
import { generateCaseStudyFromText, getAssistantResponse } from './services/geminiService';
import clientPromise from './services/mongo';
import { ObjectId } from 'mongodb'; // Ajout de l'import ObjectId
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from './types'; // Import User and UserRole

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser: User = {
      email,
      passwordHash,
      role: UserRole.PREPARATEUR, // Default role for new registrations
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    
    // Exclude passwordHash from the response for security
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

    res.status(200).json({ message: 'Logged in successfully.', token, user: userWithoutPassword });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Profile update endpoint
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user?._id; // Get user ID from authenticated request

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const usersCollection = db.collection<User>('users');

    const updateFields: any = { updatedAt: new Date() };

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
      res.status(200).json({ message: 'Profile updated successfully.', user: userWithoutPassword });
    } else {
      res.status(500).json({ message: 'Failed to retrieve updated user data.' });
    }

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error during profile update.' });
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

app.put('/api/memofiches/:id', async (req, res) => {
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

// For any other request (client-side routing), serve index.html
app.get(/.* /, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(+port, '0.0.0.0', () => {
  console.log(`Server listening at http://localhost:${port}`);
});
