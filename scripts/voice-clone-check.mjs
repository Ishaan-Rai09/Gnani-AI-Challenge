// Live check of the Gnani voice-clone pipeline:
//   reference audio -> speaker embedding -> one cloned TTS line -> mp3 file.
// Requires GNANI_API_KEY and GNANI_CLONE_AUDIO (path to a 5-30 s clip, or a
// base64 data URI) in .env.local.
import { readFileSync } from "node:fs";
import { writeFile, readFile } from "node:fs/promises";
import { basename, isAbsolute, join } from "node:path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
        if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
      }
    } catch {
      // file absent — try the next one
    }
  }
}

loadEnv();

const apiKey = process.env.GNANI_API_KEY?.trim();
const cloneAudio = process.env.GNANI_CLONE_AUDIO?.trim();
const baseUrl = (process.env.GNANI_BASE_URL?.trim() || "https://api.vachana.ai").replace(/\/+$/, "");

if (!apiKey || !cloneAudio) {
  console.error(
    "Missing config. Add to .env.local:\n  GNANI_API_KEY=...\n  GNANI_CLONE_AUDIO=assets/voice-sample.wav  (5-30 s recording of your voice)"
  );
  process.exit(1);
}

// Step 1: reference audio -> speaker embedding
let bytes;
let filename = "reference.wav";
if (cloneAudio.startsWith("data:")) {
  const comma = cloneAudio.indexOf(",");
  filename = cloneAudio.slice(0, comma).match(/name=([^;]+)/)?.[1] ?? "reference.wav";
  bytes = Buffer.from(cloneAudio.slice(comma + 1), "base64");
} else {
  const resolved = isAbsolute(cloneAudio) ? cloneAudio : join(process.cwd(), cloneAudio);
  filename = basename(resolved);
  bytes = await readFile(resolved);
}
console.log("REFERENCE:", filename, `${(bytes.byteLength / 1024).toFixed(0)} KB`);

const embedStart = Date.now();
const embedResponse = await fetch(`${baseUrl}/api/v1/tts/voice-clone/embeddings`, {
  method: "POST",
  headers: { "X-API-Key-ID": apiKey },
  body: (() => {
    const form = new FormData();
    form.append("audio_file", new Blob([bytes]), filename);
    return form;
  })(),
});
if (!embedResponse.ok) {
  console.error("EMBEDDINGS FAILED:", embedResponse.status, (await embedResponse.text()).slice(0, 300));
  process.exit(1);
}
const embedBody = await embedResponse.json();
const embedding = embedBody?.data?.voice_clone_embedding;
if (!embedding?.embedding) {
  console.error("NO EMBEDDING in response:", JSON.stringify(embedBody).slice(0, 300));
  process.exit(1);
}
console.log(`EMBEDDING: ok (${Date.now() - embedStart} ms, shape ${JSON.stringify(embedding.shape)})`);

// Step 2: embedding -> cloned speech
const text = process.argv[2] ?? "Namaste, main aapka call assistant bol raha hoon. Bataiye, kaun hai?";
const ttsStart = Date.now();
const ttsResponse = await fetch(`${baseUrl}/api/v1/tts/inference`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-API-Key-ID": apiKey },
  body: JSON.stringify({
    text,
    model: "vachana-vc-v1",
    speaker_embedding: embedding,
    audio_config: { sample_rate: 24000, num_channels: 1, sample_width: 2, container: "mp3", bitrate: "64k" },
  }),
});
if (!ttsResponse.ok) {
  console.error("TTS FAILED:", ttsResponse.status, (await ttsResponse.text()).slice(0, 300));
  process.exit(1);
}
const audio = Buffer.from(await ttsResponse.arrayBuffer());
const out = "voice-clone-check.mp3";
await writeFile(out, audio);
console.log(`TTS: ok (${Date.now() - ttsStart} ms) -> ${out} (${(audio.byteLength / 1024).toFixed(0)} KB)`);
console.log("VOICE CLONE PIPELINE: OK");
