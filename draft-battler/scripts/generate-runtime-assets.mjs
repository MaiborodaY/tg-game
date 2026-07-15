import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const sourceRoot = readPathArg("--source-root", path.join(repoRoot, "draft-battler", "public", "assets"));
const outputRoot = readPathArg("--output-root", path.join(repoRoot, "draft-battler", "src", "assets"));

const profiles = {
  unit: {
    label: "unit",
    maxWidth: 384,
    maxHeight: 576,
    quality: 82,
    alphaQuality: 88,
  },
  card: {
    label: "card",
    maxWidth: 256,
    maxHeight: 384,
    quality: 82,
    alphaQuality: 88,
  },
  spriteSheet: {
    label: "sprite-sheet",
    maxWidth: 640,
    maxHeight: 256,
    quality: 82,
    alphaQuality: 88,
  },
  battlefield: {
    label: "battlefield",
    maxWidth: 585,
    maxHeight: 1080,
    quality: 78,
    alphaQuality: 82,
  },
  keep: {
    label: "keep",
    maxWidth: 384,
    maxHeight: 256,
    quality: 82,
    alphaQuality: 88,
  },
  cardTemplate: {
    label: "card-template",
    maxWidth: 302,
    maxHeight: 720,
    quality: 82,
    alphaQuality: 88,
  },
};

const jobs = [
  ...await createUnitJobs(),
  ...createStaticJobs(),
];
const results = [];

for (const job of jobs) {
  const sourcePath = path.join(sourceRoot, job.source);
  if (!await fileExists(sourcePath)) {
    continue;
  }

  results.push(await convertImage(job));
}

results.sort((left, right) => right.sourceBytes - left.sourceBytes || left.target.localeCompare(right.target));
await writeReadme(results);
printSummary(results);

async function createUnitJobs() {
  const unitsRoot = path.join(sourceRoot, "units");
  const entries = await readdir(unitsRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => [
      {
        source: `units/${entry.name}/unit.png`,
        target: `units/${entry.name}/unit.webp`,
        profile: profiles.unit,
      },
      {
        source: `units/${entry.name}/card.png`,
        target: `units/${entry.name}/card.webp`,
        profile: profiles.card,
      },
      {
        source: `units/${entry.name}/sprite-sheet.png`,
        target: `units/${entry.name}/sprite-sheet.webp`,
        profile: profiles.spriteSheet,
      },
    ]);
}

function createStaticJobs() {
  return [
    {
      source: "environment/battlefield/common_forest/battlefield_base.png",
      target: "environment/battlefield/common_forest/battlefield_base.webp",
      profile: profiles.battlefield,
    },
    {
      source: "environment/battlefield/common_forest/side_props.png",
      target: "environment/battlefield/common_forest/side_props.webp",
      profile: profiles.battlefield,
    },
    {
      source: "environment/player_keep/keep.png",
      target: "environment/player_keep/keep.webp",
      profile: profiles.keep,
    },
    ...["common", "uncommon", "rare"].map((rarity) => ({
      source: `ui/cards/templates/card-template-${rarity}.png`,
      target: `ui/cards/templates/card-template-${rarity}.webp`,
      profile: profiles.cardTemplate,
    })),
  ];
}

async function convertImage(job) {
  const sourcePath = path.join(sourceRoot, job.source);
  const targetPath = path.join(outputRoot, job.target);
  const [sourceMetadata, sourceStat] = await Promise.all([sharp(sourcePath).metadata(), stat(sourcePath)]);

  if (!sourceMetadata.width || !sourceMetadata.height) {
    throw new Error(`Unsupported image dimensions: ${formatPath(path.relative(repoRoot, sourcePath))}`);
  }

  const targetSize = getTargetSize(sourceMetadata, job.profile);
  await mkdir(path.dirname(targetPath), { recursive: true });

  await sharp(sourcePath)
    .resize(targetSize.width, targetSize.height, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({
      quality: job.profile.quality,
      alphaQuality: job.profile.alphaQuality,
      effort: 5,
      smartSubsample: true,
    })
    .toFile(targetPath);

  const [targetMetadata, targetStat] = await Promise.all([sharp(targetPath).metadata(), stat(targetPath)]);

  return {
    decodedBytes: getDecodedBytes(targetMetadata),
    dimensions: `${targetMetadata.width}x${targetMetadata.height}`,
    profile: job.profile.label,
    source: formatPath(path.relative(repoRoot, sourcePath)),
    sourceBytes: sourceStat.size,
    sourceDecodedBytes: getDecodedBytes(sourceMetadata),
    sourceDimensions: `${sourceMetadata.width}x${sourceMetadata.height}`,
    target: formatPath(path.relative(repoRoot, targetPath)),
    targetBytes: targetStat.size,
  };
}

function getTargetSize(metadata, profile) {
  const widthRatio = profile.maxWidth / metadata.width;
  const heightRatio = profile.maxHeight / metadata.height;
  const ratio = Math.min(1, widthRatio, heightRatio);

  return {
    width: Math.max(1, Math.round(metadata.width * ratio)),
    height: Math.max(1, Math.round(metadata.height * ratio)),
  };
}

async function writeReadme(results) {
  const content = [
    "# Draft Battler Runtime Assets",
    "",
    "Generated by `npm run draft-battler:generate-runtime-assets`.",
    "",
    "These files are optimized runtime WebP assets derived from `draft-battler/public/assets`.",
    "Do not edit generated WebP files by hand; update the source PNGs or generator profile instead.",
    "",
    "The repository keeps only the PNG inputs consumed by the current generators (`unit.png`,",
    "`card.png`, `sprite-sheet.png`, environment images, and card templates). Intermediate",
    "authoring exports such as raw pose sheets, previews, and individual animation frames are",
    "intentionally excluded from the working tree.",
    "",
    "Current profiles:",
    ...Object.values(profiles).map((profile) => (
      `- ${profile.label}: max ${profile.maxWidth}x${profile.maxHeight}, quality ${profile.quality}, alpha ${profile.alphaQuality}`
    )),
    "",
    `Last generated assets: ${results.length}`,
    "",
  ].join("\n");

  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "README.md"), content);
}

function printSummary(results) {
  const sourceBytes = sum(results, (result) => result.sourceBytes);
  const targetBytes = sum(results, (result) => result.targetBytes);
  const sourceDecodedBytes = sum(results, (result) => result.sourceDecodedBytes);
  const decodedBytes = sum(results, (result) => result.decodedBytes);

  console.log(`Source root: ${formatPath(sourceRoot)}`);
  console.log(`Output root: ${formatPath(outputRoot)}`);
  console.log(`Generated runtime assets: ${results.length}`);
  console.log(`Source file size: ${formatBytes(sourceBytes)}`);
  console.log(`Runtime file size: ${formatBytes(targetBytes)}`);
  console.log(`Source decoded memory: ${formatBytes(sourceDecodedBytes)}`);
  console.log(`Runtime decoded memory: ${formatBytes(decodedBytes)}`);
  console.log(`File size reduction: ${formatPercent(1 - targetBytes / sourceBytes)}`);
  console.log(`Decoded memory reduction: ${formatPercent(1 - decodedBytes / sourceDecodedBytes)}`);
  console.log("");
  console.log("Top generated assets by source file size");
  printRows(
    results.slice(0, 16).map((result) => ({
      profile: result.profile,
      source: formatBytes(result.sourceBytes),
      runtime: formatBytes(result.targetBytes),
      from: result.sourceDimensions,
      to: result.dimensions,
      path: result.target,
    })),
  );
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function printRows(rows) {
  if (rows.length === 0) {
    console.log("(none)");
    return;
  }

  const headers = Object.keys(rows[0]);
  const widths = headers.map((header) => Math.max(header.length, ...rows.map((row) => String(row[header]).length)));

  console.log(headers.map((header, index) => header.padEnd(widths[index])).join("  "));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rows) {
    console.log(headers.map((header, index) => String(row[header]).padEnd(widths[index])).join("  "));
  }
}

function readPathArg(name, fallback) {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return value ? path.resolve(repoRoot, value.slice(name.length + 1)) : fallback;
}

function sum(items, getValue) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function getDecodedBytes(metadata) {
  return metadata.width && metadata.height ? metadata.width * metadata.height * 4 : 0;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPath(filePath) {
  return filePath.replace(/\\/g, "/");
}
