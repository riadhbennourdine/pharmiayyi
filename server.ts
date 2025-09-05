import express from 'express';
import path from 'path';
import { generateCaseStudyFromText, getAssistantResponse } from './services/geminiService';
import clientPromise from './services/mongo';

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
        console.error(error);
        res.status(500).json({ error: 'Failed to generate case study' });
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
    const memofiches = await db.collection('memofiches').find({}).toArray();
    res.status(200).json(memofiches);
  } catch (error) {
    console.error('Error fetching memofiches:', error);
    res.status(500).json({ message: 'Failed to fetch memofiches' });
  }
});

// For any other request (client-side routing), serve index.html
app.get(/.* /, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
