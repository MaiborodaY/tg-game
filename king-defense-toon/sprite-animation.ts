import type { AnimationActor } from './animation-types.ts';
import type { AnimationMetadata, SpriteRect } from './art-types.ts';
import type { PaletteRank } from './unit-ranks.ts';

export interface PreparedAnimation {
  atlas: HTMLImageElement;
  bounds: SpriteRect[];
  metadata: AnimationMetadata;
  walk?: PreparedAnimation;
  cast?: PreparedAnimation;
  ranks?: Partial<Record<PaletteRank, PreparedAnimation>>;
}

export function prepareAnimation(image: HTMLImageElement, metadata: AnimationMetadata): PreparedAnimation {
  const { columns, rows } = metadata.layout;
  const bounds = Array.from({ length: columns * rows }, (_, frame) => ({
    x: frame % columns * (image.width / columns),
    y: Math.floor(frame / columns) * (image.height / rows),
    width: image.width / columns, height: image.height / rows,
  }));
  for (const [frame, rect] of Object.entries(metadata.sourceRects ?? {})) bounds[frame as `${number}`] = rect!;
  return { atlas: image, bounds, metadata };
}

/** Shared by battle units and asset previews so cropping, scale and mirroring cannot drift. */
export function drawPreparedAnimation(context: CanvasRenderingContext2D, animation: PreparedAnimation | null | undefined,
  actor: (AnimationActor & { visualScale?: number }) | null, x: number, feet: number, time: number,
  compact = false, forceHorizontalFacing = false): boolean {
  if (!animation?.atlas) return false;
  const meta = animation.metadata;
  const idle = 0;
  if (!animation.bounds[idle]) return false;
  // Idle has its own visual pace; walking and strikes retain their combat clocks.
  const animationTime = !actor || actor.action === 'idle' ? time * 0.65 : time;
  const frame = meta.frameFor(actor, animationTime);
  const sourceFrame = animation.bounds[frame] ? frame : idle;
  const source = (compact && meta.compactSourceRects?.[sourceFrame]) || animation.bounds[sourceFrame];
  const layout = meta.layout;
  const cellWidth = animation.atlas.width / layout.columns;
  const cellHeight = animation.atlas.height / layout.rows;
  const col = sourceFrame % layout.columns;
  const row = Math.floor(sourceFrame / layout.columns);
  const baseline = meta.baselines[sourceFrame] * cellHeight;
  const originX = (meta.centers?.[sourceFrame] ?? 0.5) * cellWidth;
  const scale = (meta.renderHeight ?? 49) * (actor?.visualScale ?? 1) / (meta.bodyHeight * cellHeight);
  // Fixed body scale and per-pose ground anchors keep feet planted even when the sword is overhead.
  const spriteX = x + (source.x - col * cellWidth - originX) * scale;
  const spriteY = feet + (source.y - row * cellHeight - baseline) * scale;
  const breathing = !meta.pixelArt && (!actor || actor.action === 'idle') ? Math.sin(animationTime * 2.1 + x) * 0.2 : 0;
  context.save();
  context.translate(x, feet);
  if (meta.pixelArt) context.imageSmoothingEnabled = false;
  const turnLeft = (forceHorizontalFacing || meta.horizontalFacing) && (actor?.facingX ?? 0) < -0.15;
  const sourceMirrored = meta.mirrorFrames?.includes(sourceFrame) ?? false;
  if (sourceMirrored !== turnLeft) context.scale(-1, 1);
  context.drawImage(animation.atlas, source.x, source.y, source.width, source.height,
    spriteX - x, spriteY - feet + breathing, source.width * scale, source.height * scale);
  context.restore();
  return true;
}
