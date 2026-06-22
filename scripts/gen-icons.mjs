// Dependency-free PWA icon generator for Noem Studio.
// Rasterises a white "N" monogram on the brand black, then writes PNGs using
// only Node's built-in zlib — no native modules (sharp/canvas) required.
//
//   node scripts/gen-icons.mjs
//
// Outputs into public/icons/: icon-192.png, icon-512.png,
// icon-maskable-512.png and apple-touch-icon.png.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

// ---- brand palette ----
const BG = [13, 13, 13]; // --ink
const FG = [250, 249, 247]; // --paper

// ---- tiny PNG encoder (RGBA, 8-bit) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  // 10,11,12 already 0 (compression / filter / interlace)

  // prefix each scanline with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- monogram rasteriser ----
// Distance from point p to segment a-b, for anti-aliased thick strokes.
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function renderN(size, { safe = 0.8 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);

  // Letter box: centred, occupying `safe` of the canvas (safe zone for maskable).
  const box = size * safe;
  const x0 = (size - box) / 2;
  const x1 = x0 + box;
  const y0 = (size - box) / 2;
  const y1 = y0 + box;
  const thickness = box * 0.16;
  const half = thickness / 2;

  // N as three strokes: left stem, top-left → bottom-right diagonal, right stem.
  const segs = [
    [x0, y1, x0, y0],
    [x0, y0, x1, y1],
    [x1, y1, x1, y0],
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let d = Infinity;
      for (const [ax, ay, bx, by] of segs) {
        const dd = distToSegment(x + 0.5, y + 0.5, ax, ay, bx, by);
        if (dd < d) d = dd;
      }
      // anti-aliased coverage over a 1px edge
      const cov = Math.max(0, Math.min(1, half - d + 0.5));
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(BG[0] + (FG[0] - BG[0]) * cov);
      rgba[i + 1] = Math.round(BG[1] + (FG[1] - BG[1]) * cov);
      rgba[i + 2] = Math.round(BG[2] + (FG[2] - BG[2]) * cov);
      rgba[i + 3] = 255;
    }
  }
  return encodePng(size, size, rgba);
}

const targets = [
  { file: "icon-192.png", size: 192, safe: 0.66 },
  { file: "icon-512.png", size: 512, safe: 0.66 },
  // Maskable: keep the glyph inside the inner ~80% safe zone, full-bleed bg.
  { file: "icon-maskable-512.png", size: 512, safe: 0.56 },
  // iOS rounds the corners itself, so a near-full-bleed glyph reads cleanly.
  { file: "apple-touch-icon.png", size: 180, safe: 0.66 },
];

for (const { file, size, safe } of targets) {
  writeFileSync(join(OUT, file), renderN(size, { safe }));
  console.log("wrote", join("public", "icons", file), `(${size}x${size})`);
}
