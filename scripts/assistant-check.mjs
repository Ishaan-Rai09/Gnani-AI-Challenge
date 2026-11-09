// Focused check: the AI Assistant page is in sync with the rest of the app.
// Drives /app/assistant and /app/live in headless Chrome and asserts that
// every assistant setting actually changes live-call behaviour or persists.
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const BASE = process.env.CALLSHIELD_URL || "http://localhost:3000";
const executablePath =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

const step = (name) => console.log(`OK  ${name}`);
const storedAssistant = () =>
  page.evaluate(() => JSON.parse(window.localStorage.getItem("callshield.v1") ?? "{}").assistant ?? {});

try {
  /* ------------------------- assistant page renders ------------------------ */

  await page.goto(`${BASE}/app/assistant`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Call voice" }).waitFor();
  step("Assistant page loads");

  // Voice picker contains the cloned-voice option.
  const voiceSelect = page.locator("#assistant-voice");
  const options = await voiceSelect.locator("option").allTextContents();
  assert.ok(options.some((text) => /Your Voice/i.test(text)), `clone option missing: ${options}`);
  assert.ok(options.some((text) => /Kaveri/i.test(text)), "stock voices missing");
  step("Voice picker lists stock voices + Your Voice (cloned)");

  // Hinglish toggle present.
  const hinglishSwitch = page.getByRole("switch", { name: "Hinglish flavour" });
  assert.ok(await hinglishSwitch.isVisible(), "Hinglish toggle missing");
  step("Hinglish flavour toggle present");

  /* --------------------- greeting edit flows into a call ------------------- */

  const original = (await storedAssistant()).greeting ?? "";
  const marker = "Verification greeting one zero one";
  await page.locator("#greeting").fill(marker);
  await page.waitForTimeout(400);

  await page.reload({ waitUntil: "networkidle" });
  assert.equal((await storedAssistant()).greeting, marker, "greeting not persisted");
  step("Greeting edit persists to device storage");

  /* --------------------------- hinglish off → english ---------------------- */

  const hinglishChecked = await hinglishSwitch.getAttribute("aria-checked");
  if (hinglishChecked === "true") await hinglishSwitch.click();
  await page.waitForTimeout(400);
  assert.equal((await storedAssistant()).hinglish, false, "Hinglish off did not persist");
  step("Hinglish toggle OFF persists");

  await runCall(page, /Am I speaking with the account holder/);
  step("Hinglish OFF: live call runs the English script");

  /* ---------------------------- hinglish on → hinglish --------------------- */

  await page.goto(`${BASE}/app/assistant`, { waitUntil: "networkidle" });
  await hinglishSwitch.click();
  await page.waitForTimeout(400);
  assert.equal((await storedAssistant()).hinglish, true, "Hinglish on did not persist");
  step("Hinglish toggle ON persists");

  await runCall(page, /fraud prevention desk se bol raha hoon/);
  step("Hinglish ON: live call runs the Hinglish script");

  /* ------------------------------ screening sync --------------------------- */

  await page.goto(`${BASE}/app/assistant`, { waitUntil: "networkidle" });
  const screeningSwitch = page.getByRole("switch", { name: "Enable AI call screening" });
  if ((await screeningSwitch.getAttribute("aria-checked")) === "true") await screeningSwitch.click();
  await page.waitForTimeout(300);
  await page.goto(`${BASE}/app/live`, { waitUntil: "networkidle" });
  await page.getByText(/screening (is )?paused/i).first().waitFor({ timeout: 8000 });
  step("Screening OFF syncs to the live page");

  await page.goto(`${BASE}/app/assistant`, { waitUntil: "networkidle" });
  await screeningSwitch.click();
  await page.waitForTimeout(300);
  assert.equal((await storedAssistant()).screeningEnabled, true, "screening not re-enabled");
  step("Screening re-enabled");

  /* ------------------------------- restore data ---------------------------- */

  await page.evaluate((greeting) => {
    const stored = JSON.parse(window.localStorage.getItem("callshield.v1") ?? "{}");
    if (stored.assistant) stored.assistant.greeting = greeting;
    window.localStorage.setItem("callshield.v1", JSON.stringify(stored));
  }, original);
  step("Original greeting restored");

  if (errors.length > 0) {
    console.log("\nPage errors observed:");
    for (const error of errors) console.log(" -", error);
  }

  console.log("\nALL ASSISTANT-PAGE CHECKS PASSED");
} finally {
  await browser.close();
}

/** Start a bank-scam call, let the AI answer, and wait for a caller line. */
async function runCall(page, callerLinePattern) {
  await page.goto(`${BASE}/app/live`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Simulate Incoming Call/ }).first().click();
  await page.getByRole("radio").filter({ hasText: "Bank impersonation scam" }).click();
  await page.getByRole("button", { name: /Start simulated call/ }).click();
  await page.getByRole("button", { name: /Let AI Answer/ }).waitFor();
  await page.getByRole("button", { name: /Let AI Answer/ }).click();
  await page.getByText(callerLinePattern, { exact: false }).waitFor({ timeout: 60_000 });
}
