import { User } from './types'; // Correct path for User
import { MongoClient, Db } from 'mongodb'; // Import MongoClient and Db

declare global {
  namespace NodeJS {
    interface Global {
      _mongoClientPromise: Promise<MongoClient>;
      mongo: {
        client: MongoClient;
        db: Db;
      };
    }
  }
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}