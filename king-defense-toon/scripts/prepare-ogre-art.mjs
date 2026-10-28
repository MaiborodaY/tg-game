import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

// Optional first argument lets another machine rebuild from its own original PNG.
const source = process.argv[2] ?? 'C:/Users/mrmay/.codex/generated_images/01a0acc1-805f-7613-b91e-155713b6863e/exec-4f004aee-1134-424f-8b8f-2206417dbc28.png';
const destination = new URL('../assets/web/ogre-boss.webp', import.meta.url);
const png = await readFile(source);
const metadata = await sharp(png).metadata();
if (metadata.width !== 1254 || metadata.height !== 1254 || !metadata.hasAlpha) {
  throw new Error('Expected the supplied transparent 1254 x 1254 ogre atlas.');
}

// 160px cells retain about 100px of body detail for a 70px game sprite.
// Compression is lossless after the single offline downsample; alpha stays intact.
const webp = await sharp(png)
  .resize(640, 640, { kernel: 'lanczos3' })
  .webp({ lossless: true, effort: 6 })
  .toBuffer();
await mkdir(new URL('./', destination), { recursive: true });
await writeFile(destination, webp);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
console.log(JSON.stringify({
  source, sourceBytes: png.length, sourceSha256: sha256(png),
  output: destination.pathname, outputBytes: webp.length, outputSha256: sha256(webp),
  dimensions: [640, 640], frames: 16,
}, null, 2));
