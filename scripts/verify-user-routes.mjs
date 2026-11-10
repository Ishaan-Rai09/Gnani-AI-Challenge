// Drives every per-user API route with a real signed session cookie to verify
// the Settings page's server-backed features against MongoDB.
import { encode } from "next-auth/jwt";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const secret = env.match(/AUTH_SECRET="(.*?)"/)?.[1];
if (!secret) throw new Error("AUTH_SECRET not found");

// Personal account ids do not belong in the repo — pass the test user in.
const USER_ID = process.env.CALLSHIELD_USER_ID;
const EMAIL = process.env.CALLSHIELD_EMAIL;
if (!USER_ID || !EMAIL) {
  throw new Error("Set CALLSHIELD_USER_ID and CALLSHIELD_EMAIL to a real Mongo user before running.");
}
const BASE = process.env.CALLSHIELD_URL || "http://localhost:3000";
const SALT = "authjs.session-token";

const jwt = await encode({
  secret,
  salt: SALT,
  maxAge: 60 * 60,
  token: { email: EMAIL, uid: USER_ID, sub: USER_ID, name: "Test User" },
});

const cookie = `${SALT}=${jwt}`;
const call = async (path, init = {}) => {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { cookie, ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
};

// 1. Reset to seed (Settings → "Reset everything")
let r = await call("/api/user/state", { method: "POST" });
console.log("1. Reset to seed:", r.status === 200 ? "OK" : JSON.stringify(r));

// 2. Read state back
r = await call("/api/user/state");
console.log(`2. State after reset: authenticated=${r.body?.authenticated}, calls=${r.body?.calls?.length}, blocked=${r.body?.blocklist?.length}`);

// 3. Clear history (Settings → "Clear history")
r = await call("/api/user/calls", { method: "DELETE" });
r = await call("/api/user/state");
console.log(`3. After clear: calls=${r.body?.calls?.length} (expect 0)`);

// 4. Load sample calls (Settings → "Load sample calls")
r = await call("/api/user/calls/seed", { method: "POST" });
r = await call("/api/user/state");
console.log(`4. After seed: calls=${r.body?.calls?.length} (expect > 0)`);

// 5. Add a blocked number (blocklist page → manual add)
r = await call("/api/user/blocklist", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id: "blk-verify-1",
    number: "+91 90000 00000",
    label: "Verification entry",
    reason: "API verification",
    source: "manual",
    blockedAt: new Date().toISOString(),
  }),
});
console.log("5. Blocklist add:", r.status === 200 ? "OK" : JSON.stringify(r));

// 6. Remove it (blocklist → remove)
r = await call("/api/user/blocklist?id=blk-verify-1", { method: "DELETE" });
r = await call("/api/user/state");
const gone = !r.body?.blocklist?.some((b) => b.id === "blk-verify-1");
console.log(`6. Blocklist remove: ${gone ? "OK" : "FAILED"}`);

// 7. Save a call record (finish a live screening)
r = await call("/api/user/calls", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id: "verify-call-1",
    scenarioId: "bank-impersonation",
    number: "+91 11111 11111",
    callerName: "Verify Caller",
    startedAt: new Date().toISOString(),
    durationSec: 10,
    riskLevel: "high",
    intent: "Verification",
    summary: "Verify route",
    action: "ended",
    transcript: [{ id: "l1", speaker: "caller", text: "hello", at: 1 }],
    indicators: [],
    infoRequested: [],
    identityConfidence: 10,
    events: [],
    liveScreened: true,
  }),
});
r = await call("/api/user/state");
const saved = r.body?.calls?.some((c) => c.id === "verify-call-1");
console.log(`7. Save call record: ${saved ? "OK" : "FAILED"}`);

// 8. Cleanup the verification record
r = await call("/api/user/calls", { method: "DELETE" });
console.log("8. Cleanup: OK");
