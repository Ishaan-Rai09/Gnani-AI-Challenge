import { MongoClient, type Db, type Collection } from "mongodb";

/**
 * MongoDB (Atlas) — per-user call history and blocklist. One client per
 * process; survive Next.js dev-server hot reloads.
 *
 * Call/blocklist row ids are namespaced per user (`${userId}:${recordId}`) so
 * every query is naturally scoped to one account.
 */

export interface UserDoc {
  _id: string;
  googleSub: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

export interface CallDoc {
  _id: string;
  userId: string;
  createdAt: Date;
  startedAt: Date;
  riskLevel: string;
  action: string;
  number: string;
  data: unknown;
}

export interface BlockedDoc {
  _id: string;
  userId: string;
  createdAt: Date;
  number: string;
  data: unknown;
}

const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

export const mongoConfigured = Boolean(process.env.MONGODB_URI?.trim());

async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri?.trim()) throw new Error("MONGODB_URI is not configured");

  const client =
    globalForMongo.mongoClient ??
    new MongoClient(uri, { appName: "callshield" });

  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = client;
    const db = client.db();
    // The email lookup backs the Google sign-in upsert; the userId indexes
    // keep every per-user query bounded.
    await Promise.all([
      db.collection<UserDoc>("users").createIndex({ email: 1 }, { unique: true }),
      db
        .collection<UserDoc>("users")
        .createIndex({ googleSub: 1 }, { unique: true, sparse: true }),
      db.collection<CallDoc>("calls").createIndex({ userId: 1, createdAt: -1 }),
      db.collection<BlockedDoc>("blocked").createIndex({ userId: 1, createdAt: -1 }),
    ]);
  }

  return client.db();
}

export const collections = {
  get users(): Promise<Collection<UserDoc>> {
    return getDb().then((db) => db.collection<UserDoc>("users"));
  },
  get calls(): Promise<Collection<CallDoc>> {
    return getDb().then((db) => db.collection<CallDoc>("calls"));
  },
  get blocked(): Promise<Collection<BlockedDoc>> {
    return getDb().then((db) => db.collection<BlockedDoc>("blocked"));
  },
};
