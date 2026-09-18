import { prepareAnimation, drawPreparedAnimation } from './sprite-animation.ts';
import type { PreparedAnimation } from './sprite-animation.ts';
import type { Actor, ActorType, BattleEffect, EffectOf } from './combat-types.ts';
import type { UnitType } from './units.ts';
import { isHealingUnit } from './units.ts';
import type { EnemyType } from './waves.ts';
import type { AnimationActor, AnimationAction } from './animation-types.ts';
import type { HeroEffectKind } from './tiny-st-knihor.ts';
import type { AnimationMetadata, RankArtAssets } from './art-types.ts';
import type { BattlefieldMap } from './tiny-map.ts';
import type { SceneAssetPlan } from './scene-assets.ts';
import type { PaletteRank } from './unit-ranks.ts';
import type { GridCell, Scene, SceneOptions, SceneState, SceneUpdate, SceneAssetState } from './scene-types.ts';

type RenderActor = AnimationActor & { type?: ActorType; level?: number; visualScale?: number };
type HealthActor = Pick<Actor, 'type' | 'x' | 'y' | 'hp' | 'maxHp'> & Partial<Pick<Actor, 'side' | 'visualScale' | 'poison'>>;
type RenderHero = HealthActor & AnimationActor & {
  action: AnimationAction; stats: { auraUnlocked: boolean }; bastionTime?: number; guardianWard?: number;
};
type HeroArt = Partial<Record<'up' | 'down' | 'side', HTMLImageElement>>;
// Retain the legacy royal projectile drawing without adding it to combat's actor catalogue.
type RenderEffect = BattleEffect | (Omit<EffectOf<'arrow'>, 'sourceType'> & { sourceType: 'king' });

type AnimationGroups = Partial<Record<ActorType, PreparedAnimation>>;
interface EnemyArt { animations: AnimationGroups }
interface PoisonArt { bottle: HTMLImageElement | null; impact: HTMLImageElement | null }

import { UNIT_TYPE_BY_ID } from './units.ts';
import { FIELD, BATTLE_VIEW, FORMATION_VIEW, HERO_START, CAPITOL_TOWER_POSITION } from './field.ts';
import { canPlaceUnit, getUnitCells, getUnitPosition, planFormationMove } from './unit-footprint.ts';
import { getUnitRange, CASTLE_MAX_HP } from './combat.ts';
import { getUnitRank } from './unit-ranks.ts';
import { getCellAvailability } from './progression.ts';
import { getUnitStats, normalizeUnitLevel } from './recruitment.ts';
import { UNIT_RANK_ASSETS } from './rank-art.ts';
import { LANCER_ASSETS, LANCER_GEOMETRY } from './lancer-art.ts';
import { PANTHER_RIDER_ASSETS, PANTHER_RIDER_GEOMETRY, PANTHER_RIDER_RENDER_HEIGHT,
  PANTHER_RIDER_RELEASE_OFFSETS, MOON_GLAIVE_FRAMES } from './panther-rider-art.ts';
import { pantherRiderFrame } from './panther-rider-animation.ts';
import { ELF_ARCHER_ASSETS, ELF_ARCHER_GEOMETRY, ELF_ARCHER_RENDER_HEIGHT } from './elf-archer-art.ts';
import { elfArcherFrame } from './elf-archer-animation.ts';
import { ELF_HEALER_ASSETS, ELF_HEALER_GEOMETRY, ELF_HEALER_RENDER_HEIGHT, ELF_HEAL_PULSE_FRAMES } from './elf-healer-art.ts';
import { elfHealerFrame } from './elf-healer-animation.ts';
import { allyDeathOpacity } from './ally-animation.ts';
import { UNIT_IMAGES } from './asset-web.ts';
import { getHeroStats } from './hero.ts';
import { getCapitolStats } from './capitol.ts';
import { ST_KNIHOR_GEOMETRY, ST_KNIHOR_EFFECTS } from './st-knihor-art.ts';
import { tinyStKnihorFrame, stKnihorDirection, stKnihorEffectFrame } from './tiny-st-knihor.ts';
import { GOBLIN_ARCHER_GEOMETRY } from './goblin-archer-art.ts';
import { GOBLIN_CHIEF_GEOMETRY } from './goblin-chief-art.ts';
import { GOBLIN_HEALER_GEOMETRY, GOBLIN_HEAL_PULSE_FRAMES } from './goblin-healer-art.ts';
import { OGRE_GEOMETRY } from './ogre-art.ts';
import { UNDEAD_ART } from './undead-art.ts';
import { GRAVEYARD_BOSS_ART } from './graveyard-boss-art.ts';
import { PLAGUE_ALCHEMIST_METADATA, POISON_BOTTLE_FRAMES, POISON_IMPACT_FRAMES, plagueAlchemistReleasePoint } from './plague-alchemist-art.ts';
import { poisonBottleFrame, poisonImpactFrame } from './plague-alchemist-animation.ts';
import { getEnemyCombatType } from './waves.ts';
import { TINY_WARRIOR_LAYOUT, tinyWarriorFrame } from './tiny-warrior.ts';
import { tinyLancerFrame } from './tiny-lancer.ts';
import { TINY_TORCH_LAYOUT, tinyTorchFrame } from './tiny-torch.ts';
import { TINY_GOBLIN_ARCHER_LAYOUT, tinyGoblinArcherFrame } from './tiny-goblin-archer.ts';
import { TINY_GOBLIN_CHIEF_LAYOUT, tinyGoblinChiefFrame } from './tiny-goblin-chief.ts';
import { tinyGoblinHealerFrame, goblinHealPulseFrame } from './tiny-goblin-healer.ts';
import { TINY_BOAR_LAYOUT, tinyBoarFrame } from './tiny-boar.ts';
import { TINY_ARCHER_LAYOUT, tinyArcherFrame, tinyMonkIdleFrame, tinyMonkRunFrame, tinyMonkHealFrame } from './tiny-support.ts';
import { createTinyMap } from './tiny-map.ts';
import { createGraveyardMap } from './graveyard-map.ts';
import { createAssetCache, loadImage } from './asset-cache.ts';
import { getSceneAssetPlan } from './scene-assets.ts';
export { FIELD } from './field.ts';

const PANTHER_RIDER_SCALE = 1.15;
const ALLY_ANIMATION_METADATA: Record<UnitType, AnimationMetadata> = {
  swordsman: {
    layout: TINY_WARRIOR_LAYOUT,
    pixelArt: true,
    fullCells: true,
    bakedShadow: true,
    bodyHeight: 92 / 192,
    renderHeight: 46,
    baselines: Array<number>(48).fill(128 / 192),
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
    baselines: Array<number>(56).fill(128 / 192),
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
    baselines: Array<number>(6).fill(128 / 192),
    portraitFrame: 0,
    frameFor: tinyMonkIdleFrame,
    horizontalFacing: true,
  },
  lancer: {
    ...LANCER_GEOMETRY,
    pixelArt: true,
    fullCells: true,
    bakedShadow: true,
    // Match the infantry's 0.5 scale per source pixel; the spear is not body height.
    renderHeight: 34,
    portraitFrame: 0,
    frameFor: tinyLancerFrame,
    horizontalFacing: true,
  },
  pantherRider: {
    ...PANTHER_RIDER_GEOMETRY,
    pixelArt: true,
    fullCells: true,
    bakedShadow: false,
    renderHeight: PANTHER_RIDER_RENDER_HEIGHT,
    portraitFrame: 0,
    frameFor: pantherRiderFrame,
    horizontalFacing: true,
  },
  elfArcher: {
    ...ELF_ARCHER_GEOMETRY,
    pixelArt: true,
    fullCells: true,
    bakedShadow: false,
    renderHeight: ELF_ARCHER_RENDER_HEIGHT,
    portraitFrame: 0,
    frameFor: elfArcherFrame,
    horizontalFacing: true,
  },
  elfHealer: {
    ...ELF_HEALER_GEOMETRY,
    pixelArt: true,
    fullCells: true,
    bakedShadow: false,
    renderHeight: ELF_HEALER_RENDER_HEIGHT,
    portraitFrame: 0,
    frameFor: elfHealerFrame,
    horizontalFacing: true,
  },
};
const ALLY_HEALTH_OFFSETS: Partial<Record<ActorType, number>> = { swordsman: 50, archer: 42, elfArcher: ELF_ARCHER_RENDER_HEIGHT + 4, healer: 39, elfHealer: ELF_HEALER_RENDER_HEIGHT + 4, lancer: 38, pantherRider: PANTHER_RIDER_RENDER_HEIGHT + 4, hero: 44 };
const TORCH_ANIMATION_METADATA = {
  layout: TINY_TORCH_LAYOUT,
  pixelArt: true,
  fullCells: true,
  bakedShadow: true,
  bodyHeight: 80 / 192,
  renderHeight: 40,
  baselines: Array<number>(35).fill(128 / 192),
  frameFor: tinyTorchFrame,
  horizontalFacing: true,
};
const GOBLIN_ARCHER_ANIMATION_METADATA = {
  ...GOBLIN_ARCHER_GEOMETRY,
  layout: TINY_GOBLIN_ARCHER_LAYOUT,
  pixelArt: true,
  fullCells: true,
  bakedShadow: false,
  // The torch goblin's body is about 32px; its 40px reference includes the flame.
  renderHeight: 32,
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
  // Match the melee goblin's body, excluding its raised torch.
  renderHeight: 32,
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
  centers: Array<number>(12).fill(190 / 362),
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
// These lookups intentionally return undefined for actors without the corresponding art.
const fallbackUnits: Partial<Record<ActorType, { color: string }>> = UNIT_TYPE_BY_ID;
const bossArt: Partial<Record<ActorType, { metadata: AnimationMetadata & { renderHeight: number } }>> = GRAVEYARD_BOSS_ART;
const rankArt: RankArtAssets = UNIT_RANK_ASSETS;

function verticalPaint(context: CanvasRenderingContext2D, y: number, height: number, top: string, bottom: string) {
  const paint = context.createLinearGradient(0, y, 0, y + height);
  paint.addColorStop(0, top);
  paint.addColorStop(1, bottom);
  return paint;
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 6) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function pixelPanel(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, corner = 3) {
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

function drawFormationCell(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, selected: boolean, available: unknown, empty = true, buildSlot = false) {
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

function drawLockedCell(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, selected: boolean, price: number | null | undefined, requirement?: string) {
  context.save();
  pixelPanel(context, x, y + 2, width, height);
  context.fillStyle = '#53614720';
  context.fill();
  pixelPanel(context, x, y, width, height);
  context.fillStyle = selected ? '#e5ca7b88' : requirement ? '#70756680' : '#89947569';
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
  if (Number.isInteger(price) && price! > 0) {
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
  } else if (requirement) {
    context.font = '11px "Lilita One", "Trebuchet MS", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#3e4b38';
    context.fillText(requirement, center, y + height - 10);
  }
  context.restore();
}

export function cellAtPoint(x: number, y: number): GridCell | null {
  const col = Math.floor((x - FIELD.gridX) / FIELD.cellWidth);
  const row = Math.floor((y - FIELD.gridY) / FIELD.cellHeight);
  if (col < 0 || col >= FIELD.columns || row < 0 || row >= FIELD.rows) return null;
  return { col, row };
}

function drawFallbackMap(context: CanvasRenderingContext2D) {
  context.fillStyle = verticalPaint(context, 0, FIELD.height, '#a9d783', '#72aa64');
  context.fillRect(0, 0, FIELD.width, FIELD.height);
  context.fillStyle = '#889c65';
  context.fillRect(45, 0, 300, FIELD.height);
  context.fillStyle = '#c9bb8b';
  context.fillRect(47, 0, 296, FIELD.height);
  context.fillStyle = verticalPaint(context, 0, FIELD.height, '#e1d5ad', '#d0c295');
  context.fillRect(73, 0, 244, FIELD.height);
}

function drawMap(context: CanvasRenderingContext2D, map: BattlefieldMap | null, viewportWidth = FIELD.width, viewportHeight = FIELD.height, offsetX = 0, offsetY = 0, time = 0) {
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

function drawFallbackUnit(context: CanvasRenderingContext2D, type: ActorType, x: number, feet: number, isKing: boolean) {
  context.strokeStyle = INK;
  context.lineWidth = 1.2;
  context.lineJoin = 'round';
  context.fillStyle = verticalPaint(context, feet - 30, 28, '#d4e5f0',
    isKing ? '#5178c7' : fallbackUnits[type]?.color ?? '#5c91c7');
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

function clamp(value: number, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

function attackProgress(actor: AnimationActor | null | undefined) {
  return clamp((actor?.actionTime ?? 0) / Math.max(0.01, actor?.actionDuration ?? 1));
}

function drawRange(context: CanvasRenderingContext2D, type: ActorType, x: number, y: number, ghost = false) {
  const radius = getUnitRange(type);
  const color = isHealingUnit(type) ? '#73cb97' : type === 'archer' || type === 'elfArcher' ? '#7ac4f1' : '#f3cf76';
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

function drawAnimatedUnit(context: CanvasRenderingContext2D, animations: AnimationGroups | null | undefined, type: ActorType, actor: RenderActor | null, x: number, feet: number, time: number, rankLevel = 1, compact = false) {
  const sourceAnimation = animations?.[type];
  const baseAnimation = sourceAnimation?.ranks?.[getUnitRank(actor?.level ?? rankLevel).level] ?? sourceAnimation;
  const animation = actor?.action === 'heal' && baseAnimation?.cast?.atlas ? baseAnimation.cast
    : actor?.action === 'walk' && baseAnimation?.walk?.atlas ? baseAnimation.walk : baseAnimation;
  return drawPreparedAnimation(context, animation, actor, x, feet, time, compact, type === 'archer');
}

function drawUnit(context: CanvasRenderingContext2D, type: ActorType, x: number, feet: number, isKing = false, actor: Actor | null = null, time = 0, goblinArt: EnemyArt | null = null, allyAnimations: AnimationGroups | null = null, rankLevel: number | null = null, renderScale = 1, compact = false) {
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
    const shadowScale = type === 'pantherRider' ? PANTHER_RIDER_SCALE : 1;
    context.ellipse(x, feet + 1, (combatType === 'ogre' ? 29 : largeEnemy ? 23 : 17) * shadowScale * (actor?.visualScale ?? 1), (largeEnemy ? 5.5 : 4) * shadowScale, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#2636462c';
    context.beginPath();
    context.ellipse(x, feet + 0.5, 11 * shadowScale, 2.3 * shadowScale, 0, 0, Math.PI * 2);
    context.fill();
  }
  const isEnemy = ['goblin', 'goblinArcher', 'goblinChief', 'goblinHealer', 'ogre', 'boar'].includes(type)
    || type === 'plagueAlchemist' || Object.hasOwn(UNDEAD_ENEMY_ART, type);
  if (isEnemy && drawAnimatedUnit(context, goblinArt?.animations, type, actor ?? { type, action: 'idle' }, x, feet, time)) {
    // Enemy classes use their own equipment atlas rather than recoloring the allied portraits.
  } else if (!isEnemy && drawAnimatedUnit(context, allyAnimations, type, actor, x, feet, time, rankLevel ?? 1, compact)) {
    // Ally frame sequences are inspected separately; prompt frame numbers are not assumed to match impact.

  } else {
    drawFallbackUnit(context, type, x, feet, isKing);
  }
  context.restore();
}

function drawCastleHealth(context: CanvasRenderingContext2D, actor: Pick<Actor, 'hp' | 'maxHp'> | null = null) {
  const hp = Math.max(0, Math.ceil(actor?.hp ?? CASTLE_MAX_HP));
  const maxHp = actor?.maxHp ?? CASTLE_MAX_HP;
  const x = FIELD.kingX, y = 354;
  context.save();
  pixelPanel(context, x - 24, y, 48, 16);
  context.fillStyle = '#f4e8bf'; context.fill();
  context.fillStyle = '#6b9452'; context.fillRect(x - 21, y + 12, 42 * hp / maxHp, 3);
  context.font = '9px "Lilita One", sans-serif'; context.textAlign = 'center';
  context.textBaseline = 'middle'; context.fillStyle = '#4c493d';
  context.fillText(`${hp}/${maxHp}`, x, y + 6, 43);
  context.restore();
}

function drawCapitolTower(context: CanvasRenderingContext2D, animations: AnimationGroups | null,
  castle?: Actor) {
  const { x, y } = CAPITOL_TOWER_POSITION;
  context.save();
  context.globalAlpha = castle && castle.hp <= 0 ? .45 : 1;
  // A small stone turret and the existing archer atlas need no extra image downloads.
  context.fillStyle = '#414c48'; context.fillRect(x - 9, y + 1, 18, 13);
  context.fillStyle = '#b2b394'; context.fillRect(x - 7, y + 2, 14, 11);
  context.fillStyle = '#747e70'; context.fillRect(x - 7, y + 7, 14, 2);
  context.fillStyle = '#344e5b'; context.fillRect(x - 2, y + 5, 4, 7);
  if (!castle || castle.hp > 0) {
    context.save(); context.translate(x, y + 4); context.scale(.55, .55);
    drawAnimatedUnit(context, animations, 'archer',
      { type: 'archer', action: 'idle', facingX: 1, facingY: 0 }, 0, 0, 0);
    context.restore();
  }
  context.fillStyle = '#414c48'; context.fillRect(x - 10, y, 20, 4);
  context.fillStyle = '#cbd0ad';
  for (const offset of [-9, -2, 5]) context.fillRect(x + offset, y - 2, 4, 4);
  context.restore();
}

function drawHeroEffect(context: CanvasRenderingContext2D, image: HTMLImageElement | null, kind: HeroEffectKind, progress: number, x: number, y: number, scale = .42) {
  if (!image) return;
  const spec = ST_KNIHOR_EFFECTS[kind];
  const frame = stKnihorEffectFrame(kind, clamp(progress) * spec.duration) % 4;
  const { rect, groundAnchor } = spec.frames[frame];
  context.save(); context.imageSmoothingEnabled = false;
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height,
    x - groundAnchor.x * scale, y - groundAnchor.y * scale, rect.width * scale, rect.height * scale);
  context.restore();
}

function drawHero(context: CanvasRenderingContext2D, art: HeroArt, effects: HTMLImageElement | null, actor: RenderHero, time: number, renderScale = 1) {
  const action = actor.hp <= 0 ? ((actor.deathTime ?? 0) < .8 ? 'death' : 'dead')
    : ['heal', 'hammer'].includes(actor.action) ? 'cast' : actor.action;
  const pose: AnimationActor = { ...actor, action, ...(action === 'death' ? { actionTime: actor.deathTime, actionDuration: .8 } : {}) };
  const { direction, flipX } = stKnihorDirection(pose);
  if (!art[direction]) return;
  const { anchor, sourceRects, bodyHeight, frameHeight } = ST_KNIHOR_GEOMETRY;
  const rect = sourceRects[tinyStKnihorFrame(pose, time)];
  const scale = 40 * renderScale / (bodyHeight * frameHeight);
  context.save();
  if (actor.hp > 0 && actor.stats.auraUnlocked) {
    context.globalAlpha = (actor.bastionTime ?? 0) > 0 || (actor.guardianWard ?? 0) > 0 ? .8 : .32;
    drawHeroEffect(context, effects, 'armor', (time % 1.2) / 1.2, actor.x, actor.y + 1, .38 * renderScale);
  }
  context.globalAlpha = actor.hp > 0 ? 1 : Math.max(.35, 1 - (actor.deathTime ?? 0) * .4);
  context.translate(actor.x, actor.y);
  if (flipX) context.scale(-1, 1);
  context.imageSmoothingEnabled = false;
  context.drawImage(art[direction], rect.x, rect.y, rect.width, rect.height,
    -anchor.x * scale, -anchor.y * scale, rect.width * scale, rect.height * scale);
  context.restore();
}

function drawHeroBattleEffect(context: CanvasRenderingContext2D, image: HTMLImageElement | null, effect: BattleEffect, renderScale: number) {
  const p = clamp(effect.age / effect.duration);
  const tx = effect.targetX ?? effect.x, ty = effect.targetY ?? effect.y;
  if (effect.type === 'hero-hammer') {
    drawHeroEffect(context, image, 'hammer', p, effect.x + (tx - effect.x) * p,
      effect.y + (ty - effect.y) * p - Math.sin(p * Math.PI) * 10, .28 * renderScale);
  } else drawHeroEffect(context, image, effect.type === 'hero-heal' ? 'heal' : 'impact', p,
    tx, ty, .42 * renderScale);
}

function drawHealth(context: CanvasRenderingContext2D, actor: HealthActor, renderScale = 1) {
  if (actor.hp <= 0 || actor.type === 'castle') return;
  const enemy = actor.side === 'enemy';
  const width = enemy ? 26 : 30;
  const largeEnemyMetadata = actor.type === 'ogre' ? OGRE_ANIMATION_METADATA
    : actor.type === 'goblinChief' ? GOBLIN_CHIEF_ANIMATION_METADATA
      : bossArt[actor.type]?.metadata;
  const enemyOffset = largeEnemyMetadata
    ? largeEnemyMetadata.renderHeight * (actor.visualScale ?? 1) + 8 : 48;
  const y = actor.y - (enemy ? enemyOffset : (ALLY_HEALTH_OFFSETS[actor.type] ?? 55)) * renderScale;
  context.fillStyle = '#203651';
  roundedRect(context, actor.x - width / 2, y, width, 5, 2);
  context.fill();
  context.fillStyle = verticalPaint(context, y + 1, 3,
    enemy ? '#ffb077' : '#b0ef73', enemy ? '#da664d' : '#5eba45');
  context.fillRect(actor.x - width / 2 + 1, y + 1, (width - 2) * clamp(actor.hp / actor.maxHp), 3);
  if (actor.poison && actor.poison.remaining > 0) {
    context.fillStyle = '#a4c85b';
    context.fillRect(actor.x + width / 2 - 3, y + 6, 2, 2);
  }
}

function drawPoisonEffect(context: CanvasRenderingContext2D, art: PoisonArt,
  effect: EffectOf<'poison-bottle'> | EffectOf<'poison-impact'>, renderScale: number) {
  const progress = clamp(effect.age / effect.duration), bottle = effect.type === 'poison-bottle';
  const image = bottle ? art.bottle : art.impact;
  if (!image || progress >= 1 || (bottle && effect.landed)) return;
  const frame = bottle ? POISON_BOTTLE_FRAMES[poisonBottleFrame(effect.age)]
    : POISON_IMPACT_FRAMES[poisonImpactFrame(progress)];
  const scale = (bottle ? .28 : .6) * renderScale;
  const origin = bottle ? plagueAlchemistReleasePoint({ x: effect.x, y: effect.y + 27 },
    { x: effect.targetX, y: effect.targetY + 27 }, renderScale) : { x: effect.x, y: effect.y };
  const x = bottle ? origin.x + (effect.targetX - origin.x) * progress : effect.targetX;
  const y = bottle ? origin.y + (effect.targetY - origin.y) * progress - Math.sin(progress * Math.PI) * 18 * renderScale : effect.targetY;
  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha = bottle || progress < .65 ? 1 : (1 - progress) / .35;
  const { rect, centerAnchor } = frame;
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height,
    x - centerAnchor.x * scale, y - centerAnchor.y * scale, rect.width * scale, rect.height * scale);
  context.restore();
}

function drawChiefWindup(context: CanvasRenderingContext2D, actor: Actor) {
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

function drawEffect(context: CanvasRenderingContext2D, effect: RenderEffect, goblinHealPulse: HTMLImageElement | null = null, renderScale = 1, elfHealPulse: HTMLImageElement | null = null, moonGlaive: HTMLImageElement | null = null) {
  const p = clamp(effect.age / effect.duration);
  const targetX = effect.targetX ?? effect.x;
  const targetY = effect.targetY ?? effect.y;
  const alliedArrow = effect.type === 'arrow' && (effect.sourceType === 'archer' || effect.sourceType === 'elfArcher');
  const alliedHeal = effect.type === 'heal' && isHealingUnit(effect.sourceType);
  const distance = Math.max(1, Math.hypot(targetX - effect.x, targetY - effect.y));
  const directionX = (targetX - effect.x) / distance;
  const directionY = (targetY - effect.y) / distance;
  // Combat's effect origin is already 27px above the feet; use the new bow and monk hand positions.
  const startX = effect.x + (alliedArrow ? directionX * 13 : 0);
  const startY = effect.y + (alliedArrow ? 13 + directionY * 14 : alliedHeal ? 9 : 0);
  context.save();
  context.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
  if (effect.type === 'arrow') {
    if (effect.sourceType === 'pantherRider' && moonGlaive) {
      // Freeze the authored hand origin at release, including west-facing mirroring.
      const facing = effect.launchFacing ?? { x: 1, y: 0 };
      const releaseFrame = facing.y > 0 && facing.y >= Math.abs(facing.x) ? 14 : 10;
      const offset = PANTHER_RIDER_RELEASE_OFFSETS[releaseFrame];
      const fromX = effect.x + offset.x * (facing.x < 0 ? -1 : 1) * renderScale;
      const fromY = effect.y + 27 + offset.y * renderScale;
      const { rect, centerAnchor } = MOON_GLAIVE_FRAMES[Math.floor(effect.age * 12) % 4];
      const scale = .32 * renderScale;
      context.translate(fromX + (targetX - fromX) * p, fromY + (targetY - fromY) * p);
      context.imageSmoothingEnabled = false;
      context.drawImage(moonGlaive, rect.x, rect.y, rect.width, rect.height,
        -centerAnchor.x * scale, -centerAnchor.y * scale, rect.width * scale, rect.height * scale);
      context.restore();
      return;
    }
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
    const elven = effect.sourceType === 'elfHealer';
    const healPulse = elven ? elfHealPulse : effect.sourceType === 'goblinHealer' ? goblinHealPulse : null;
    if (healPulse) {
      const { rect, groundAnchor } = (elven ? ELF_HEAL_PULSE_FRAMES : GOBLIN_HEAL_PULSE_FRAMES)[goblinHealPulseFrame(p)];
      const scale = (elven ? .6 : .5) * renderScale;
      context.imageSmoothingEnabled = false;
      // Combat effects target the torso (-27px); this authored ring is anchored to the recipient's feet.
      context.drawImage(healPulse, rect.x, rect.y, rect.width, rect.height,
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

const sceneAssetCache = createAssetCache<HTMLImageElement | BattlefieldMap>();
// Object.fromEntries preserves every catalogue key; keep that coverage in the type.
const undeadMetadata = Object.fromEntries(Object.entries(UNDEAD_ENEMY_ART).map(([type, art]): [string, AnimationMetadata] => [type, art.metadata])) as Record<keyof typeof UNDEAD_ENEMY_ART, AnimationMetadata>;
const ENEMY_ANIMATION_METADATA: Record<EnemyType, AnimationMetadata> = {
  goblin: TORCH_ANIMATION_METADATA,
  goblinArcher: GOBLIN_ARCHER_ANIMATION_METADATA,
  goblinChief: GOBLIN_CHIEF_ANIMATION_METADATA,
  goblinHealer: GOBLIN_HEALER_ANIMATION_METADATA,
  ogre: OGRE_ANIMATION_METADATA,
  boar: BOAR_ANIMATION_METADATA,
  plagueAlchemist: PLAGUE_ALCHEMIST_METADATA,
  ...undeadMetadata,
};
const MONK_RUN_METADATA = {
  ...ALLY_ANIMATION_METADATA.healer, layout: { columns: 4, rows: 1 },
  baselines: Array<number>(4).fill(128 / 192), frameFor: tinyMonkRunFrame,
};
const MONK_HEAL_METADATA = {
  ...ALLY_ANIMATION_METADATA.healer, layout: { columns: 11, rows: 1 },
  // Cast metadata is selected only after drawAnimatedUnit observes actor.action === 'heal'.
  baselines: Array<number>(11).fill(128 / 192), frameFor: (actor: AnimationActor | null | undefined) => tinyMonkHealFrame(actor!),
};

async function loadSceneAssets(plan: SceneAssetPlan) {
  const resources = new Map(await Promise.all([...plan.resources].map(async ([key, resource]) => {
    const value = await sceneAssetCache.get(key, () => resource.url ? loadImage(resource.url)
      : resource.levelNumber === 2 ? createGraveyardMap() : createTinyMap());
    return [key, value] as const;
  })));
  // The plan supplies image keys separately from its map key; the shared cache
  // erases that relationship, but every producer above follows the resource kind.
  const imageResource = (key: string) => resources.get(key) as HTMLImageElement;
  const allyAnimations: Partial<Record<UnitType, PreparedAnimation & { ranks: Partial<Record<PaletteRank, PreparedAnimation>> }>> = {};
  for (const ally of plan.allies) {
    const animation = prepareAnimation(imageResource(ally.sheet), ALLY_ANIMATION_METADATA[ally.type]);
    if (ally.walk) animation.walk = prepareAnimation(imageResource(ally.walk), MONK_RUN_METADATA);
    if (ally.cast) animation.cast = prepareAnimation(imageResource(ally.cast), MONK_HEAL_METADATA);
    const group = allyAnimations[ally.type] ??= { ...animation, ranks: {} };
    group.ranks[ally.rank] = animation;
  }
  const goblinArt = { animations: Object.fromEntries(plan.enemies.map(enemy =>
    [enemy.type, prepareAnimation(imageResource(enemy.sheet), ENEMY_ANIMATION_METADATA[enemy.type])])) };
  return { map: resources.get(plan.mapKey) as BattlefieldMap, goblinArt, allyAnimations,
    goblinHealPulse: plan.goblinHealPulse ? imageResource(plan.goblinHealPulse) : null,
    elfHealPulse: plan.elfHealPulse ? imageResource(plan.elfHealPulse) : null,
    moonGlaive: plan.moonGlaive ? imageResource(plan.moonGlaive) : null,
    poisonArt: { bottle: plan.poisonBottle ? imageResource(plan.poisonBottle) : null,
      impact: plan.poisonImpact ? imageResource(plan.poisonImpact) : null },
    heroArt: Object.fromEntries(Object.entries(plan.heroArt).map(([direction, url]) => [direction, imageResource(url)])),
    heroEffects: plan.heroEffects ? imageResource(plan.heroEffects) : null };
}

export async function createScene(canvas: HTMLCanvasElement, {
  onCell = () => {}, onHero = () => {}, onAssetState = () => {}, formationOnly = false, placementGrid = true,
}: SceneOptions = {}): Promise<Scene> {
  const availableContext = canvas.getContext('2d');
  if (!availableContext) throw new Error('Canvas 2D is unavailable');
  const context = availableContext;
  // Owners keep only the union of resources needed by the two live canvases.
  const assetOwner = {};
  let map: BattlefieldMap | null = null;
  let goblinArt: EnemyArt = { animations: {} };
  let allyAnimations: AnimationGroups = {};
  let goblinHealPulse: HTMLImageElement | null = null;
  let elfHealPulse: HTMLImageElement | null = null;
  let moonGlaive: HTMLImageElement | null = null;
  let poisonArt: PoisonArt = { bottle: null, impact: null };
  let heroArt: HeroArt = {};
  let heroEffects: HTMLImageElement | null = null;
  const unitImages = UNIT_IMAGES;
  // Crop tightly around the formation while keeping first-row health and level labels.
  const view = formationOnly ? FORMATION_VIEW : BATTLE_VIEW;
  const showPlacementGrid = formationOnly || placementGrid;
  let destroyed = false;
  let state: SceneState = { units: [], selectedId: null, placementType: null, battle: null, time: 0 };
  let hoverCell: GridCell | null = null;
  let assetState: SceneAssetState = { status: 'loading', levelNumber: 1 };
  let assetSignature: string | null = null;
  let assetRequest = 0;
  let pendingAssets = Promise.resolve(false);

  function updateState(nextState: SceneUpdate) {
    state = { ...state, ...nextState, units: nextState.units ?? state.units };
    if (formationOnly) state.battle = null;
  }

  function requestAssets(force = false) {
    if (destroyed) return Promise.resolve(false);
    const plan = getSceneAssetPlan(state, { formationOnly });
    if (!force && plan.signature === assetSignature) return pendingAssets;
    assetSignature = plan.signature;
    const request = ++assetRequest;
    sceneAssetCache.retain(assetOwner, plan.keys);
    assetState = { status: 'loading', levelNumber: plan.levelNumber };
    onAssetState({ ...assetState });
    pendingAssets = loadSceneAssets(plan).then(assets => {
      if (destroyed || request !== assetRequest) return false;
      ({ map, goblinArt, allyAnimations, goblinHealPulse, elfHealPulse, moonGlaive, poisonArt, heroArt, heroEffects } = assets);
      draw();
      assetState = { status: 'ready', levelNumber: plan.levelNumber };
      onAssetState({ ...assetState });
      return true;
    }, error => {
      if (destroyed || request !== assetRequest) return false;
      assetState = { status: 'error', levelNumber: plan.levelNumber, error };
      onAssetState({ ...assetState });
      return false;
    });
    return pendingAssets;
  }

  function viewportFor(rect: Pick<DOMRect, 'width' | 'height'>) {
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
    canvas.dataset.level = String(levelNumber);
    drawMap(context, map, rect.width / viewport.scale, rect.height / viewport.scale,
      viewport.x / viewport.scale, viewport.y / viewport.scale, state.time);
    const occupied = new Map(state.units.flatMap(unit => getUnitCells(unit).map(key => [key, unit] as const)));
    // Earlier art previews omit progression data and should still show an open grid.
    const unlocked = Array.isArray(state.unlockedCells) ? new Set(state.unlockedCells) : null;
    const isUnlocked = (col: number, row: number) => !unlocked || unlocked.has(`${col}:${row}`);
    const unlockedCells = state.unlockedCells ?? Array.from({ length: FIELD.rows * FIELD.columns }, (_, index) => `${index % FIELD.columns}:${Math.floor(index / FIELD.columns)}`);
    const selectedUnit = state.units.find((unit) => unit.id === state.selectedId);
    if (showPlacementGrid && !state.battle && selectedUnit) {
      const position = getUnitPosition(selectedUnit);
      drawRange(context, selectedUnit.type, position.x, position.y);
    }
    const movingUnit = state.units.find(unit => unit.id === state.movingId);
    const placementAt = (col: number, row: number) => {
      if (state.battle || !state.placementType) return null;
      const target = occupied.get(`${col}:${row}`);
      // A click on either half replaces/swaps the same fighter, never its neighbour.
      const anchor = target && target.id !== movingUnit?.id ? target : { col, row };
      const candidate = { type: state.placementType, col: anchor.col, row: anchor.row };
      if (movingUnit) return planFormationMove(state.units, movingUnit.id, anchor.col, anchor.row, unlockedCells).ok ? candidate : null;
      const ignoredIds = target && state.replacingFromReserve ? [target.id] : [];
      return canPlaceUnit(candidate, state.units, unlockedCells, ignoredIds) ? candidate : null;
    };
    const ghostUnit = showPlacementGrid && hoverCell ? placementAt(hoverCell.col, hoverCell.row) : null;
    const ghost = ghostUnit ? getUnitPosition(ghostUnit) : null;
    const ghostCells = new Set(ghostUnit ? getUnitCells(ghostUnit) : []);
    if (ghost) drawRange(context, state.placementType!, ghost.x, ghost.y, true);
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
        const available = open && (ghostCells.has(key) || placementAt(col, row) !== null);
        const mergeTarget = formationOnly && open && unit && state.mergeTargets?.includes(unit.id);
        if (showPlacementGrid) {
          if (!open && !state.battle) {
            const availability = state.barracksLevel === undefined ? null
              : getCellAvailability({ unlockedCells: state.unlockedCells ?? [] }, key, state.barracksLevel);
            const requirement = availability && !availability.allowed
              ? availability.requiredBarracksLevel ? `Barr. ${['I', 'II', 'III', 'IV'][availability.requiredBarracksLevel - 1]}` : 'Later'
              : undefined;
            drawLockedCell(context, x, y, width, height, state.selectedLockedCell === key,
              availability ? availability.cost : state.nextUnlockCost, requirement);
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
      }
    }
    // Paint the full grid first so a rider's right-hand cell cannot cover its sprite.
    if (!state.battle) {
      for (const unit of [...state.units].sort((a, b) => a.row - b.row || a.col - b.col)) {
        const { row } = unit;
        const y = FIELD.gridY + row * FIELD.cellHeight + 2, height = FIELD.cellHeight - 4;
        const mergeTarget = formationOnly && state.mergeTargets?.includes(unit.id);
        context.save();
        if (unit.id === state.draggedId) context.globalAlpha = 0.35;
        const { x: centerX, y: feet } = getUnitPosition(unit);
        drawUnit(context, unit.type, centerX, feet, false, null, formationOnly ? 0 : state.time, null, allyAnimations, unit.level ?? 1, actorScale, formationOnly);
        const maxHp = unit.maxHp ?? getUnitStats(unit.type, unit.level).hp;
        const health = Math.max(0, Math.min(1, (unit.hp ?? maxHp) / Math.max(1, maxHp)));
        const rawHealthY = feet - (ALLY_HEALTH_OFFSETS[unit.type] ?? 54) * actorScale;
        const healthY = formationOnly ? Math.max(FORMATION_VIEW.y + 7, rawHealthY) : rawHealthY;
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
          context.fillText(`+${state.mergeLevel} → ${unit.level! + state.mergeLevel!}`, centerX, y + height - 8, 39);
          context.restore();
        }
        context.restore();
      }
    }
    context.globalAlpha = 1;
    if (!formationOnly) {
      const stats = state.battle?.castle.stats ?? getCapitolStats(state.capitolState);
      if (stats.towerLevel > 0) drawCapitolTower(context, allyAnimations, state.battle?.castle);
    }
    if (state.battle) {
      const enemyArt = goblinArt;
      const actors = [...state.battle.allies, ...state.battle.enemies, state.battle.hero]
        .filter(Boolean).sort((a, b) => a.y - b.y || a.x - b.x);
      for (const actor of actors) drawChiefWindup(context, actor);
      for (const actor of actors) {
        if (actor.type === 'hero') { drawHero(context, heroArt, heroEffects, actor, state.time, actorScale); continue; }
        drawUnit(context, actor.type, actor.x, actor.y,
          false, actor, state.time, enemyArt, allyAnimations, null, actorScale);
      }
      for (const actor of actors) drawHealth(context, actor, actorScale);
      for (const effect of state.battle.effects) {
        if (effect.type === 'poison-bottle' || effect.type === 'poison-impact') drawPoisonEffect(context, poisonArt, effect, actorScale);
        else if (effect.type.startsWith('hero-')) drawHeroBattleEffect(context, heroEffects, effect, actorScale);
        else drawEffect(context, effect, goblinHealPulse, actorScale, elfHealPulse, moonGlaive);
      }
      drawCastleHealth(context, state.battle.castle);
    } else {
      if (ghost) {
        context.save();
        context.globalAlpha = 0.5;
        drawUnit(context, state.placementType!, ghost.x, ghost.y, false, null, formationOnly ? 0 : state.time, null, allyAnimations, state.placementLevel ?? 1, 1, formationOnly);
        context.restore();
      }
      if (!formationOnly) {
        const stats = getHeroStats(state.heroState);
        const hero: RenderHero = { type: 'hero', action: 'idle', ...HERO_START, facingX: 0, facingY: -1, hp: stats.maxHp, maxHp: stats.maxHp, stats };
        drawHero(context, heroArt, heroEffects, hero, state.time, actorScale);
        drawHealth(context, hero, actorScale);
        const capitol = getCapitolStats(state.capitolState);
        drawCastleHealth(context, { hp: capitol.hp, maxHp: capitol.hp });
      }
    }
  }

  function pointFromEvent(event: Pick<MouseEvent, 'clientX' | 'clientY'>) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const viewport = viewportFor(rect);
    // Invert the same uniform transform, including the cropped formation view's origin.
    const x = (event.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (event.clientY - rect.top - viewport.y) / viewport.scale;
    return { x, y };
  }

  function onPointerMove(event: PointerEvent) {
    if (destroyed || !showPlacementGrid || state.battle || !state.placementType) return;
    const point = pointFromEvent(event);
    hoverCell = point ? cellAtPoint(point.x, point.y) : null;
    draw();
  }

  function onPointerLeave() {
    hoverCell = null;
    if (!state.battle) draw();
  }

  function onClick(event: MouseEvent) {
    if (destroyed) return;
    const point = pointFromEvent(event);
    if (!point) return;
    const { x, y } = point;
    const hero = state.battle?.hero ?? HERO_START;
    if (!formationOnly && Math.abs(x - hero.x) <= 24 && y >= hero.y - 47 && y <= hero.y + 7) { onHero(); return; }
    if (state.battle) return;
    const cell = cellAtPoint(x, y);
    if (cell && showPlacementGrid) onCell(cell);
  }

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(draw);
  resizeObserver?.observe(canvas);
  window.addEventListener('resize', draw);
  draw();
  document.fonts?.ready.then(draw);
  await requestAssets();
  return {
    getCellAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (destroyed || clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) return null;
      const point = pointFromEvent({ clientX, clientY });
      return point ? cellAtPoint(point.x, point.y) : null;
    },
    getPortrait(type) {
      if (type === 'pantherRider') return PANTHER_RIDER_ASSETS[1].art;
      if (type === 'elfArcher') return ELF_ARCHER_ASSETS[1].art;
      if (type === 'elfHealer') return ELF_HEALER_ASSETS[1].art;
      return type === 'lancer' ? LANCER_ASSETS[1].art : unitImages.get(type)?.portrait ?? null;
    },
    getUnitArt(type, level = 1) {
      if (type === 'lancer') return LANCER_ASSETS[getUnitRank(level).level].art;
      if (type === 'pantherRider') return PANTHER_RIDER_ASSETS[getUnitRank(level).level].art;
      if (type === 'elfArcher') return ELF_ARCHER_ASSETS[getUnitRank(level).level].art;
      if (type === 'elfHealer') return ELF_HEALER_ASSETS[getUnitRank(level).level].art;
      return rankArt[type]?.[getUnitRank(level).level]?.art ?? unitImages.get(type)?.art ?? null;
    },
    render(nextState) {
      if (destroyed) return;
      updateState(nextState);
      requestAssets();
      draw();
    },
    prepare(nextState = {}) {
      if (destroyed) return Promise.resolve(false);
      updateState(nextState);
      return requestAssets();
    },
    retryAssets() { return requestAssets(true); },
    getAssetState() { return { ...assetState }; },
    destroy() {
      destroyed = true;
      assetRequest += 1;
      sceneAssetCache.release(assetOwner);
      map = null;
      goblinArt = { animations: {} };
      allyAnimations = {};
      goblinHealPulse = null;
      elfHealPulse = null;
      moonGlaive = null;
      heroArt = {};
      heroEffects = null;
      resizeObserver?.disconnect();
      window.removeEventListener('resize', draw);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    },
  };
}
