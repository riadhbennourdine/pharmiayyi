const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;

async function listCollections() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('pharmia'); // Assuming the database name is 'pharmia'
    const collections = await db.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(col => console.log(col.name));
  } finally {
    await client.close();
  }
}

listCollections().catch(console.error);
