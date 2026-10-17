// Generates favicon.svg and the PNG app icons from one set of shapes.
// Run with: npm run icons   (needs the "sharp" dev dependency)
// The generated files are committed, so you only need this when the logo changes.
// Keep the geometry in sync with src/components/Logo.tsx.

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const CHARCOAL = "#171714";
const GOLD = "#C9AE7C";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const iconsDir = `${publicDir}icons/`;

// The mark in a 64 x 64 drawing space.
const mark = (strokeWidth) => `
  <path d="M12 54 L32 10 L52 54" fill="none" stroke="${GOLD}" stroke-width="${strokeWidth}" stroke-linejoin="miter"/>
  <path d="M32 34 L38 42 L32 50 L26 42 Z" fill="${GOLD}"/>`;

// Mark placed on a charcoal square. `scale` shrinks the mark so it stays inside the
// "safe zone" that Android crops to when it masks the icon into a circle or squircle.
function iconSvg({ scale, rounded }) {
  const offset = 32 - 32 * scale;
  const corners = rounded ? ' rx="14"' : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64"${corners} fill="${CHARCOAL}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${mark(5)}
  </g>
</svg>
`;
}

async function writePng(name, svg, size) {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(`${iconsDir}${name}`);
  console.log(`generate-icons: ${name} (${size}x${size})`);
}

await mkdir(iconsDir, { recursive: true });

const rounded = iconSvg({ scale: 0.8, rounded: true });
const square = iconSvg({ scale: 0.8, rounded: false });
const maskable = iconSvg({ scale: 0.6, rounded: false });

await writeFile(`${publicDir}favicon.svg`, rounded);
console.log("generate-icons: favicon.svg");

await writePng("icon-192.png", rounded, 192);
await writePng("icon-512.png", rounded, 512);
await writePng("icon-maskable-512.png", maskable, 512);
// iOS applies its own rounding, so it gets a full square.
await writePng("apple-touch-icon.png", square, 180);
