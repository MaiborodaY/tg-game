import type { AnimationActor } from './animation-types.ts';
import { loadGoblinBombardierVisual, drawGoblinBombardier, goblinBombardierMuzzle,
  drawCannonBomb, drawCannonExplosion } from './goblin-bombardier-visual.ts';
import { goblinBombardierShotTiming, tinyGoblinBombardierFrame } from './tiny-goblin-bombardier.ts';
import { createTinyMap } from './tiny-map.ts';
import { loadImage } from './asset-cache.ts';
import { prepareAnimation, drawPreparedAnimation } from './sprite-animation.ts';
import { TINY_WARRIOR_LAYOUT, tinyWarriorFrame } from './tiny-warrior.ts';

async function start(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#battle')!;
  const detail = document.querySelector<HTMLCanvasElement>('#detail')!;
  const context = canvas.getContext('2d')!;
  const zoom = detail.getContext('2d')!;
  const direction = document.querySelector<HTMLSelectElement>('#direction')!;
  const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
  const pause = document.querySelector<HTMLButtonElement>('#pause')!;
  const status = document.querySelector<HTMLElement>('#status')!;
  const [art, map, warriorImage] = await Promise.all([loadGoblinBombardierVisual(), createTinyMap(),
    loadImage(new URL('./assets/tiny-swords-warrior-blue.png', import.meta.url).href)]);
  const warrior = prepareAnimation(warriorImage, {
    layout: TINY_WARRIOR_LAYOUT, frameFor: tinyWarriorFrame, pixelArt: true, fullCells: true,
    bakedShadow: true, bodyHeight: 92 / 192, renderHeight: 46,
    baselines: Array<number>(48).fill(128 / 192), horizontalFacing: true,
  });
  let playing = true;
  let time = 0;
  let last = performance.now();
  pause.addEventListener('click', () => { playing = !playing; pause.textContent = playing ? 'Пауза' : 'Продолжить'; });
  timeline.addEventListener('input', () => { playing = false; pause.textContent = 'Продолжить'; time = Number(timeline.value) / 1000; });
  function render(now: number): void {
    if (playing) time = (time + Math.min(.1, (now - last) / 1000)) % 6;
    last = now;
    timeline.value = String(Math.round(time * 1000));
    const facing = direction.value === 'left' ? { facingX: -1, facingY: 0 }
      : direction.value === 'down' ? { facingX: 0, facingY: 1 }
      : direction.value === 'up' ? { facingX: 0, facingY: -1 } : { facingX: 1, facingY: 0 };
    const pose: AnimationActor = { ...facing, action: time < 1 ? 'walk' : time < 2 ? 'idle' : time < 3.4 ? 'shoot'
      : time < 4.5 ? 'idle' : 'dead', walkTime: time, actionTime: time - 2, actionDuration: 1.4,
      impactFraction: .55, deathTime: time - 4.5 };
    const origin = direction.value === 'left' ? { x: 275, y: 225 } : { x: 115, y: 225 };
    const target = direction.value === 'left' ? { x: 100, y: 215 }
      : direction.value === 'down' ? { x: 180, y: 340 }
      : direction.value === 'up' ? { x: 215, y: 125 } : { x: 290, y: 215 };
    context.clearRect(0, 0, canvas.width, canvas.height);
    map.draw(context, time);
    drawPreparedAnimation(context, warrior, { action: 'idle', facingX: origin.x - target.x }, target.x, target.y, time);
    const movingX = origin.x + (time < 1 ? (time - 1) * 25 * (facing.facingX || 1) : 0);
    drawGoblinBombardier(context, art, pose, movingX, origin.y, time);
    const release = 2 + goblinBombardierShotTiming(pose).releaseTime;
    const flight = time - release;
    // Demonstration trajectory only: runtime accepts positions from the future combat projectile.
    if (flight >= 0 && flight < .65) {
      const from = goblinBombardierMuzzle(pose, origin.x, origin.y);
      const t = flight / .65;
      drawCannonBomb(context, art, flight, from.x + (target.x - from.x) * t,
        from.y + (target.y - from.y) * t - Math.sin(Math.PI * t) * 45);
    }
    drawCannonExplosion(context, art, flight - .65, target.x, target.y);
    zoom.clearRect(0, 0, detail.width, detail.height);
    drawGoblinBombardier(zoom, art, { ...pose, visualScale: 2.6 }, 145, 210, time);
    const labels = { walk: 'Движение', idle: 'Ожидание', shoot: 'Выстрел', dead: 'Исчезновение' };
    const frame = tinyGoblinBombardierFrame(pose, pose.action === 'idle' ? time * .65 : time);
    status.textContent = `${labels[pose.action as keyof typeof labels]} · кадр ${frame} · ${time.toFixed(2)} с`;
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

void start().catch((error: unknown) => {
  document.querySelector<HTMLElement>('#status')!.textContent = `Не удалось загрузить: ${String(error)}`;
});
