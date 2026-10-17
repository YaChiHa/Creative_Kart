// Runs after `vite build`. Fills the placeholders in dist/sw.js with:
//  - PRECACHE_URLS: every file in dist/ that belongs to the application shell
//  - BUILD_ID: a short hash of those files, so the service worker updates whenever they change
//
// Usage: node scripts/build-sw.mjs [path-to-dist]

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const distDir = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL("../dist/", import.meta.url));

// Files that must never be precached.
const EXCLUDED = new Set(["sw.js", "_headers", "_redirects"]);
const isExcluded = (relativePath) => EXCLUDED.has(relativePath) || relativePath.endsWith(".map");

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(join(directory, entry.name), relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

const files = (await listFiles(distDir)).filter((file) => !isExcluded(file)).sort();

if (!files.includes("index.html")) {
  throw new Error(`build-sw: ${distDir} has no index.html. Run "vite build" first.`);
}

const hash = createHash("sha256");
for (const file of files) {
  hash.update(file);
  hash.update(await readFile(join(distDir, file)));
}
const buildId = hash.digest("hex").slice(0, 12);

// The page itself is cached under "./" (the scope root). Caching "index.html" directly
// can break on hosts that redirect it, and redirected responses cannot be used for pages.
const precacheUrls = files.map((file) => (file === "index.html" ? "./" : file));

const swPath = join(distDir, "sw.js");
let source = await readFile(swPath, "utf8");

const buildIdPlaceholder = '/*BUILD_ID*/ "dev"';
const precachePlaceholder = "/*PRECACHE_URLS*/ []";
for (const placeholder of [buildIdPlaceholder, precachePlaceholder]) {
  if (!source.includes(placeholder)) {
    throw new Error(`build-sw: placeholder ${placeholder} not found in ${swPath}.`);
  }
}

source = source
  .replace(buildIdPlaceholder, JSON.stringify(buildId))
  .replace(precachePlaceholder, JSON.stringify(precacheUrls, null, 2));

await writeFile(swPath, source);
console.log(`build-sw: wrote ${swPath} (build ${buildId}, ${precacheUrls.length} precached files)`);
