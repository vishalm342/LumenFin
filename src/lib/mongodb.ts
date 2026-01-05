import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global cache to prevent multiple connections in serverless environments (Singleton pattern)
interface CachedConnection {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

let cached: CachedConnection = (global as any).mongoConnection;

if (!cached) {
  cached = (global as any).mongoConnection = { client: null, db: null, promise: null };
}

export async function connectDB(): Promise<{ client: MongoClient; db: Db }> {
  // Return cached connection if available
  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db };
  }

  // Create new connection if promise doesn't exist
  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
      const db = client.db('LumenFin');
      return { client, db };
    });
  }

  // Wait for connection and cache it
  const { client, db } = await cached.promise;
  cached.client = client;
  cached.db = db;

  return { client, db };
}

export default connectDB;
