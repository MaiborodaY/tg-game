import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const source = new URL('../art/dungeons/intro/', import.meta.url);
const frames = new URL('../../.tmp/dungeon-intro/frames/', import.meta.url);
const target = new URL('../assets/dungeons/goblin-cave-intro.mp4', import.meta.url);
const encoder = process.env.FFMPEG_PATH || 'ffmpeg';
await mkdir(frames, { recursive: true });
const seconds = 5, fps = 24, frameCount = seconds * fps;
const urls = await Promise.all(['background', 'runners', 'leaders'].map(async name => `data:image/png;base64,${(await readFile(new URL(`${name}.png`, source))).toString('base64')}`));
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 480, height: 854 }, deviceScaleFactor: 1 });
  await page.setContent('<canvas width="480" height="854"></canvas>');
  await page.addScriptTag({ content: await readFile(new URL('render.js', source), 'utf8') });
  await page.evaluate(async urls => { window.drawIntro = await window.createCaveIntroRenderer(document.querySelector('canvas'), urls); }, urls);
  for (let i = 0; i < frameCount; i++) {
    const encoded = await page.evaluate(time => { window.drawIntro(time); return document.querySelector('canvas').toDataURL('image/png').split(',')[1]; }, i / fps);
    await writeFile(new URL(`frame-${String(i).padStart(3, '0')}.png`, frames), Buffer.from(encoded, 'base64'));
  }
} finally { await browser.close(); }
const result = spawnSync(encoder, ['-hide_banner', '-y', '-framerate', String(fps), '-start_number', '0', '-i', join(fileURLToPath(frames), 'frame-%03d.png'),
  '-frames:v', String(frameCount), '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '33', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', fileURLToPath(target)], { stdio: 'inherit', windowsHide: true });
if (result.error || result.status !== 0) throw result.error || new Error(`FFmpeg exited ${result.status}`);
console.log(`Intro: ${seconds} seconds, 480x854, ${fps}fps, ${(await stat(target)).size} bytes; ${fileURLToPath(target)}`);
