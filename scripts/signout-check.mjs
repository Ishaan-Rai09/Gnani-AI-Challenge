// Verifies the sign-out button clears the session, per-user local state
// boundaries hold, and no CSP violations occur on the dashboard.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encode } from "next-auth/jwt";
import { chromium } from "playwright-core";

const BASE = process.env.CALLSHIELD_URL || "http://localhost:3000";
const executablePath =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const secret = readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(
  /AUTH_SECRET="(.*?)"/
)?.[1];
if (!secret) throw new Error("AUTH_SECRET not found in .env.local");

const SALT = "authjs.session-token";
const UID = `signout-${Date.now().toString(36)}`;
const token = await encode({
  secret,
  salt: SALT,
  maxAge: 3600,
  token: { email: "signout@example.invalid", uid: UID, sub: UID, name: "Sign Out Test" },
});

const step = (name) => console.log(`OK  ${name}`);
const browser = await chromium.launch({ executablePath, headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addCookies([{ name: SALT, value: token, domain: "localhost", path: "/" }]);
  const page = await context.newPage();
  const cspErrors = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/content security policy/i.test(text)) cspErrors.push(text);
  });

  await page.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.getByRole("button", { name: "Sign out" }).first().waitFor({ timeout: 30_000 });
  step("Dashboard loads for a signed-in user");

  await page.waitForFunction(
    (uid) => Object.keys(window.localStorage).includes(`callshield.v1.account.${uid}`),
    UID,
    { timeout: 20_000 }
  );
  const keys = await page.evaluate(() => Object.keys(window.localStorage));
  assert.ok(keys.includes(`callshield.v1.account.${UID}`), `missing per-user prefs key: ${keys}`);
  assert.ok(!keys.includes("callshield.v1"), "legacy shared blob is still present");
  step("Local settings are namespaced per account; legacy blob removed");

  const signOut = page.getByRole("button", { name: "Sign out" }).first();
  await signOut.click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 30_000 });
  step("Sign-out button ends the session and returns to the landing page");

  const cookies = await context.cookies();
  assert.equal(
    cookies.some((entry) => entry.name === SALT && entry.value),
    false,
    "session cookie still present after sign-out"
  );
  step("Session cookie cleared");

  const cachedPaths = await page.evaluate(async () => {
    if (!("caches" in window)) return [];
    const paths = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) paths.push(new URL(request.url).pathname);
    }
    return paths;
  });
  assert.equal(
    cachedPaths.some((path) => path.startsWith("/api/") || path.startsWith("/app")),
    false,
    `private URLs survived sign-out: ${cachedPaths.join(", ")}`
  );
  step("No private API or app responses remain in Cache Storage");

  assert.deepEqual(cspErrors, [], `CSP violations: ${cspErrors.join(" | ")}`);
  step("No Content-Security-Policy violations");

  await context.close();
  console.log("\nALL SIGN-OUT / CLIENT-STORAGE CHECKS PASSED");
} finally {
  await browser.close();
}
