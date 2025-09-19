const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;

async function fetchSampleDocuments() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('pharmia');

    console.log('--- Sample from memofiches_v2 ---');
    const memofiche = await db.collection('memofiches_v2').findOne({});
    console.log(JSON.stringify(memofiche, null, 2));

    console.log('\n--- Sample from users ---');
    const user = await db.collection('users').findOne({});
    console.log(JSON.stringify(user, null, 2));

  } finally {
    await client.close();
  }
}

fetchSampleDocuments().catch(console.error);
