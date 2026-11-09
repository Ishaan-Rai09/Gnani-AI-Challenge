import { readFileSync, writeFileSync } from "node:fs";

const raw = JSON.parse(readFileSync(new URL("./assets/music/audio-data.json", import.meta.url), "utf8"));
const step = 3; // 30fps -> 10Hz samples
const frames = [];
for (let i = 0; i < raw.frames.length && i <= 21 * raw.fps; i += step) {
  const b = raw.frames[i].bands;
  frames.push([+b[0].toFixed(3), +b[12].toFixed(3)]); // [bass, treble]
}
const out = `window.__HF_AUDIO={fps:10,frames:${JSON.stringify(frames)}};`;
writeFileSync(new URL("./assets/music/audio-compact.js", import.meta.url), out);
console.log(`wrote ${frames.length} samples (10Hz, bass+treble)`);
