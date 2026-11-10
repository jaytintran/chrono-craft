/**
 * ChronoCraft - Icon Generator
 * Regenerates every PWA PNG from public/logo.svg.
 * Run: npm run icons
 */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SVG_PATH = join(ROOT, "public", "logo.svg");
const OUT_DIR = join(ROOT, "public", "icons");

const svg = await readFile(SVG_PATH);
await mkdir(OUT_DIR, { recursive: true });

/** Generate a plain PNG at `size` with no padding. */
async function emitPng(name, size) {
  const out = join(OUT_DIR, name);
  await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
  console.log(`  ✓ ${name} (${size}×${size})`);
}

/**
 * Generate a maskable PNG: same artwork, but scaled to ~78% of the canvas
 * with the rest filled with the logo's own background color. This is what
 * Android expects so its circular/squircle mask doesn't crop the content.
 */
async function emitMaskable(name, size) {
  const innerSize = Math.round(size * 0.78);
  const pad = Math.round((size - innerSize) / 2);

  const innerBuf = await sharp(svg)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();
  const out = join(OUT_DIR, name);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 11, g: 15, b: 23, alpha: 1 }, // #0B0F17
    },
  })
    .composite([{ input: innerBuf, left: pad, top: pad }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`  ✓ ${name} (${size}×${size}, maskable)`);
}

console.log("Generating ChronoCraft icons from public/logo.svg …");

await emitPng("icon-192.png", 192);
await emitPng("icon-512.png", 512);
await emitMaskable("icon-maskable-512.png", 512);
await emitPng("apple-touch-icon.png", 180);
await emitPng("favicon-32.png", 32);
await emitPng("favicon-16.png", 16);

// A 1024×1024 master that @capacitor/assets uses (see step 6)
await sharp(svg)
  .resize(1024, 1024)
  .png({ compressionLevel: 9 })
  .toFile(join(ROOT, "resources", "icon.png"));
console.log("  ✓ resources/icon.png (1024×1024, Capacitor master)");

console.log("Done.");
