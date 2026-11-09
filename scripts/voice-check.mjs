#!/usr/bin/env node
/**
 * End-to-end Gnani voice check.
 *
 * 1. Confirms the server reports a configured key.
 * 2. Synthesises a sample line through /api/voice/tts.
 * 3. Sends the returned audio back through /api/voice/stt and compares words.
 *
 * Usage: npm run test:voice   (app must be running; defaults to :3000)
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TEXT =
  process.argv[2] || "Hello, this is CallShield verifying the Gnani voice connection.";

const words = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

async function main() {
  console.log(`Base URL: ${BASE}`);

  const status = await fetch(`${BASE}/api/integrations/status`).then((response) =>
    response.json()
  );
  if (!status.gnani?.configured) {
    console.error(
      "FAIL: GNANI_API_KEY is not configured. Add it to .env.local and restart the dev server."
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `Status: configured (TTS ${status.gnani.services.textToSpeechModel}, STT ${status.gnani.services.speechToTextModel})`
  );

  const ttsStarted = Date.now();
  const tts = await fetch(`${BASE}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: TEXT, voice: "Kaveri" }),
  });
  if (!tts.ok) {
    const detail = await tts.text();
    console.error(`FAIL: TTS returned ${tts.status}. ${detail.slice(0, 300)}`);
    process.exitCode = 1;
    return;
  }
  const audio = Buffer.from(await tts.arrayBuffer());
  if (audio.length === 0) {
    console.error("FAIL: TTS returned empty audio.");
    process.exitCode = 1;
    return;
  }
  console.log(
    `TTS ok: ${(audio.length / 1024).toFixed(1)} kB ${tts.headers.get("content-type")} in ${Date.now() - ttsStarted} ms`
  );

  const form = new FormData();
  form.append("audio", new File([audio], "voice-check.mp3", { type: "audio/mpeg" }));
  form.append("language", "en-IN");

  const stt = await fetch(`${BASE}/api/voice/stt`, { method: "POST", body: form });
  const result = await stt.json().catch(() => null);
  if (!stt.ok) {
    console.error(
      `FAIL: STT returned ${stt.status}. ${result?.message ?? "No detail returned."}`
    );
    process.exitCode = 1;
    return;
  }

  const transcript = (result.transcript ?? "").trim();
  if (!transcript) {
    console.error("FAIL: STT returned an empty transcript.");
    process.exitCode = 1;
    return;
  }

  const expected = new Set(words(TEXT));
  const heard = words(transcript);
  const matched = heard.filter((word) => expected.has(word)).length;
  const overlap = heard.length ? matched / heard.length : 0;

  console.log(`STT ok (${result.model}): "${transcript}"`);
  if (overlap < 0.5) {
    console.error(`FAIL: transcript overlap ${(overlap * 100).toFixed(0)}% — audio may be garbled.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Round trip passed: ${(overlap * 100).toFixed(0)}% word overlap.`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
