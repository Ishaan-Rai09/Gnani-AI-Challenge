import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const BASE = process.env.CALLSHIELD_URL || "http://localhost:3000";
const executablePath =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

const step = (name) => console.log(`\n✓ ${name}`);

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Not every call deserves/ }).waitFor();
  assert.equal(await page.getByRole("radio").count(), 0);
  step("Landing page renders hero");

  await page.getByRole("link", { name: /Try Live Demo/ }).click();
  await page.waitForURL("**/app");
  await page.getByRole("heading", { name: "Your line, under control." }).waitFor();
  await page.waitForTimeout(500);
  step("Dashboard loads with seeded data");

  const statText = await page.locator("body").innerText();
  assert.match(statText, /calls screened/i);
  assert.match(statText, /suspicious callers/i);

  await page.getByRole("button", { name: /Simulate Incoming Call/ }).first().click();
  await page.getByRole("heading", { name: "Simulate an incoming call" }).waitFor();
  assert.equal(await page.getByRole("radio").count(), 6);
  await page.getByRole("radio").filter({ hasText: "Bank impersonation scam" }).click();
  await page.getByRole("button", { name: /Start simulated call/ }).click();
  await page.waitForURL("**/app/live");
  await page.getByRole("button", { name: /Let AI Answer/ }).waitFor();
  step("Six scenarios available; incoming call screen reached");

  await page.getByRole("button", { name: /Let AI Answer/ }).click();
  await page.getByText("Conversation", { exact: true }).waitFor();
  await page.getByText("CallShield AI", { exact: true }).first().waitFor();
  await page.getByText("AI screening call", { exact: true }).waitFor();
  await page.getByRole("button", { name: /Full transcript/ }).waitFor();
  step("AI answered; voice-call stage and live captions started");

  await page.getByText("High Risk", { exact: true }).first().waitFor({ timeout: 45000 });
  await page.getByText("One-time password requested", { exact: true }).waitFor({ timeout: 15000 });
  step("Progressive risk + indicators update during screening");

  await page.getByRole("button", { name: /Block Caller/ }).click();
  await page.getByRole("heading", { name: "A decision was recorded." }).waitFor();
  await page.getByText("Caller blocked", { exact: false }).first().waitFor();
  step("Block Caller ends the call and shows the summary");

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("callshield.v1") ?? "{}")
  );
  assert.ok(Array.isArray(stored.calls) && stored.calls.length >= 12);
  assert.equal(stored.calls[0].action, "blocked");
  assert.ok(stored.blocklist.some((item) => item.number === "+91 80 4712 9931"));
  step("Blocked call and blocklist entry persisted to localStorage");

  await page.goto(`${BASE}/app/blocklist`, { waitUntil: "networkidle" });
  await page.getByText("+91 80 4712 9931").first().waitFor();
  step("Blocklist page shows the blocked number");

  await page.goto(`${BASE}/app/history`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Every screened call/ }).waitFor();
  const firstCall = page.locator('a[href^="/app/history/"]').first();
  await firstCall.click();
  await page.getByRole("heading", { name: /Full transcript/ }).waitFor();
  await page.getByText("One-time password requested", { exact: false }).first().waitFor();
  step("History row opens full call detail with signals");

  await page.getByRole("button", { name: /Notifications/ }).click();
  await page.getByText("Caller added to your blocklist").first().waitFor();
  step("Notification menu shows the new block event");
  await page.keyboard.press("Escape");

  // Takeover + custom reply
  await page.goto(`${BASE}/app/live`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Fake KYC verification/ }).click();
  await page.getByRole("button", { name: /Let AI Answer/ }).click();
  await page.getByText("Conversation", { exact: true }).waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Take Over Call/ }).click();
  await page.getByText("You are now handling this call", { exact: false }).first().waitFor();
  await page.getByRole("button", { name: "Speak your reply" }).waitFor();
  await page
    .getByRole("textbox", { name: "Your reply in the simulated call" })
    .fill("I can't share that on this call.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await page.getByText("I can't share that on this call.", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: /End Call/ }).click();
  await page.getByRole("heading", { name: "A decision was recorded." }).waitFor();
  step("Takeover works; typed reply appears; End Call saves summary");

  // Assistant settings
  await page.goto(`${BASE}/app/assistant`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Set the rules for your screening/ }).waitFor();
  const screeningToggle = page.getByRole("switch", { name: "Enable AI call screening" });
  await screeningToggle.click();
  await page.getByText("Screening is paused", { exact: false }).first().waitFor();
  await screeningToggle.click();
  await page.getByLabel("Assistant language").selectOption("Hindi");
  await page.getByRole("heading", { name: "Call voice" }).waitFor();
  await page.getByLabel("Assistant voice").selectOption("Pranav");
  assert.equal(await page.getByLabel("Assistant voice").inputValue(), "Pranav");
  step("Assistant settings toggle, language, and voice selection work");

  // Settings + install section
  await page.goto(`${BASE}/app/settings`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Your account, your data/ }).waitFor();
  await page.getByRole("button", { name: /Install CallShield/ }).waitFor();
  step("Settings page renders with profile and install controls");

  // Mobile navigation
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await mobile.getByRole("heading", { name: "Your line, under control." }).waitFor();
  await mobile.getByRole("navigation", { name: "Mobile navigation" }).waitFor();
  await mobile.getByRole("button", { name: "Open navigation menu" }).click();
  await mobile.getByRole("link", { name: "AI Assistant" }).last().waitFor();
  step("Mobile layout and drawer navigation work");

  // Allow Caller path + persistence
  await page.goto(`${BASE}/app/live`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Lottery \/ prize scam/ }).click();
  await page.getByRole("button", { name: /Let AI Answer/ }).click();
  await page.getByText("Conversation", { exact: true }).waitFor();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Allow Caller/ }).click();
  await page.getByRole("heading", { name: "A decision was recorded." }).waitFor();
  await page.getByText("Caller allowed", { exact: false }).first().waitFor();
  step("Allow Caller works and saves a decision");

  // Search + filter + sort in history
  await page.goto(`${BASE}/app/history`, { waitUntil: "networkidle" });
  await page.getByLabel("Search screened calls").fill("KYC");
  await page.waitForTimeout(250);
  const searchedRows = await page.locator('a[href^="/app/history/"]').count();
  assert.ok(searchedRows >= 1, "Expected at least one KYC search result");
  await page.getByRole("button", { name: /High Risk/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Newest first/ }).click();
  await page.getByRole("button", { name: /Oldest first/ }).waitFor();
  step("History search, risk filter, and sort work");

  // Blocklist search + confirmed removal + manual add
  await page.goto(`${BASE}/app/blocklist`, { waitUntil: "networkidle" });
  await page.getByLabel("Search blocked numbers").fill("4712");
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Remove" }).first().click();
  await page.getByRole("button", { name: "Remove number" }).click();
  await page.waitForTimeout(400);
  assert.equal(await page.getByText("No numbers match").count(), 1);
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: "Add number" }).click();
  await page.getByLabel("Phone number").fill("+91 90000 12345");
  await page.getByLabel(/Label/).fill("Manual demo block");
  await page.getByRole("button", { name: "Block number" }).click();
  await page.getByText("+91 90000 12345").first().waitFor();
  step("Blocklist search, confirmed removal, and manual add work");

  // Empty history + restore demo data
  await page.goto(`${BASE}/app/settings`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Clear history/ }).click();
  await page.getByRole("button", { name: "Clear history", exact: true }).last().click();
  await page.waitForTimeout(300);
  await page.goto(`${BASE}/app/history`, { waitUntil: "networkidle" });
  await page.getByText("No calls on record").waitFor();
  await page.getByRole("button", { name: "Try Demo Data" }).click();
  await page.locator('a[href^="/app/history/"]').first().waitFor();
  step("Empty history state and Try Demo Data restore work");

  // PWA manifest, service worker, integration status
  const manifest = await page.evaluate(async () => {
    const response = await fetch("/manifest.webmanifest");
    return response.json();
  });
  assert.equal(manifest.name.includes("CallShield"), true);
  assert.ok(manifest.icons.length >= 3);
  const registration = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return "unsupported";
    for (let attempt = 0; attempt < 20; attempt++) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) return "registered";
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return "not-registered";
  });
  assert.equal(registration, "registered");
  const integration = await page.evaluate(async () => {
    const response = await fetch("/api/integrations/status");
    return response.json();
  });
  if (integration.gnani.configured) {
    assert.equal(integration.gnani.mode, "ready");
    assert.equal(integration.gnani.voice, true);
  } else {
    assert.equal(integration.gnani.mode, "demo");
    assert.equal(integration.gnani.voice, false);
  }
  step("PWA manifest, service worker, and integration status verified");

  if (errors.length) {
    console.log("\nBrowser errors:");
    for (const error of errors) console.log(` - ${error}`);
    throw new Error(`${errors.length} browser error(s) captured`);
  }

  console.log("\nAll demo flow checks passed.");
} finally {
  await browser.close();
}
