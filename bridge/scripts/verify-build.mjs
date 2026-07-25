import { access, readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const buildRoot = path.join(repoRoot, "workers", "bridge-pvp", "dist", "client");
const indexPath = path.join(buildRoot, "index.html");
const html = await readFile(indexPath, "utf8");
const failures = [];

if (/\/src\/main\.ts\b/.test(html) || /\b(?:src|href)=["']\/src\//i.test(html)) {
  failures.push("index.html points at development source files.");
}

const absoluteAssetRefs = [...html.matchAll(/\b(?:src|href)=["']\/(assets\/[^"']+)["']/gi)];
if (absoluteAssetRefs.length > 0) {
  failures.push("built assets must stay relative so the app can be mounted below a Telegram launch path.");
}

const assetRefs = [...html.matchAll(/\b(?:src|href)=["']\.\/(assets\/[^"']+)["']/gi)]
  .map((match) => match[1]);

if (!assetRefs.some((assetRef) => /^assets\/index-[^/]+\.js$/i.test(assetRef))) {
  failures.push("index.html is missing the bundled JavaScript entry.");
}

if (!assetRefs.some((assetRef) => /^assets\/index-[^/]+\.css$/i.test(assetRef))) {
  failures.push("index.html is missing the bundled stylesheet.");
}

if (!html.includes("https://telegram.org/js/telegram-web-app.js")) {
  failures.push("Telegram Mini App SDK is missing from the production entry.");
}

for (const assetRef of assetRefs) {
  try {
    await access(path.join(buildRoot, assetRef));
  } catch {
    failures.push(`index.html references a missing asset: ${assetRef}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`Bridge build verification failed: ${failure}`));
  process.exit(1);
}

console.log(`Bridge build verification passed: ${path.relative(repoRoot, indexPath)}`);
