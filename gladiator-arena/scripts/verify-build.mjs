import { access, readFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const buildRoot = path.join(repoRoot, "public", "gladiator-arena");
const indexPath = path.join(buildRoot, "index.html");

const html = await readFile(indexPath, "utf8");
const failures = [];

if (/\/src\/main\.ts\b/.test(html) || /\b(?:src|href)=["']\/src\//i.test(html)) {
  failures.push("index.html points at dev /src files instead of built assets.");
}

const assetRefs = [...html.matchAll(/\b(?:src|href)=["']\.\/(assets\/[^"']+)["']/gi)].map((match) => match[1]);
const hasMainJs = assetRefs.some((assetRef) => /^assets\/index-[^/]+\.js$/i.test(assetRef));
const hasMainCss = assetRefs.some((assetRef) => /^assets\/index-[^/]+\.css$/i.test(assetRef));

if (!hasMainJs) {
  failures.push("index.html is missing a built assets/index-*.js reference.");
}

if (!hasMainCss) {
  failures.push("index.html is missing a built assets/index-*.css reference.");
}

for (const assetRef of assetRefs) {
  try {
    await access(path.join(buildRoot, assetRef));
  } catch {
    failures.push(`index.html references a missing asset: ${assetRef}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`Build verification failed: ${failure}`));
  process.exit(1);
}

console.log(`Build verification passed: ${path.relative(repoRoot, indexPath)}`);
