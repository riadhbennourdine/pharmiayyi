import express from 'express';
import path from 'path';
import { generateCaseStudyFromText, getAssistantResponse } from './services/geminiService';
import clientPromise from './services/mongo';
import { ObjectId } from 'mongodb'; // Ajout de l'import ObjectId

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

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
        res.status(500).json({ error: 'Failed to generate case study from text.' });
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
