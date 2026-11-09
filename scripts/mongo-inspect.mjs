// Quick look at what's actually stored in the cluster.
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const uri = env.match(/MONGODB_URI="(.*?)"/)?.[1];
if (!uri) throw new Error("MONGODB_URI not found in .env.local");

const client = new MongoClient(uri, { appName: "callshield-inspect" });
try {
  await client.connect();
  const db = client.db();
  const users = await db.collection("users").find({}).toArray();
  console.log(`USERS (${users.length}):`);
  for (const u of users) {
    console.log(`  - _id: ${u._id} (${u._id?.constructor?.name}) | email: ${u.email} | name: ${u.name} | googleSub: ${u.googleSub ? "set" : "missing"}`);
  }
  const calls = await db.collection("calls").countDocuments();
  const blocked = await db.collection("blocked").countDocuments();
  console.log(`CALLS: ${calls} | BLOCKED: ${blocked}`);
} finally {
  await client.close();
}
