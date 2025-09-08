import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;

if (!uri) {
  console.error('FATAL ERROR: MONGO_URL environment variable is not defined.');
  console.error('Please set the MONGO_URL environment variable to your MongoDB connection string.');
  process.exit(1);
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {});
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, {});
  clientPromise = client.connect();
}

export default clientPromise;
