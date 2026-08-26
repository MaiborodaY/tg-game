import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const buildRoot = path.join(repoRoot, "public", "brodice");
const indexPath = path.join(buildRoot, "index.html");
const headersPath = path.join(buildRoot, "_headers");
const failures = [];

let html = "";
try {
  html = await readFile(indexPath, "utf8");
} catch {
  failures.push("public/brodice/index.html is missing.");
}

if (/\/src\/main\.ts\b/.test(html) || /(?:src|href)=["']\/src\//i.test(html)) {
  failures.push("index.html still points at development source files.");
}

const absoluteAssetRefs = [...html.matchAll(/\b(?:src|href)=["']\/(assets\/[^"']+)["']/gi)];
if (absoluteAssetRefs.length > 0) {
  failures.push("built assets must stay relative for the /brodice/ route.");
}

const assetRefs = [...html.matchAll(/\b(?:src|href)=["']\.\/(assets\/[^"']+)["']/gi)]
  .map((match) => match[1]);
if (!assetRefs.some((asset) => /^assets\/index-[^/]+\.js$/i.test(asset))) {
  failures.push("index.html is missing the bundled JavaScript entry.");
}
if (!assetRefs.some((asset) => /^assets\/index-[^/]+\.css$/i.test(asset))) {
  failures.push("index.html is missing the bundled stylesheet.");
}

const telegramSdk = "https://telegram.org/js/telegram-web-app.js";
const sdkPosition = html.indexOf(telegramSdk);
const modulePosition = html.search(/<script[^>]+type=["']module["']/i);
if (sdkPosition < 0) failures.push("Telegram Mini App SDK is missing from the production entry.");
if (modulePosition >= 0 && sdkPosition > modulePosition) failures.push("Telegram SDK must load before the app module.");

for (const asset of [...assetRefs, "og.png", "manifest.webmanifest"]) {
  try {
    await access(path.join(buildRoot, asset));
  } catch {
    failures.push(`index.html references a missing file: ${asset}`);
  }
}

try {
  const headers = await readFile(headersPath, "utf8");
  if (!/\/assets\/\*/.test(headers) || !/immutable/i.test(headers)) {
    failures.push("_headers must cache fingerprinted assets as immutable.");
  }
} catch {
  failures.push("public/brodice/_headers is missing.");
}

try {
  const socialCard = await stat(path.join(buildRoot, "og.png"));
  if (socialCard.size < 10_000) failures.push("og.png is unexpectedly small.");
} catch {
  // Missing-file reporting above is more specific.
}

const javascript = (await Promise.all(
  assetRefs.filter((asset) => asset.endsWith(".js")).map((asset) => readFile(path.join(buildRoot, asset), "utf8")),
)).join("\n");
if (!javascript.includes("getRandomValues")) failures.push("production code is missing secure random generation.");
if (javascript.includes("Math.random")) failures.push("production code must not use Math.random for BroDice.");

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`BroDice build verification failed: ${failure}`));
  process.exit(1);
}

console.log(`BroDice build verification passed: ${path.relative(repoRoot, indexPath)}`);
