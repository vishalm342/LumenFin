import { MongoClient, Db } from 'mongodb';

// ========================================
// CRITICAL: Environment Variable Validation
// ========================================
// This check happens at module initialization (server startup)
// If MONGODB_URI is missing, the server will fail loudly and immediately
// rather than causing 500 errors during runtime.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    '❌ FATAL: MONGODB_URI environment variable is not defined!\n' +
    '   → Please add MONGODB_URI to your .env.local file\n' +
    '   → Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname\n' +
    '   → See .env.local.example for reference'
  );
}

// Production diagnostics (do not log secrets)
console.log('✅ DB_URI_LOADED:', Boolean(MONGODB_URI));

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
  // MONGODB_URI is guaranteed to be defined due to top-level check
  // This assertion is safe because we throw at module init if undefined
  const uri = MONGODB_URI as string;

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

    cached.promise = MongoClient.connect(uri, opts).then((client) => {
      const db = client.db('LumenFin');
      console.log('✅ MongoDB connected successfully to database: LumenFin');
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
