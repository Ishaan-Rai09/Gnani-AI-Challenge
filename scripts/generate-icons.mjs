import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });

const INK = [21, 27, 38];
const IVORY = [245, 243, 237];
const ORANGE = [255, 107, 53];

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function png(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function makeIcon(size, scale, background) {
  const buffer = Buffer.alloc(size * size * 4);
  const samples = 3;
  const ss = [
    [0.5 / 3, 0.5 / 3],
    [1.5 / 3, 0.5 / 3],
    [2.5 / 3, 0.5 / 3],
    [0.5 / 3, 1.5 / 3],
    [1.5 / 3, 1.5 / 3],
    [2.5 / 3, 1.5 / 3],
    [0.5 / 3, 2.5 / 3],
    [1.5 / 3, 2.5 / 3],
    [2.5 / 3, 2.5 / 3],
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let shieldHits = 0;
      let checkHits = 0;

      for (let s = 0; s < samples; s++) {
        const px = ((x + ss[s][0]) / size) * 2 - 1;
        const py = ((y + ss[s][1]) / size) * 2 - 1;
        const nx = px / scale;
        const ny = py / scale;

        let inShield = false;
        if (ny >= -0.78 && ny <= 0.9) {
          let half;
          if (ny <= 0.05) {
            half = 0.66;
            if (ny < -0.66) half = 0.66 - Math.abs(ny + 0.66) * 0.4;
          } else {
            const t = (ny - 0.05) / 0.85;
            half = 0.66 * Math.pow(Math.max(0, 1 - t), 0.52);
          }
          inShield = Math.abs(nx) <= half;
        }
        if (inShield) shieldHits++;

        const checkDistance = Math.min(
          segmentDistance(nx, ny, -0.33, 0.05, -0.07, 0.3),
          segmentDistance(nx, ny, -0.07, 0.3, 0.38, -0.26)
        );
        if (checkDistance <= 0.095) checkHits++;
      }

      const total = samples;
      const shieldAlpha = shieldHits / total;
      const checkAlpha = checkHits / total;

      let color = background;
      if (shieldAlpha > 0) color = IVORY;
      if (checkAlpha > 0) color = ORANGE;

      const index = (y * size + x) * 4;
      buffer[index] = color[0];
      buffer[index + 1] = color[1];
      buffer[index + 2] = color[2];
      buffer[index + 3] = 255;
    }
  }

  return png(size, size, buffer);
}

const variants = [
  { file: "icon-192.png", size: 192, scale: 0.74 },
  { file: "icon-512.png", size: 512, scale: 0.74 },
  { file: "maskable-512.png", size: 512, scale: 0.56 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.72 },
  { file: "favicon-32.png", size: 32, scale: 0.78 },
];

for (const variant of variants) {
  writeFileSync(`${OUT}/${variant.file}`, makeIcon(variant.size, variant.scale, INK));
  console.log(`wrote ${OUT}/${variant.file}`);
}
