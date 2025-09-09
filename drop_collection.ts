import { MongoClient } from 'mongodb';

const uri = "mongodb://mongo:YoEfFXGVQwTTQlnwwPYRKwdIrgEqXrNp@centerbeam.proxy.rlwy.net:33803";

async function dropCollection() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('pharmia');
    const collection = db.collection('memofiches_v2');

    const result = await collection.drop();
    console.log('Collection memofiches_v2 dropped:', result);
  } catch (error) {
    console.error('Error dropping collection:', error);
  } finally {
    await client.close();
  }
}

dropCollection();