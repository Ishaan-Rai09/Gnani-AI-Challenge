// Runtime security checks against a running server.
//
//   node scripts/security-check.mjs
//
// Verifies: unauthenticated proxies are closed, tenant routes require a
// session, CSRF origin checks work, payloads are validated, responses are
// no-store, and the security headers are present. Uses a throwaway user id and
// cleans up after itself.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encode } from "next-auth/jwt";

const BASE = process.env.CALLSHIELD_URL || "http://localhost:3000";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const secret = env.match(/AUTH_SECRET="?(.*?)"?\s*$/m)?.[1];
if (!secret) throw new Error("AUTH_SECRET not found in .env.local");

const SALT = "authjs.session-token";
const UID = `seccheck-${Date.now().toString(36)}`;
const EMAIL = "security-check@example.invalid";
const cookie = `${SALT}=${await encode({
  secret,
  salt: SALT,
  maxAge: 3600,
  token: { email: EMAIL, uid: UID, sub: UID, name: "Security Check" },
})}`;

const step = (name) => console.log(`OK  ${name}`);
const hit = (path, init = {}) => fetch(BASE + path, init);
const authed = (path, init = {}) =>
  hit(path, { ...init, headers: { cookie, ...(init.headers ?? {}) } });

/* ------------------------- unauthenticated surface ------------------------ */
for (const [path, init] of [
  ["/api/user/state", {}],
  ["/api/user/calls", { method: "POST", body: "{}" }],
  ["/api/user/calls/seed", { method: "POST" }],
  ["/api/user/blocklist", { method: "POST", body: "{}" }],
  ["/api/integrations/status", {}],
  ["/api/voice/tts", { method: "POST", body: JSON.stringify({ text: "hi", voice: "Isha" }) }],
  ["/api/voice/stt", { method: "POST", body: new FormData() }],
]) {
  const response = await hit(path, init);
  assert.equal(response.status, 401, `${path} should be 401, got ${response.status}`);
}
step("Voice proxies and user APIs reject unauthenticated requests");

/* ---------------------------- security headers ---------------------------- */
const home = await hit("/");
const csp = home.headers.get("content-security-policy") ?? "";
assert.match(csp, /frame-ancestors 'none'/);
assert.match(csp, /object-src 'none'/);
assert.equal(home.headers.get("x-frame-options"), "DENY");
assert.equal(home.headers.get("x-content-type-options"), "nosniff");
assert.match(home.headers.get("referrer-policy") ?? "", /strict-origin/);
assert.match(home.headers.get("permissions-policy") ?? "", /microphone=\(self\)/);
assert.equal(home.headers.get("x-powered-by"), null);
step("CSP, clickjacking, MIME, referrer and permissions headers are set");

/* ------------------------------- CSRF guard ------------------------------- */
const csrf = await authed("/api/user/calls", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
  body: "{}",
});
assert.equal(csrf.status, 403);
step("Cross-origin writes are rejected (403)");

/* --------------------------- tenant isolation ---------------------------- */
const state = await authed("/api/user/state");
assert.equal(state.status, 200);
assert.equal(state.headers.get("cache-control"), "no-store, max-age=0");
const empty = await state.json();
assert.deepEqual(empty.calls, []);
assert.deepEqual(empty.blocklist, []);
step("Signed-in state is loaded with Cache-Control: no-store");

/* --------------------------- payload validation -------------------------- */
const origin = { "Content-Type": "application/json", Origin: BASE };

const badRecord = await authed("/api/user/calls", {
  method: "POST",
  headers: origin,
  body: JSON.stringify({ id: "../../etc/passwd", number: "1" }),
});
assert.equal(badRecord.status, 400);
step("Malformed call records are rejected");

const record = {
  id: "sec-call-1",
  scenarioId: "security-check",
  number: "+91 99999 00001",
  callerName: "Test Caller",
  claimedOrg: null,
  startedAt: new Date().toISOString(),
  durationSec: 12,
  riskLevel: "high",
  intent: "Security check",
  summary: "Created by the security check.",
  action: "blocked",
  transcript: [
    { id: "sec-line-1", speaker: "caller", text: "Hello", at: 1 },
    { id: "bad id!", speaker: "caller", text: "dropped", at: 2 },
  ],
  indicators: [],
  infoRequested: ["OTP"],
  identityConfidence: 20,
  events: [],
  liveScreened: true,
  // Unknown fields must be stripped, not persisted.
  hacked: "<script>alert(1)</script>",
  __proto__: { polluted: true },
};
const saved = await authed("/api/user/calls", {
  method: "POST",
  headers: origin,
  body: JSON.stringify(record),
});
assert.equal(saved.status, 200);
step("Valid call records are accepted");

const after = await (await authed("/api/user/state")).json();
const stored = after.calls.find((call) => call.id === "sec-call-1");
assert.ok(stored, "saved call missing from state");
assert.equal(stored.hacked, undefined);
assert.equal(stored.transcript.length, 1);
assert.equal(stored.transcript[0].id, "sec-line-1");
step("Stored records are sanitized (unknown fields and bad entries dropped)");

const blocked = await authed("/api/user/blocklist", {
  method: "POST",
  headers: origin,
  body: JSON.stringify({
    id: "sec-blk-1",
    number: "+91 99999 00001",
    label: "Security check",
    reason: "Test",
    source: "manual",
    blockedAt: new Date().toISOString(),
  }),
});
assert.equal(blocked.status, 200);
const duplicate = await authed("/api/user/blocklist", {
  method: "POST",
  headers: origin,
  body: JSON.stringify({
    id: "sec-blk-2",
    number: "+919999900001",
    label: "Security check",
    reason: "Test",
    source: "manual",
    blockedAt: new Date().toISOString(),
  }),
});
assert.equal((await duplicate.json()).duplicate, true);
step("Blocklist validates and de-duplicates normalized numbers");

const badDelete = await authed("/api/user/blocklist?id=..%2F..%2Fetc", { method: "DELETE" });
assert.equal(badDelete.status, 400);
step("Blocklist deletion rejects malformed ids");

/* --------------------------- authenticated voice -------------------------- */
const badVoice = await authed("/api/voice/tts", {
  method: "POST",
  headers: origin,
  body: JSON.stringify({ text: "hello", voice: "!!!!!!!!" }),
});
assert.equal(badVoice.status, 400);
const badStt = await authed("/api/voice/stt", { method: "POST", body: new FormData() });
assert.equal(badStt.status, 400);
step("Authenticated voice routes still validate input");

const status = await authed("/api/integrations/status");
assert.equal(status.status, 200);
assert.equal(status.headers.get("cache-control"), "no-store, max-age=0");
const statusBody = await status.json();
assert.equal(statusBody.apiKey, undefined);
assert.equal(JSON.stringify(statusBody).includes(secret), false);
step("Integration status is authenticated and leaks no secrets");

/* -------------------------------- cleanup -------------------------------- */
assert.equal((await authed("/api/user/blocklist?id=sec-blk-1", { method: "DELETE" })).status, 200);
assert.equal((await authed("/api/user/calls", { method: "DELETE" })).status, 200);
const cleaned = await (await authed("/api/user/state")).json();
assert.equal(cleaned.calls.length, 0);
assert.equal(cleaned.blocklist.length, 0);
step("Test data cleaned up");

console.log("\nALL SECURITY CHECKS PASSED");
