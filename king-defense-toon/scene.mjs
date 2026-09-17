import { UNIT_TYPE_BY_ID } from './units.mjs';
import { FIELD, BATTLE_VIEW, FORMATION_VIEW, positionForCell } from './field.mjs';
import { getUnitRange, KING_MAX_HP } from './combat.mjs';
import { getUnitRank } from './unit-ranks.mjs';
import { getUnitStats, normalizeUnitLevel } from './recruitment.mjs';
import { UNIT_RANK_ASSETS } from './rank-art.mjs';
import { LANCER_ASSETS, LANCER_GEOMETRY } from './lancer-art.mjs';
import { GOBLIN_ROUND_ASSETS, getEnemyRoundArt } from './goblin-round-art.mjs';
import { allyDeathOpacity } from './ally-animation.mjs';
import { KING_IMAGE_URL, UNIT_IMAGES } from './asset-web.mjs';
import { GOBLIN_ARCHER_IMAGE_URL, GOBLIN_ARCHER_GEOMETRY } from './goblin-archer-art.mjs';
import { GOBLIN_CHIEF_IMAGE_URL, GOBLIN_CHIEF_GEOMETRY } from './goblin-chief-art.mjs';
import { GOBLIN_HEALER_IMAGE_URL, GOBLIN_HEALER_GEOMETRY, GOBLIN_HEAL_PULSE_IMAGE_URL, GOBLIN_HEAL_PULSE_FRAMES } from './goblin-healer-art.mjs';
import { OGRE_IMAGE_URL, OGRE_GEOMETRY } from './ogre-art.mjs';
import { UNDEAD_ART } from './undead-art.mjs';
import { GRAVEYARD_BOSS_ART } from './graveyard-boss-art.mjs';
import { getEnemyCombatType } from './waves.mjs';
import { TINY_WARRIOR_LAYOUT, tinyWarriorFrame } from './tiny-warrior.mjs';
import { tinyLancerFrame } from './tiny-lancer.mjs';
import { TINY_TORCH_LAYOUT, tinyTorchFrame } from './tiny-torch.mjs';
import { TINY_GOBLIN_ARCHER_LAYOUT, tinyGoblinArcherFrame } from './tiny-goblin-archer.mjs';
import { TINY_GOBLIN_CHIEF_LAYOUT, tinyGoblinChiefFrame } from './tiny-goblin-chief.mjs';
import { tinyGoblinHealerFrame, goblinHealPulseFrame } from './tiny-goblin-healer.mjs';
import { TINY_BOAR_LAYOUT, tinyBoarFrame } from './tiny-boar.mjs';
import { TINY_KING_LAYOUT, tinyKingFrame } from './tiny-king.mjs';
import { TINY_ARCHER_LAYOUT, tinyArcherFrame, tinyMonkIdleFrame, tinyMonkRunFrame, tinyMonkHealFrame } from './tiny-support.mjs';
import { createTinyMap } from './tiny-map.mjs';
import { createGraveyardMap } from './graveyard-map.mjs';
export { FIELD } from './field.mjs';

const GOBLIN_URL = GOBLIN_ROUND_ASSETS.Red;
const BOAR_URL = new URL('./assets/web/boar.webp', import.meta.url).href;
const MONK_RUN_URL = new URL('./assets/tiny-monk/Run.png', import.meta.url).href;
const MONK_HEAL_URL = new URL('./assets/tiny-monk/Heal.png', import.meta.url).href;
const ALLY_ANIMATION_URLS = {
  king: KING_IMAGE_URL,
  swordsman: new URL('./assets/tiny-swords-warrior-blue.png', import.meta.url).href,
  archer: new URL('./assets/tiny-swords-archer-blue.png', import.meta.url).href,
  healer: new URL('./assets/tiny-monk/Idle.png', import.meta.url).href,
  lancer: LANCER_ASSETS[1].sheet,
};
const ALLY_RANK_ASSETS = { ...UNIT_RANK_ASSETS,
  lancer: Object.fromEntries(Object.entries(LANCER_ASSETS).filter(([rank]) => rank !== '1')) };
const ALLY_ANIMATION_METADATA = {
  king: {
    layout: TINY_KING_LAYOUT,
    pixelArt: true,
    fullCells: true,
    bakedShadow: true,
    bodyHeight: 180 / 313.5,
    renderHeight: 46,
    // Generated poses have different padding; anchor their painted feet, not cell bottoms.
    baselines: [292, 292, 292, 292, 270, 270, 270, 270,
      271, 271, 271, 271, 228, 228, 228, 228].map(value => value / 313.5),
    centers: [169, 163, 159, 158, 160, 152, 141, 160,
      166, 160, 155, 161, 165, 159, 161, 163].map(value => value / 313.5),
    sourceRects: {
      // The upward slash crosses the nominal row boundary; keep it out of the right strike.
      6: { x: 627, y: 313.5, width: 313.5, height: 286.5 },
      10: { x: 627, y: 610, width: 313.5, height: 330 },
    },
    portraitFrame: 0,
    frameFor: tinyKingFrame,
    horizontalFacing: true,
  },
  swordsman: {
    layout: TINY_WARRIOR_LAYOUT,
    pixelArt: true,
    fullCells: true,
    bakedShadow: true,
    bodyHeight: 92 / 192,
    renderHeight: 46,
    baselines: Array(48).fill(128 / 192),
    portraitFrame: 0,
    frameFor: tinyWarriorFrame,
    horizontalFacing: true,
  },
  archer: {
    layout: TINY_ARCHER_LAYOUT,
    pixelArt: true,
    fullCells: true,
    bakedShadow: true,
    bodyHeight: 76 / 192,
    renderHeight: 38,
    baselines: Array(56).fill(128 / 192),
    portraitFrame: 0,
    frameFor: tinyArcherFrame,
    horizontalFacing: true,
  },
  healer: {
    layout: { columns: 6, rows: 1 },
    pixelArt: true,
    fullCells: true,
    bakedShadow: true,
    bodyHeight: 70 / 192,
    renderHeight: 35,
    baselines: Array(6).fill(128 / 192),
    portraitFrame: 0,
    frameFor: tinyMonkIdleFrame,
    horizontalFacing: true,
  },
  lancer: {
    ...LANCER_GEOMETRY,
    pixelArt: true,
    fullCells: true,
    bakedShadow: true,
    renderHeight: 46,
    portraitFrame: 0,
    frameFor: tinyLancerFrame,
    horizontalFacing: true,
  },
};
const ALLY_HEALTH_OFFSETS = { swordsman: 50, archer: 42, healer: 39, lancer: 50 };
const TORCH_ANIMATION_METADATA = {
  layout: TINY_TORCH_LAYOUT,
  pixelArt: true,
  fullCells: true,
  bakedShadow: true,
  bodyHeight: 80 / 192,
  renderHeight: 40,
  baselines: Array(35).fill(128 / 192),
  frameFor: tinyTorchFrame,
  horizontalFacing: true,
};
const GOBLIN_ARCHER_ANIMATION_METADATA = {
  ...GOBLIN_ARCHER_GEOMETRY,
  layout: TINY_GOBLIN_ARCHER_LAYOUT,
  pixelArt: true,
  fullCells: true,
  bakedShadow: false,
  renderHeight: 40,
  frameFor: tinyGoblinArcherFrame,
  horizontalFacing: true,
};
const GOBLIN_CHIEF_ANIMATION_METADATA = {
  ...GOBLIN_CHIEF_GEOMETRY,
  layout: TINY_GOBLIN_CHIEF_LAYOUT,
  pixelArt: true,
  fullCells: true,
  bakedShadow: false,
  renderHeight: 52,
  frameFor: tinyGoblinChiefFrame,
  horizontalFacing: true,
};
const GOBLIN_HEALER_ANIMATION_METADATA = {
  ...GOBLIN_HEALER_GEOMETRY,
  pixelArt: true,
  fullCells: true,
  bakedShadow: false,
  renderHeight: 40,
  frameFor: tinyGoblinHealerFrame,
  horizontalFacing: true,
};
const OGRE_ANIMATION_METADATA = {
  ...OGRE_GEOMETRY,
  // Both atlases share idle, walk, side strike and downward strike rows.
  layout: TINY_GOBLIN_CHIEF_LAYOUT,
  pixelArt: true,
  fullCells: true,
  bakedShadow: false,
  renderHeight: 70,
  frameFor: tinyGoblinChiefFrame,
  horizontalFacing: true,
};
const BOAR_ANIMATION_METADATA = {
  layout: TINY_BOAR_LAYOUT,
  pixelArt: true,
  fullCells: true,
  bakedShadow: false,
  bodyHeight: 240 / 362,
  renderHeight: 40,
  // Native rows have different padding; measured hoof anchors keep the body grounded.
  baselines: [320, 321, 320, 320, 311, 310, 292, 312, 279, 279, 284, 284]
    .map(value => value / 362),
  centers: Array(12).fill(190 / 362),
  sourceRects: {
    // The impact snout crosses its cell by 3px; keep it whole and out of recovery.
    10: { x: 724, y: 724, width: 380, height: 362 },
    11: { x: 1104, y: 724, width: 344, height: 362 },
  },
  frameFor: tinyBoarFrame,
  horizontalFacing: true,
};
const INK = '#243a55';
const CREAM = '#fff7e0';
const GOLD = '#ffd36b';
const UNDEAD_ENEMY_ART = Object.freeze({ ...UNDEAD_ART, ...GRAVEYARD_BOSS_ART });

function verticalPaint(context, y, height, top, bottom) {
  const paint = context.createLinearGradient(0, y, 0, y + height);
  paint.addColorStop(0, top);
  paint.addColorStop(1, bottom);
  return paint;
}

function roundedRect(context, x, y, width, height, radius = 6) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function pixelPanel(context, x, y, width, height, corner = 3) {
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.lineTo(x + width - corner, y + corner);
  context.lineTo(x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.lineTo(x + width - corner, y + height - corner);
  context.lineTo(x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.lineTo(x + corner, y + height - corner);
  context.lineTo(x, y + height - corner);
  context.lineTo(x, y + corner);
  context.lineTo(x + corner, y + corner);
  context.closePath();
}

function drawFormationCell(context, x, y, width, height, selected, available, empty = true, buildSlot = false) {
  pixelPanel(context, x, y + 2, width, height);
  context.fillStyle = '#65594024';
  context.fill();
  pixelPanel(context, x, y, width, height);
  context.fillStyle = selected ? '#ffe6a2a8' : buildSlot ? '#faf0c6cc' : available ? '#f5edc27a' : '#f5e6be36';
  context.fill();
  context.strokeStyle = selected ? '#86613b' : buildSlot ? '#7c8d5d' : available ? '#84995d' : '#7f845744';
  context.lineWidth = selected ? 2 : 1;
  context.stroke();
  context.fillStyle = selected ? '#fff6cb' : '#fff3d153';
  context.fillRect(x + 5, y + 2, width - 10, 1);
  if (empty && (buildSlot || available)) {
    const halfSize = buildSlot ? 6 : 4;
    context.fillStyle = buildSlot ? '#62764b' : '#74945c66';
    context.fillRect(x + width / 2 - halfSize, y + height / 2 - 1, halfSize * 2, 2);
    context.fillRect(x + width / 2 - 1, y + height / 2 - halfSize, 2, halfSize * 2);
  }
}

function drawLockedCell(context, x, y, width, height, selected, price) {
  context.save();
  pixelPanel(context, x, y + 2, width, height);
  context.fillStyle = '#53614720';
  context.fill();
  pixelPanel(context, x, y, width, height);
  context.fillStyle = selected ? '#e5ca7b88' : '#89947569';
  context.fill();
  context.strokeStyle = selected ? '#95743e' : '#66735670';
  context.lineWidth = selected ? 2 : 1;
  context.stroke();
  const center = x + width / 2;
  const lockY = y + 12;
  context.strokeStyle = '#626b50';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(center - 4, lockY + 2);
  context.lineTo(center - 4, lockY - 4);
  context.lineTo(center - 2, lockY - 6);
  context.lineTo(center + 2, lockY - 6);
  context.lineTo(center + 4, lockY - 4);
  context.lineTo(center + 4, lockY + 2);
  context.stroke();
  pixelPanel(context, center - 7, lockY, 14, 11, 2);
  context.fillStyle = '#b9b78b';
  context.fill();
  context.lineWidth = 1;
  context.stroke();
  context.fillStyle = '#65704f';
  context.fillRect(center - 1, lockY + 4, 2, 4);
  if (Number.isInteger(price) && price > 0) {
    context.font = '12px "Lilita One", "Trebuchet MS", sans-serif';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    const label = String(price);
    const labelWidth = context.measureText(label).width;
    const iconX = center - (labelWidth + 13) / 2;
    const labelY = y + height - 11;
    context.fillStyle = '#e7bd61';
    context.strokeStyle = '#8d7136';
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(iconX + 4, labelY + 1, 4, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = '#536049';
    context.fillText(label, iconX + 13, labelY + 1);
  }
  context.restore();
}

function loadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export function cellAtPoint(x, y) {
  const col = Math.floor((x - FIELD.gridX) / FIELD.cellWidth);
  const row = Math.floor((y - FIELD.gridY) / FIELD.cellHeight);
  if (col < 0 || col >= FIELD.columns || row < 0 || row >= FIELD.rows) return null;
  return { col, row };
}

function drawFallbackMap(context) {
  context.fillStyle = verticalPaint(context, 0, FIELD.height, '#a9d783', '#72aa64');
  context.fillRect(0, 0, FIELD.width, FIELD.height);
  context.fillStyle = '#889c65';
  context.fillRect(45, 0, 300, FIELD.height);
  context.fillStyle = '#c9bb8b';
  context.fillRect(47, 0, 296, FIELD.height);
  context.fillStyle = verticalPaint(context, 0, FIELD.height, '#e1d5ad', '#d0c295');
  context.fillRect(73, 0, 244, FIELD.height);
}

function drawMap(context, map, viewportWidth = FIELD.width, viewportHeight = FIELD.height, offsetX = 0, offsetY = 0, time = 0) {
  if (!map) {
    context.fillStyle = '#83b46d';
    context.fillRect(-offsetX, -offsetY, viewportWidth, viewportHeight);
    drawFallbackMap(context);
    return;
  }
  // Scenery shares the formation's coordinate system; spare viewport area continues the sea.
  context.fillStyle = map.backgroundColor;
  context.fillRect(-offsetX, -offsetY, viewportWidth, viewportHeight);
  map.draw(context, time, { top: -offsetY });
}

function drawFallbackUnit(context, type, x, feet, isKing) {
  context.strokeStyle = INK;
  context.lineWidth = 1.2;
  context.lineJoin = 'round';
  context.fillStyle = verticalPaint(context, feet - 30, 28, '#d4e5f0',
    isKing ? '#5178c7' : UNIT_TYPE_BY_ID[type]?.color ?? '#5c91c7');
  roundedRect(context, x - 12, feet - 30, 24, 28, 8);
  context.fill();
  context.stroke();
  context.fillStyle = CREAM;
  context.beginPath();
  context.ellipse(x, feet - 36, 11, 12, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = INK;
  roundedRect(context, x - 11, feet - 5, 9, 6, 2);
  context.fill();
  roundedRect(context, x + 2, feet - 5, 9, 6, 2);
  context.fill();
}

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

function attackProgress(actor) {
  return clamp((actor?.actionTime ?? 0) / Math.max(0.01, actor?.actionDuration ?? 1));
}

function drawRange(context, type, x, y, ghost = false) {
  const radius = getUnitRange(type);
  const color = type === 'healer' ? '#73cb97' : type === 'archer' ? '#7ac4f1' : '#f3cf76';
  context.save();
  context.fillStyle = `${color}1a`;
  context.strokeStyle = color;
  context.lineWidth = 1.5;
  context.setLineDash(ghost ? [5, 5] : [5, 3]);
  context.beginPath();
  context.arc(x, y - 3, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = `${color}2c`;
  context.beginPath();
  context.ellipse(x, y, 20, 7, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawAnimatedUnit(context, animations, type, actor, x, feet, time, rankLevel = 1, compact = false) {
  const sourceAnimation = animations?.[type];
  const baseAnimation = sourceAnimation?.ranks?.[getUnitRank(actor?.level ?? rankLevel).level] ?? sourceAnimation;
  const animation = actor?.action === 'heal' && baseAnimation?.cast?.atlas ? baseAnimation.cast
    : actor?.action === 'walk' && baseAnimation?.walk?.atlas ? baseAnimation.walk : baseAnimation;
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
  const turnLeft = (type === 'archer' || meta.horizontalFacing) && (actor?.facingX ?? 0) < -0.15;
  const sourceMirrored = meta.mirrorFrames?.includes(sourceFrame) ?? false;
  if (sourceMirrored !== turnLeft) context.scale(-1, 1);
  context.drawImage(animation.atlas, source.x, source.y, source.width, source.height,
    spriteX - x, spriteY - feet + breathing, source.width * scale, source.height * scale);
  context.restore();
  return true;
}

function drawUnit(context, type, x, feet, isKing = false, actor = null, time = 0, goblinArt = null, allyAnimations = null, rankLevel = null, renderScale = 1, compact = false) {
  // The royal sprite must stay inside its narrow peninsula, even on very tall phones.
  if (isKing) renderScale = Math.min(renderScale, 1.12);
  context.save();
  context.translate(x, feet);
  context.scale(renderScale, renderScale);
  context.translate(-x, -feet);
  if (actor?.action === 'dead') context.globalAlpha = allyAnimations?.[type]
    ? allyDeathOpacity(actor) : 1 - clamp((actor.deathTime ?? 0) / 0.55);
  if (context.globalAlpha <= 0) {
    context.restore();
    return;
  }
  const bakedShadow = allyAnimations?.[type]?.metadata.bakedShadow
    || goblinArt?.animations?.[type]?.metadata.bakedShadow;
  if (!bakedShadow) {
    context.fillStyle = '#293b4e17';
    context.beginPath();
    const combatType = getEnemyCombatType(type);
    const largeEnemy = combatType === 'goblinChief' || combatType === 'ogre';
    context.ellipse(x, feet + 1, (combatType === 'ogre' ? 29 : largeEnemy ? 23 : 17) * (actor?.visualScale ?? 1), largeEnemy ? 5.5 : 4, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#2636462c';
    context.beginPath();
    context.ellipse(x, feet + 0.5, 11, 2.3, 0, 0, Math.PI * 2);
    context.fill();
  }
  const isEnemy = ['goblin', 'goblinArcher', 'goblinChief', 'goblinHealer', 'ogre', 'boar'].includes(type)
    || Object.hasOwn(UNDEAD_ENEMY_ART, type);
  if (isEnemy && drawAnimatedUnit(context, goblinArt?.animations, type, actor ?? { type, action: 'idle' }, x, feet, time)) {
    // Enemy classes use their own equipment atlas rather than recoloring the allied portraits.
  } else if (!isEnemy && drawAnimatedUnit(context, allyAnimations, type, actor, x, feet, time, rankLevel ?? 1, compact)) {
    // Ally frame sequences are inspected separately; prompt frame numbers are not assumed to match impact.

  } else {
    drawFallbackUnit(context, type, x, feet, isKing);
  }
  context.restore();
}

function drawKing(context, selected, actor = null, time = 0, drawFigure = true, allyAnimations = null, renderScale = 1) {
  const x = actor?.x ?? FIELD.kingX;
  const feet = actor?.y ?? FIELD.kingFeet;
  if (selected) {
    context.fillStyle = '#ffefad45';
    roundedRect(context, x - 29, feet - 56, 58, 62, 10);
    context.fill();
    context.strokeStyle = GOLD;
    context.lineWidth = 2;
    context.stroke();
  }
  if (drawFigure) drawUnit(context, 'king', x, feet, true, actor, time, null, allyAnimations, null, renderScale);
  pixelPanel(context, x - 25, feet + 6, 50, 20);
  context.fillStyle = '#f8e7bb';
  context.fill();
  context.strokeStyle = '#8b6845';
  context.lineWidth = 1;
  context.stroke();
  context.fillStyle = '#b98235';
  context.beginPath();
  context.moveTo(x - 20, feet + 18);
  context.lineTo(x - 22, feet + 10);
  context.lineTo(x - 18, feet + 14);
  context.lineTo(x - 16, feet + 9);
  context.lineTo(x - 14, feet + 14);
  context.lineTo(x - 10, feet + 10);
  context.lineTo(x - 12, feet + 18);
  context.closePath();
  context.fill();
  context.fillStyle = '#74a04c';
  const hp = Math.max(0, Math.ceil(actor?.hp ?? KING_MAX_HP));
  const maxHp = actor?.maxHp ?? KING_MAX_HP;
  roundedRect(context, x - 21, feet + 21, Math.max(0.1, 42 * hp / maxHp), 3, 1.5);
  context.fill();
  context.font = '10px "Lilita One", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#4c493d';
  context.fillText(`${hp}/${maxHp}`, x + 6, feet + 14.5, 31);
}

function drawHealth(context, actor, renderScale = 1) {
  if (actor.hp <= 0 || actor.type === 'king') return;
  const enemy = actor.side === 'enemy';
  const width = enemy ? 26 : 30;
  const largeEnemyMetadata = actor.type === 'ogre' ? OGRE_ANIMATION_METADATA
    : actor.type === 'goblinChief' ? GOBLIN_CHIEF_ANIMATION_METADATA
      : GRAVEYARD_BOSS_ART[actor.type]?.metadata;
  const enemyOffset = largeEnemyMetadata
    ? largeEnemyMetadata.renderHeight * (actor.visualScale ?? 1) + 8 : 48;
  const y = actor.y - (enemy ? enemyOffset : (ALLY_HEALTH_OFFSETS[actor.type] ?? 55)) * renderScale;
  context.fillStyle = '#203651';
  roundedRect(context, actor.x - width / 2, y, width, 5, 2);
  context.fill();
  context.fillStyle = verticalPaint(context, y + 1, 3,
    enemy ? '#ffb077' : '#b0ef73', enemy ? '#da664d' : '#5eba45');
  context.fillRect(actor.x - width / 2 + 1, y + 1, (width - 2) * clamp(actor.hp / actor.maxHp), 3);
}

function drawChiefWindup(context, actor) {
  if (!['goblinChief', 'ogre'].includes(getEnemyCombatType(actor.type)) || actor.hp <= 0 || actor.action !== 'attack') return;
  const impact = actor.impactFraction ?? 0.7;
  const progress = attackProgress(actor) / impact;
  if (progress >= 1) return;
  context.save();
  context.strokeStyle = '#f1a44e';
  context.fillStyle = '#d9753026';
  context.lineWidth = 1.5;
  context.beginPath();
  context.ellipse(actor.targetX, actor.targetY, 18, 7, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = '#ffd785';
  context.lineWidth = 2.5;
  context.beginPath();
  context.ellipse(actor.targetX, actor.targetY, 18, 7, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  context.stroke();
  context.restore();
}

function drawEffect(context, effect, goblinHealPulse = null, renderScale = 1) {
  const p = clamp(effect.age / effect.duration);
  const targetX = effect.targetX ?? effect.x;
  const targetY = effect.targetY ?? effect.y;
  const alliedArrow = effect.type === 'arrow' && effect.sourceType === 'archer';
  const alliedHeal = effect.type === 'heal' && effect.sourceType === 'healer';
  const distance = Math.max(1, Math.hypot(targetX - effect.x, targetY - effect.y));
  const directionX = (targetX - effect.x) / distance;
  const directionY = (targetY - effect.y) / distance;
  // Combat's effect origin is already 27px above the feet; use the new bow and monk hand positions.
  const startX = effect.x + (alliedArrow ? directionX * 13 : 0);
  const startY = effect.y + (alliedArrow ? 13 + directionY * 14 : alliedHeal ? 9 : 0);
  context.save();
  context.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
  if (effect.type === 'arrow') {
    const x = startX + (targetX - startX) * p;
    const y = startY + (targetY - startY) * p - Math.sin(p * Math.PI) * 8;
    context.translate(x, y);
    context.rotate(Math.atan2(targetY - startY - Math.cos(p * Math.PI) * Math.PI * 8, targetX - startX));
    if (effect.sourceType === 'king') {
      // A small royal bolt reuses projectile travel without adding another sprite atlas.
      context.fillStyle = '#e7bd6166';
      context.beginPath();
      context.moveTo(-13, -2);
      context.lineTo(3, -4);
      context.lineTo(8, 0);
      context.lineTo(3, 4);
      context.lineTo(-13, 2);
      context.closePath();
      context.fill();
      context.fillStyle = '#fff3bb';
      context.strokeStyle = '#a7803e';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(7, 0);
      context.lineTo(1, -3);
      context.lineTo(-3, 0);
      context.lineTo(1, 3);
      context.closePath();
      context.fill();
      context.stroke();
      context.restore();
      return;
    }
    context.strokeStyle = '#5e4831';
    context.lineWidth = 1.7;
    context.beginPath();
    context.moveTo(-10, 0);
    context.lineTo(4, 0);
    context.stroke();
    context.fillStyle = '#eff4e1';
    context.beginPath();
    context.moveTo(8, 0);
    context.lineTo(2, -2.5);
    context.lineTo(2, 2.5);
    context.closePath();
    context.fill();
    context.strokeStyle = effect.side === 'enemy' ? '#edac82' : '#b8def3';
    context.beginPath();
    context.moveTo(-10, -2);
    context.lineTo(-7, 0);
    context.lineTo(-10, 2);
    context.stroke();
  } else if (effect.type === 'heal') {
    if (!(effect.amount > 0)) {
      context.restore();
      return;
    }
    if (effect.sourceType === 'goblinHealer' && goblinHealPulse) {
      const { rect, groundAnchor } = GOBLIN_HEAL_PULSE_FRAMES[goblinHealPulseFrame(p)];
      const scale = .5 * renderScale;
      context.imageSmoothingEnabled = false;
      // Combat effects target the torso (-27px); this authored ring is anchored to the recipient's feet.
      context.drawImage(goblinHealPulse, rect.x, rect.y, rect.width, rect.height,
        targetX - groundAnchor.x * scale, targetY + 27 - groundAnchor.y * scale,
        rect.width * scale, rect.height * scale);
      context.font = '11px "Lilita One", sans-serif';
      context.textAlign = 'center';
      context.lineJoin = 'round';
      context.lineWidth = 2.5;
      context.strokeStyle = '#244635';
      const label = `+${Math.round(effect.amount)}`;
      context.strokeText(label, targetX, targetY - 20 - p * 12);
      context.fillStyle = '#baf3a7';
      context.fillText(label, targetX, targetY - 20 - p * 12);
      context.restore();
      return;
    }
    const controlX = (startX + targetX) / 2 + 12;
    const controlY = Math.min(startY, targetY) - 18;
    context.strokeStyle = '#a4eea67a';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(controlX, controlY, targetX, targetY);
    context.stroke();
    const travel = Math.min(1, p * 1.6);
    const orbX = (1 - travel) ** 2 * startX + 2 * (1 - travel) * travel * controlX + travel ** 2 * targetX;
    const orbY = (1 - travel) ** 2 * startY + 2 * (1 - travel) * travel * controlY + travel ** 2 * targetY;
    context.fillStyle = '#79d99155';
    context.beginPath();
    context.arc(orbX, orbY, 6, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#e7ffcd';
    context.beginPath();
    context.arc(orbX, orbY, 2.5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#b7f5ab';
    context.lineWidth = 2.5;
    const y = targetY - 12 * p;
    context.beginPath();
    context.moveTo(targetX - 4, y);
    context.lineTo(targetX + 4, y);
    context.moveTo(targetX, y - 4);
    context.lineTo(targetX, y + 4);
    context.stroke();
    context.font = '12px "Lilita One", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineJoin = 'round';
    context.lineWidth = 2.5;
    context.strokeStyle = '#244635';
    const label = `+${Math.round(effect.amount)} HP`;
    context.strokeText(label, targetX, targetY - 23 - p * 14);
    context.fillStyle = '#baf3a7';
    context.fillText(label, targetX, targetY - 23 - p * 14);
  } else if (effect.type === 'slash'
    && effect.sourceType !== 'lancer'
    && !['goblin', 'boar'].includes(getEnemyCombatType(effect.sourceType))) {
    const heavy = ['goblinChief', 'ogre'].includes(getEnemyCombatType(effect.sourceType));
    const angle = Math.atan2(targetY - effect.y, targetX - effect.x);
    context.translate((effect.x + targetX) / 2, (effect.y + targetY) / 2);
    context.rotate(angle);
    context.strokeStyle = heavy ? '#ffc978' : '#fff2c8';
    context.lineWidth = (heavy ? 4.5 : 2.5) * (1 - p) + 0.5;
    context.beginPath();
    context.arc(0, 0, (heavy ? 21 : 16) + p * 5, -0.75 + p * 0.4, 0.8 + p * 0.4);
    context.stroke();
  } else if (effect.type === 'hit' || effect.type === 'gold') {
    const gold = effect.type === 'gold';
    const x = effect.x + (gold ? 12 : -5);
    const y = effect.y - (gold ? 7 : 14) - p * 17;
    context.font = `${gold ? 12 : 13}px "Lilita One", sans-serif`;
    context.textAlign = 'center';
    context.lineJoin = 'round';
    context.lineWidth = 2.5;
    context.strokeStyle = '#24334c';
    const label = `${gold ? '+' : ''}${Math.round(effect.amount ?? 0)}`;
    context.strokeText(label, x, y);
    context.fillStyle = gold ? '#ffe08a' : '#fff2dc';
    context.fillText(label, x, y);
    if (gold) {
      context.fillStyle = '#efb743';
      context.strokeStyle = '#fff0a0';
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(x + 12, y - 4, 3, 4, 0, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
  }
  context.restore();
}

let sceneAssetsPromise;

async function loadSceneAssets() {
  const [maps, goblinSource, allySources, monkRunSource, monkHealSource, goblinArcherSource, goblinChiefSource, boarSource, ogreSource, undeadSources, goblinHealerSource, goblinHealPulse] = await Promise.all([
    Promise.all([createTinyMap(), createGraveyardMap()]), loadImage(GOBLIN_URL),
    Promise.all(Object.entries(ALLY_ANIMATION_URLS).map(async ([type, url]) => [type, await loadImage(url)])),
    loadImage(MONK_RUN_URL), loadImage(MONK_HEAL_URL), loadImage(GOBLIN_ARCHER_IMAGE_URL), loadImage(GOBLIN_CHIEF_IMAGE_URL),
    loadImage(BOAR_URL), loadImage(OGRE_IMAGE_URL),
    Promise.all(Object.entries(UNDEAD_ENEMY_ART).map(async ([type, art]) => [type, await loadImage(art.url)])),
    loadImage(GOBLIN_HEALER_IMAGE_URL), loadImage(GOBLIN_HEAL_PULSE_IMAGE_URL),
  ]);
  const goblinArt = {
    animations: {
      goblin: prepareAnimation(goblinSource, TORCH_ANIMATION_METADATA),
      goblinArcher: prepareAnimation(goblinArcherSource, GOBLIN_ARCHER_ANIMATION_METADATA),
      goblinChief: prepareAnimation(goblinChiefSource, GOBLIN_CHIEF_ANIMATION_METADATA),
      goblinHealer: prepareAnimation(goblinHealerSource, GOBLIN_HEALER_ANIMATION_METADATA),
      ogre: prepareAnimation(ogreSource, OGRE_ANIMATION_METADATA),
      boar: prepareAnimation(boarSource, BOAR_ANIMATION_METADATA),
    },
  };
  for (const [type, source] of undeadSources) {
    const art = UNDEAD_ENEMY_ART[type];
    goblinArt.animations[type] = source ? prepareAnimation(source, art.metadata)
      : goblinArt.animations[art.fallback];
  }
  // Native clothing variants are decoded once; round changes only select a cached atlas.
  goblinArt.roundColors = Object.fromEntries(await Promise.all(
    Object.entries(GOBLIN_ROUND_ASSETS).map(async ([color, url]) => {
      const image = color === 'Red' ? goblinSource : await loadImage(url);
      return [color, { animations: { ...goblinArt.animations,
        goblin: image ? prepareAnimation(image, TORCH_ANIMATION_METADATA) : goblinArt.animations.goblin,
      } }];
    })));
  function prepareAnimation(image, metadata) {
    const { columns, rows } = metadata.layout;
    // Exported assets arrive ready to draw; no pixel readback or connected-component scans.
    const animationBounds = image ? Array.from({ length: columns * rows }, (_, frame) => ({
      x: frame % columns * (image.width / columns),
      y: Math.floor(frame / columns) * (image.height / rows),
      width: image.width / columns, height: image.height / rows,
    })) : [];
    for (const [frame, rect] of Object.entries(metadata.sourceRects ?? {})) animationBounds[frame] = rect;
    return { atlas: image, bounds: animationBounds, metadata };
  }
  const allyAnimations = Object.fromEntries(allySources.map(([type, image]) =>
    [type, prepareAnimation(image, ALLY_ANIMATION_METADATA[type])]));
  allyAnimations.healer.walk = prepareAnimation(monkRunSource, {
    ...ALLY_ANIMATION_METADATA.healer,
    layout: { columns: 4, rows: 1 },
    baselines: Array(4).fill(128 / 192),
    frameFor: tinyMonkRunFrame,
  });
  allyAnimations.healer.cast = prepareAnimation(monkHealSource, {
    ...ALLY_ANIMATION_METADATA.healer,
    layout: { columns: 11, rows: 1 },
    baselines: Array(11).fill(128 / 192),
    frameFor: tinyMonkHealFrame,
  });
  // Use the pack's authored color sheets, cached once; no per-frame tint or pixel readback.
  await Promise.all(Object.entries(ALLY_RANK_ASSETS).flatMap(([type, ranks]) =>
    Object.entries(ranks).map(async ([level, urls]) => {
      const [image, walk, cast] = await Promise.all([
        loadImage(urls.sheet), urls.walk ? loadImage(urls.walk) : null,
        urls.cast ? loadImage(urls.cast) : null,
      ]);
      if (!image) return;
      const animation = prepareAnimation(image, ALLY_ANIMATION_METADATA[type]);
      if (walk) animation.walk = prepareAnimation(walk, allyAnimations.healer.walk.metadata);
      if (cast) animation.cast = prepareAnimation(cast, allyAnimations.healer.cast.metadata);
      (allyAnimations[type].ranks ??= {})[level] = animation;
    })));
  return { maps, goblinArt, allyAnimations, goblinHealPulse };
}

export async function createScene(canvas, {
  onCell = () => {}, onKing = () => {}, formationOnly = false, placementGrid = true,
} = {}) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  // Both canvases share decoded sprites and prepared terrain layers.
  sceneAssetsPromise ??= loadSceneAssets().catch((error) => {
    sceneAssetsPromise = null;
    throw error;
  });
  const { maps, goblinArt, allyAnimations, goblinHealPulse } = await sceneAssetsPromise;
  const unitImages = UNIT_IMAGES;
  // Crop tightly around the formation while keeping first-row health and level labels.
  const view = formationOnly ? FORMATION_VIEW : BATTLE_VIEW;
  const showPlacementGrid = formationOnly || placementGrid;
  let destroyed = false;
  let state = { units: [], selectedId: null, placementType: null, battle: null, time: 0 };
  let hoverCell = null;

  function viewportFor(rect) {
    const scale = Math.min(rect.width / view.width, rect.height / view.height);
    return {
      scale,
      x: (rect.width - view.width * scale) / 2 - view.x * scale,
      y: (formationOnly ? (rect.height - view.height * scale) / 2 : rect.height - view.height * scale) - view.y * scale,
    };
  }

  function draw() {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round((rect.width || FIELD.width) * dpr));
    const height = Math.max(1, Math.round((rect.height || FIELD.height) * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const viewport = viewportFor(rect);
    if (!viewport.scale) return;
    // Centring adds sea at the right; retain the unit size from the previous narrower framing.
    const previousScale = Math.max(Math.min(rect.width / 390, rect.height / 540),
      Math.min(rect.width / 446, rect.height / 445));
    const actorScale = formationOnly ? 1 : Math.max(1.12, previousScale * 1.12 / viewport.scale);
    canvas.dataset.worldScale = String(viewport.scale);
    canvas.dataset.actorScale = String(actorScale);
    canvas.dataset.worldOffsetX = String(viewport.x);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    // One scale keeps terrain, formation cells, sprites and their labels in the same proportions.
    context.setTransform(viewport.scale * dpr, 0, 0, viewport.scale * dpr,
      viewport.x * dpr, viewport.y * dpr);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const levelNumber = state.levelNumber ?? state.battle?.wave?.levelNumber ?? 1;
    const map = maps[levelNumber - 1] ?? maps[0];
    canvas.dataset.level = String(levelNumber);
    drawMap(context, map, rect.width / viewport.scale, rect.height / viewport.scale,
      viewport.x / viewport.scale, viewport.y / viewport.scale, state.time);
    const occupied = new Map(state.units.map((unit) => [`${unit.col}:${unit.row}`, unit]));
    // Earlier art previews omit progression data and should still show an open grid.
    const unlocked = Array.isArray(state.unlockedCells) ? new Set(state.unlockedCells) : null;
    const isUnlocked = (col, row) => !unlocked || unlocked.has(`${col}:${row}`);
    const selectedUnit = state.units.find((unit) => unit.id === state.selectedId);
    if (showPlacementGrid && !state.battle && selectedUnit) {
      const position = positionForCell(selectedUnit.col, selectedUnit.row);
      drawRange(context, selectedUnit.type, position.x, position.y);
    }
    const ghost = showPlacementGrid && !state.battle && state.placementType && hoverCell && isUnlocked(hoverCell.col, hoverCell.row)
      && !occupied.has(`${hoverCell.col}:${hoverCell.row}`)
      ? positionForCell(hoverCell.col, hoverCell.row) : null;
    if (ghost) drawRange(context, state.placementType, ghost.x, ghost.y, true);
    context.globalAlpha = state.battle ? 0.2 : 1;
    for (let row = 0; row < FIELD.rows; row += 1) {
      for (let col = 0; col < FIELD.columns; col += 1) {
        const key = `${col}:${row}`;
        const unit = occupied.get(key);
        const open = isUnlocked(col, row);
        const x = FIELD.gridX + col * FIELD.cellWidth + 2;
        const y = FIELD.gridY + row * FIELD.cellHeight + 2;
        const width = FIELD.cellWidth - 4;
        const height = FIELD.cellHeight - 4;
        const selected = !state.battle && (unit ? unit.id === state.selectedId
          : formationOnly && state.selectedEmptyCell === key);
        const available = !state.battle && open && state.placementType
          && (!unit || state.replacingFromReserve || (state.movingId && unit.id !== state.movingId));
        const mergeTarget = formationOnly && open && unit && state.mergeTargets?.includes(unit.id);
        if (showPlacementGrid) {
          if (!open && !state.battle) {
            drawLockedCell(context, x, y, width, height, state.selectedLockedCell === key, state.nextUnlockCost);
          } else {
            drawFormationCell(context, x, y, width, height, selected, available || mergeTarget, !unit,
              formationOnly && open && !unit);
            if (mergeTarget) {
              context.strokeStyle = unit.id === state.dragTargetId ? '#eaff89' : '#4d8739';
              context.lineWidth = unit.id === state.dragTargetId ? 4 : 2;
              context.strokeRect(x + 1, y + 1, width - 2, height - 2);
            }
          }
        }
        if (unit && !state.battle) {
          context.save();
          if (unit.id === state.draggedId) context.globalAlpha = 0.35;
          const centerX = FIELD.gridX + col * FIELD.cellWidth + FIELD.cellWidth / 2;
          const feet = FIELD.gridY + (row + 1) * FIELD.cellHeight - 5;
          drawUnit(context, unit.type, centerX, feet, false, null, formationOnly ? 0 : state.time, null, allyAnimations, unit.level ?? 1, actorScale, formationOnly);
          const maxHp = unit.maxHp ?? getUnitStats(unit.type, unit.level).hp;
          const health = Math.max(0, Math.min(1, (unit.hp ?? maxHp) / Math.max(1, maxHp)));
          const healthY = feet - (ALLY_HEALTH_OFFSETS[unit.type] ?? 54) * actorScale;
          const healthX = centerX - (formationOnly ? 25 : 14);
          const healthWidth = formationOnly ? 24 : 28;
          context.fillStyle = '#203651';
          roundedRect(context, healthX, healthY, healthWidth, 5, 2);
          context.fill();
          context.fillStyle = verticalPaint(context, healthY + 1, 3, '#b0ef73', '#5eba45');
          context.fillRect(healthX + 1, healthY + 1, (healthWidth - 2) * health, 3);
          if (formationOnly) {
            // Keep personal levels inside the compact cell, separate from battlefield HUDs.
            const label = String(normalizeUnitLevel(unit.level));
            context.save();
            context.font = '14px "Lilita One", "Trebuchet MS", sans-serif';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.lineJoin = 'round';
            context.lineWidth = 2.5;
            context.strokeStyle = '#1b252b';
            context.fillStyle = '#fffdf4';
            context.strokeText(label, centerX + 2, healthY + 2.5, 23);
            context.fillText(label, centerX + 2, healthY + 2.5, 23);
            context.restore();
          }
          if (mergeTarget) {
            // Preview the resulting level before the player consumes the source fighter.
            context.save();
            context.font = '12px "Lilita One", "Trebuchet MS", sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillStyle = '#355b31';
            roundedRect(context, centerX - 21, y + height - 15, 42, 14, 3);
            context.fill();
            context.fillStyle = '#f4ffe6';
            context.fillText(`+${state.mergeLevel} → ${unit.level + state.mergeLevel}`, centerX, y + height - 8, 39);
            context.restore();
          }
          context.restore();
        }
      }
    }
    context.globalAlpha = 1;
    if (state.battle) {
      const enemyArt = getEnemyRoundArt(goblinArt, state.battle.wave);
      const actors = [...state.battle.allies, ...state.battle.enemies, state.battle.king]
        .filter(Boolean).sort((a, b) => a.y - b.y || a.x - b.x);
      for (const actor of actors) drawChiefWindup(context, actor);
      for (const actor of actors) {
        drawUnit(context, actor.type, actor.x, actor.y,
          actor.type === 'king', actor, state.time, enemyArt, allyAnimations, null, actorScale);
      }
      for (const actor of actors) drawHealth(context, actor, actorScale);
      for (const effect of state.battle.effects) drawEffect(context, effect, goblinHealPulse, actorScale);
      drawKing(context, false, state.battle.king, state.time, false);
    } else {
      if (ghost) {
        context.save();
        context.globalAlpha = 0.5;
        drawUnit(context, state.placementType, ghost.x, ghost.y, false, null, formationOnly ? 0 : state.time, null, allyAnimations, state.placementLevel ?? 1, 1, formationOnly);
        context.restore();
      }
      if (!formationOnly) drawKing(context, state.selectedId === 'king', null, state.time, true, allyAnimations, actorScale);
    }
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const viewport = viewportFor(rect);
    // Invert the same uniform transform, including the cropped formation view's origin.
    const x = (event.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (event.clientY - rect.top - viewport.y) / viewport.scale;
    return { x, y };
  }

  function onPointerMove(event) {
    if (destroyed || !showPlacementGrid || state.battle || !state.placementType) return;
    const point = pointFromEvent(event);
    hoverCell = point ? cellAtPoint(point.x, point.y) : null;
    draw();
  }

  function onPointerLeave() {
    hoverCell = null;
    if (!state.battle) draw();
  }

  function onClick(event) {
    if (destroyed || state.battle) return;
    const point = pointFromEvent(event);
    if (!point) return;
    const { x, y } = point;
    const cell = cellAtPoint(x, y);
    if (cell && showPlacementGrid) onCell(cell);
    else if (!formationOnly && Math.abs(x - FIELD.kingX) <= 32 && y >= FIELD.kingFeet - 59 && y <= FIELD.kingFeet + 32) onKing();
  }

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(draw);
  resizeObserver?.observe(canvas);
  window.addEventListener('resize', draw);
  draw();
  document.fonts?.ready.then(draw);
  return {
    getCellAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (destroyed || clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) return null;
      const point = pointFromEvent({ clientX, clientY });
      return point ? cellAtPoint(point.x, point.y) : null;
    },
    getPortrait(type) {
      return type === 'lancer' ? LANCER_ASSETS[1].art : unitImages.get(type)?.portrait ?? null;
    },
    getUnitArt(type, level = 1) {
      if (type === 'lancer') return LANCER_ASSETS[getUnitRank(level).level].art;
      return UNIT_RANK_ASSETS[type]?.[getUnitRank(level).level]?.art ?? unitImages.get(type)?.art ?? null;
    },
    render(nextState) {
      if (destroyed) return;
      state = { ...state, ...nextState, units: nextState.units ?? state.units };
      if (formationOnly) state.battle = null;
      draw();
    },
    destroy() {
      destroyed = true;
      resizeObserver?.disconnect();
      window.removeEventListener('resize', draw);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    },
  };
}
