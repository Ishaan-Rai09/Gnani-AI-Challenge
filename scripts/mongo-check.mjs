// Live check of the Atlas connection: ping, unique-email index, round-trip.
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const match = env.match(/MONGODB_URI="(.*?)"/);
if (!match) throw new Error("MONGODB_URI not found in .env");

const client = new MongoClient(match[1], { appName: "callshield-check" });

try {
  await client.connect();
  const db = client.db(); // db name comes from the URI (callshieldAI)
  const ping = await db.command({ ping: 1 });
  console.log("PING:", ping.ok === 1 ? "ok" : ping);

  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });
  console.log("INDEX email_1: created");

  const probe = { _id: "check:probe", userId: "check", email: "probe@callshield.test", createdAt: new Date() };
  await users.insertOne(probe, { forceServerObjectId: undefined }).catch(async (e) => {
    if (e.code !== 11000) throw e;
    // duplicate from a previous run: fine, replace it
    await users.replaceOne({ _id: "check:probe" }, probe);
  });
  const back = await users.findOne({ _id: "check:probe" });
  console.log("ROUND-TRIP:", back?.email === "probe@callshield.test" ? "ok" : "FAILED");

  await users.deleteOne({ _id: "check:probe" });
  console.log("CLEANUP: ok");

  const names = await db.listCollections().toArray();
  console.log("DB NAME:", db.databaseName);
  console.log("COLLECTIONS:", names.map((c) => c.name).join(", ") || "(empty — created on first sign-in)");
} finally {
  await client.close();
}
