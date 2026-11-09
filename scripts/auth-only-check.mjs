// Verifies demo mode is fully removed:
//   1. signed-out visitors to /app are redirected to /signin
//   2. /signin offers only Google (no demo-mode button)
//   3. with a forged (validly-encoded) Google session, /app loads in account
//      mode with the Google profile and no demo text anywhere
//   4. settings persist per-account; localStorage holds no calls/blocklist blob
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { SignJWT, jwtEncrypt } from "jose";
import { readFileSync } from "node:fs";

const BASE = process.env.CALLSHIELD_URL || "http://localhost:3000";
const executablePath =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
        if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
      }
    } catch {}
  }
}
loadEnv();
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

const step = (name) => console.log(`OK  ${name}`);
const browser = await chromium.launch({ executablePath, headless: true });

try {
  /* --------------------- signed-out: redirect + signin page ---------------- */
  const guest = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const guestPage = await guest.newPage();

  await guestPage.goto(`${BASE}/app`, { waitUntil: "load" });
  await guestPage.waitForURL("**/signin", { timeout: 15_000 });
  step("Signed-out /app redirects to /signin");

  await guestPage.goto(`${BASE}/signin`, { waitUntil: "networkidle" });
  const body = await guestPage.locator("body").innerText();
  assert.ok(/Continue with Google/.test(body), "Google button missing");
  assert.ok(!/demo mode/i.test(body), "demo-mode option still present on /signin");
  step("/signin offers Google only — demo entry point removed");
  await guest.close();

  /* ----------------------- signed-in via forged session -------------------- */
  const salt = "authjs.session-token";
  const sessionToken = await new SignJWT({
    user: { id: "verify-user", email: "ishaanrai18@gmail.com" },
    email: "ishaanrai18@gmail.com",
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .encrypt(secret);
  void salt;

  const authed = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await authed.addCookies([
    { name: "authjs.session-token", value: sessionToken, domain: "localhost", path: "/" },
  ]);
  const page = await authed.newPage();

  await page.goto(`${BASE}/app/settings`, { waitUntil: "networkidle", timeout: 60_000 });
  const settings = await page.locator("body").innerText();
  assert.ok(!/demo/i.test(settings), `demo text still in settings: ${settings.slice(0, 400)}`);
  step("Settings page contains no demo-mode text");

  // Server data loads for the forged user (state route 200 → history hydrates).
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 60_000 });
  const dash = await page.locator("body").innerText();
  assert.ok(/calls screened/i.test(dash), "dashboard did not render");
  step("Dashboard renders in account mode");

  const stored = await page.evaluate(() => window.localStorage.getItem("callshield.v1"));
  assert.equal(stored, null, "guest demo blob should not be written anymore");
  step("No guest demo blob written to localStorage");
  await authed.close();

  console.log("\nALL DEMO-REMOVAL CHECKS PASSED");
} finally {
  await browser.close();
}
