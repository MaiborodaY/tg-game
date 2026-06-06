import Phaser from "phaser";
import {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_WIDTH,
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_PLAYER_STAGE_X,
  DEFAULT_STAGE_ORIGIN_X,
  FIGHTER_BASE_Y,
} from "./arenaLayout";
import {
  ARENA_BACKGROUND_ASSET_KEY,
  ARENA_BACKGROUND_ASSET_URL,
  FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY,
  FIGHTER_BACK_FOOT_LIGHT_ASSET_URL,
  FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY,
  FIGHTER_BACK_FOREARM_LIGHT_ASSET_URL,
  FIGHTER_BACK_HAND_LIGHT_ASSET_KEY,
  FIGHTER_BACK_HAND_LIGHT_ASSET_URL,
  FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY,
  FIGHTER_BACK_SHIN_LIGHT_ASSET_URL,
  FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY,
  FIGHTER_BACK_THIGH_LIGHT_ASSET_URL,
  FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY,
  FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_URL,
  FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_FOOT_LIGHT_ASSET_URL,
  FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_FOREARM_LIGHT_ASSET_URL,
  FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_HAND_LIGHT_ASSET_URL,
  FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_SHIN_LIGHT_ASSET_URL,
  FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_THIGH_LIGHT_ASSET_URL,
  FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY,
  FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_URL,
  FIGHTER_HEAD_LIGHT_ASSET_KEY,
  FIGHTER_HEAD_LIGHT_ASSET_URL,
  FIGHTER_TORSO_LIGHT_ASSET_KEY,
  FIGHTER_TORSO_LIGHT_ASSET_URL,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_AVATAR_FEET_Y_OFFSET,
} from "./assets";
import { getCameraTarget, type CameraTarget } from "./arenaCamera";
import { getFighterMaxHp, getFighterMaxStamina, ROUND_LIMIT, type ActionId, type CombatState, type FighterState } from "./combat";
import {
  debugTuning,
  DEFAULT_BODY_ANIMATIONS,
  DEFAULT_FACE_PARTS,
  DEFAULT_RIG_PARTS,
  defaultRigPartTuning,
  RIG_PART_KEYS,
  subscribeDebugTuning,
  updateDebugTuning,
  type BodyAnimationKey,
  type BodyAnimationTuning,
  type FacePartTuning,
  type RigPartKey,
  type RigPartTuning,
} from "./debugTuning";
import { getStageLayout } from "./stageLayout";

type FighterPart = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  setAlpha: (alpha: number) => FighterPart;
  setVisible: (visible: boolean) => FighterPart;
};

interface FighterVisual {
  body: FighterPart;
  head: FighterPart;
  eyeLeft: FighterPart;
  eyeRight: FighterPart;
  helmet: FighterPart;
  plume: FighterPart;
  sword: FighterPart;
  armFront: FighterPart;
  armBack: FighterPart;
  legFront: FighterPart;
  legBack: FighterPart;
  shadow: FighterPart;
  name: FighterPart;
  extraParts?: FighterPart[];
  movableParts?: FighterPart[];
  animatedParts?: FighterPart[];
  paperDollRig?: PaperDollRig;
  debugScale: number;
  bodyAnimationLockedUntil?: number;
}

type PaperDollPartKey = RigPartKey;

interface PaperDollRig {
  root: FighterPart;
  parts: Record<PaperDollPartKey, FighterPart>;
  faceParts: PaperDollFaceParts;
  appearance: PaperDollAppearance;
  selectionHighlights: Record<PaperDollPartKey, Phaser.GameObjects.Graphics>;
}

interface PaperDollFaceParts {
  eyeLeft?: FighterPart;
  eyeRight?: FighterPart;
}

interface PaperDollAppearance {
  facing: 1 | -1;
  skin: number;
  skinDark: number;
  hair: number;
  muscle: number;
}

interface PaperDollFighterOptions {
  x: number;
  y: number;
  label: string;
  facing: 1 | -1;
  skin: number;
  skinDark: number;
  hair: number;
  muscle?: number;
  headAssetKey?: string;
  torsoAssetKey?: string;
  bodyPartAssetKeys?: Partial<Record<PaperDollPartKey, string>>;
}

interface HudVisual {
  hpFill: Phaser.GameObjects.Rectangle;
  staminaFill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}


interface ArenaVisuals {
  player: FighterVisual;
  enemy: FighterVisual;
  playerHud: HudVisual;
  enemyHud: HudVisual;
  roundText: Phaser.GameObjects.Text;
}

const PAPER_DOLL_BASE_SCALE = 0.52;
const DEFAULT_PAPER_DOLL_APPEARANCE: PaperDollAppearance = {
  facing: 1,
  skin: 0xefaa7b,
  skinDark: 0xd9854d,
  hair: 0x8b4a1f,
  muscle: 0x9b5a35,
};
const FIGHTER_MOVE_DURATION = 280;
const HEAD_ASSET_DISPLAY_HEIGHT = 122;
const HEAD_ASSET_LOCAL_BOTTOM_Y = 14;
const HEAD_ASSET_ORIGIN_X = 312 / 623;
const HEAD_ASSET_ORIGIN_Y = 828 / 830;
const HEAD_FACE_EYE_Y = -41;
const HEAD_FACE_LEFT_EYE_X = -8.6;
const HEAD_FACE_RIGHT_EYE_X = 8.6;
const HEAD_FACE_EYE_WIDTH = 6.8;
const HEAD_FACE_EYE_HEIGHT = 14;
const HEAD_FACE_EYE_COVER_WIDTH = 18;
const HEAD_FACE_EYE_COVER_HEIGHT = 17;
const HEAD_FACE_EYE_WHITE = 0xfffbf2;
const HEAD_FACE_EYE_BLACK = 0x050201;
const TORSO_ASSET_DISPLAY_HEIGHT = 175;
const TORSO_ASSET_LOCAL_BOTTOM_Y = 8;
const TORSO_ASSET_ORIGIN_X = 626 / 1254;
const TORSO_ASSET_ORIGIN_Y = 998 / 1254;
const DEBUG_CHARACTER_VIEWER_WIDTH = 430;
const DEBUG_CHARACTER_VIEWER_HEIGHT = 764;
const DEBUG_CHARACTER_CENTER_X = DEBUG_CHARACTER_VIEWER_WIDTH / 2;
const DEBUG_CHARACTER_FEET_Y = 690;
const PAPER_DOLL_SELECTION_FILL = 0xffc857;
const PAPER_DOLL_SELECTION_STROKE = 0xfff1a8;

interface PaperDollPartAssetConfig {
  displayHeight: number;
  localX: number;
  localY: number;
  originX: number;
  originY: number;
}

const PAPER_DOLL_PART_ASSET_CONFIGS: Partial<Record<PaperDollPartKey, PaperDollPartAssetConfig>> = {
  backUpperArm: { displayHeight: 90, localX: 0, localY: -8, originX: 158 / 319, originY: 6 / 548 },
  backForearm: { displayHeight: 66, localX: 0, localY: -3, originX: 122 / 251, originY: 6 / 497 },
  backHand: { displayHeight: 68, localX: 0, localY: -3, originX: 630 / 1254, originY: 294 / 1254 },
  backThigh: { displayHeight: 78, localX: 0, localY: -9, originX: 158 / 319, originY: 6 / 548 },
  backShin: { displayHeight: 72, localX: 0, localY: -5, originX: 122 / 251, originY: 6 / 497 },
  backFoot: { displayHeight: 34, localX: -14, localY: 8, originX: 386 / 772, originY: 194 / 388 },
  frontUpperArm: { displayHeight: 90, localX: 0, localY: -8, originX: 160 / 322, originY: 6 / 546 },
  frontForearm: { displayHeight: 66, localX: 0, localY: -3, originX: 122 / 251, originY: 6 / 497 },
  frontHand: { displayHeight: 68, localX: 0, localY: -3, originX: 630 / 1254, originY: 294 / 1254 },
  frontThigh: { displayHeight: 78, localX: 0, localY: -9, originX: 160 / 322, originY: 6 / 546 },
  frontShin: { displayHeight: 72, localX: 0, localY: -5, originX: 122 / 251, originY: 6 / 497 },
  frontFoot: { displayHeight: 34, localX: 14, localY: 8, originX: 386 / 772, originY: 194 / 388 },
};


let readyCallback: ((scene: ArenaScene) => void) | undefined;

function part(gameObject: Phaser.GameObjects.GameObject): FighterPart {
  return gameObject as FighterPart;
}

function preloadPaperDollAssets(target: Phaser.Scene): void {
  target.load.image(ARENA_BACKGROUND_ASSET_KEY, ARENA_BACKGROUND_ASSET_URL);
  target.load.image(FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY, FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY, FIGHTER_BACK_FOREARM_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_HAND_LIGHT_ASSET_KEY, FIGHTER_BACK_HAND_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY, FIGHTER_BACK_THIGH_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY, FIGHTER_BACK_SHIN_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY, FIGHTER_BACK_FOOT_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY, FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY, FIGHTER_FRONT_FOREARM_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY, FIGHTER_FRONT_HAND_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY, FIGHTER_FRONT_THIGH_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY, FIGHTER_FRONT_SHIN_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY, FIGHTER_FRONT_FOOT_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_HEAD_LIGHT_ASSET_KEY, FIGHTER_HEAD_LIGHT_ASSET_URL);
  target.load.image(FIGHTER_TORSO_LIGHT_ASSET_KEY, FIGHTER_TORSO_LIGHT_ASSET_URL);
}

export class ArenaScene extends Phaser.Scene {
  visuals?: ArenaVisuals;
  currentState?: CombatState;

  constructor() {
    super("ArenaScene");
  }

  preload(): void {
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    this.cameras.main.setBounds(ARENA_WORLD_LEFT, 0, ARENA_WORLD_WIDTH, GAME_HEIGHT);
    drawArenaBackground(this);
    this.visuals = buildVisuals(this);
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => {
      if (this.currentState) {
        renderScene(this, this.currentState);
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeDebugTuning?.());
    readyCallback?.(this);
  }

  update(time: number): void {
    const idle = getActiveBodyAnimation("idle");

    if (!this.visuals || !idle.enabled) {
      return;
    }

    applyLoopingBodyAnimation(this.visuals.player, time, idle);
    applyLoopingBodyAnimation(this.visuals.enemy, time, idle);
  }

  sync(nextState: CombatState): void {
    this.currentState = nextState;

    if (!this.visuals) {
      return;
    }

    renderScene(this, nextState);

    if (nextState.lastPlayerAction) {
      animateAction(this, this.visuals.player, this.visuals.enemy, nextState.lastPlayerAction, "right");
    }

    if (nextState.lastEnemyAction) {
      animateAction(this, this.visuals.enemy, this.visuals.player, nextState.lastEnemyAction, "left");
    }

    if (nextState.lastPlayerDamage > 0) {
      showDamagePopup(this, this.visuals.enemy.body.x, this.visuals.enemy.body.y - 128, nextState.lastPlayerDamage);
      shakeFighter(this, this.visuals.enemy);
    }

    if (nextState.lastEnemyDamage > 0) {
      showDamagePopup(this, this.visuals.player.body.x, this.visuals.player.body.y - 128, nextState.lastEnemyDamage);
      shakeFighter(this, this.visuals.player);
    }
  }

}

export function launchArena(onReady: (scene: ArenaScene) => void, _onAction: (actionId: ActionId) => void): void {
  void _onAction;
  readyCallback = onReady;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "game",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: ArenaScene,
  };

  new Phaser.Game(config);
}

class DebugCharacterScene extends Phaser.Scene {
  private fighter?: FighterVisual;
  private unsubscribeDebugTuning?: () => void;

  constructor() {
    super("DebugCharacterScene");
  }

  preload(): void {
    preloadPaperDollAssets(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0)");
    drawDebugCharacterBackdrop(this);
    this.fighter = createPaperDollFighter(this, createPlayerPaperDollOptions(DEBUG_CHARACTER_CENTER_X, 0));
    this.fighter.name.setVisible(false);
    enableDebugPaperDollPartPicking(this.fighter.paperDollRig);
    this.unsubscribeDebugTuning = subscribeDebugTuning(() => this.sync());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeDebugTuning?.());
    this.sync();
  }

  update(time: number): void {
    const animation = getSelectedDebugBodyAnimation();

    if (!this.fighter || !animation.enabled) {
      return;
    }

    applyBodyAnimation(this.fighter, time, animation);
  }

  private sync(): void {
    if (!this.fighter) {
      return;
    }

    applyPaperDollRigTuning(this.fighter, debugTuning.characterPreviewScale, debugTuning.characterPreviewFeetY, debugTuning.characterPreviewFeetX);
    syncPaperDollSelectionHighlight(this.fighter.paperDollRig);
  }
}

export function mountDebugCharacterViewer(parent: HTMLElement): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DEBUG_CHARACTER_VIEWER_WIDTH,
    height: DEBUG_CHARACTER_VIEWER_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0)",
    transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: DebugCharacterScene,
  });

  return () => game.destroy(true);
}

function drawDebugCharacterBackdrop(target: Phaser.Scene): void {
  const g = target.add.graphics();

  g.fillStyle(0x4e7774, 1);
  g.fillRect(0, 0, DEBUG_CHARACTER_VIEWER_WIDTH, DEBUG_CHARACTER_VIEWER_HEIGHT);
  g.fillStyle(0x6f8b66, 1);
  g.fillRect(0, DEBUG_CHARACTER_FEET_Y - 34, DEBUG_CHARACTER_VIEWER_WIDTH, DEBUG_CHARACTER_VIEWER_HEIGHT - DEBUG_CHARACTER_FEET_Y + 34);
  g.lineStyle(2, 0x35180d, 0.18);
  g.beginPath();
  g.moveTo(0, DEBUG_CHARACTER_FEET_Y - 34);
  g.lineTo(DEBUG_CHARACTER_VIEWER_WIDTH, DEBUG_CHARACTER_FEET_Y - 34);
  g.strokePath();
  g.fillStyle(0x35180d, 0.22);
  g.fillEllipse(DEBUG_CHARACTER_CENTER_X, DEBUG_CHARACTER_FEET_Y + 11, 180, 24);
}

function drawArenaBackground(target: Phaser.Scene): void {
  if (!target.textures.exists(ARENA_BACKGROUND_ASSET_KEY)) {
    drawArena(target);
  }
}

function drawArena(target: Phaser.Scene): void {
  const g = target.add.graphics();

  g.fillStyle(0x4e8fa1, 1);
  g.fillRect(ARENA_WORLD_LEFT, 0, ARENA_WORLD_WIDTH, 130);
  g.fillStyle(0xd38332, 1);
  g.fillRect(ARENA_WORLD_LEFT, 130, ARENA_WORLD_WIDTH, 290);
  g.fillStyle(0x7a3a1a, 1);
  g.fillRect(ARENA_WORLD_LEFT, 198, ARENA_WORLD_WIDTH, 84);
  g.fillStyle(0xe9aa60, 1);
  g.fillEllipse(GAME_WIDTH / 2, 344, 620, 104);
  g.fillStyle(0xd59045, 1);
  g.fillEllipse(GAME_WIDTH / 2, 358, 760, 92);

  for (let i = 0; i < 16; i += 1) {
    const x = ARENA_WORLD_LEFT + i * 78 + 24;
    const y = 148 + (i % 3) * 18;
    g.fillStyle(i % 2 ? 0x75431f : 0x311c11, 1);
    g.fillCircle(x, y, 16);
    g.fillStyle(i % 2 ? 0x9b5a2d : 0x4a2a17, 1);
    g.fillCircle(x + 22, y + 16, 16);
    g.fillStyle(0x2b180f, 1);
    g.fillCircle(x + 48, y + 32, 16);
  }

  target.add
    .text(GAME_WIDTH / 2, 34, "DUST ARENA", {
      color: "#ffe7a4",
      fontFamily: "Georgia",
      fontSize: "34px",
      fontStyle: "900",
      stroke: "#d59045",
      strokeThickness: 4,
    })
    .setOrigin(0.5);
}

function createPlayerPaperDollOptions(x: number, y: number): PaperDollFighterOptions {
  return {
    x,
    y,
    label: "BORSHEMIR",
    facing: 1,
    skin: 0xefaa7b,
    skinDark: 0xd9854d,
    hair: 0x8b4a1f,
    headAssetKey: FIGHTER_HEAD_LIGHT_ASSET_KEY,
    torsoAssetKey: FIGHTER_TORSO_LIGHT_ASSET_KEY,
    bodyPartAssetKeys: {
      backUpperArm: FIGHTER_BACK_UPPER_ARM_LIGHT_ASSET_KEY,
      backForearm: FIGHTER_BACK_FOREARM_LIGHT_ASSET_KEY,
      backHand: FIGHTER_BACK_HAND_LIGHT_ASSET_KEY,
      backThigh: FIGHTER_BACK_THIGH_LIGHT_ASSET_KEY,
      backShin: FIGHTER_BACK_SHIN_LIGHT_ASSET_KEY,
      backFoot: FIGHTER_BACK_FOOT_LIGHT_ASSET_KEY,
      frontUpperArm: FIGHTER_FRONT_UPPER_ARM_LIGHT_ASSET_KEY,
      frontForearm: FIGHTER_FRONT_FOREARM_LIGHT_ASSET_KEY,
      frontHand: FIGHTER_FRONT_HAND_LIGHT_ASSET_KEY,
      frontThigh: FIGHTER_FRONT_THIGH_LIGHT_ASSET_KEY,
      frontShin: FIGHTER_FRONT_SHIN_LIGHT_ASSET_KEY,
      frontFoot: FIGHTER_FRONT_FOOT_LIGHT_ASSET_KEY,
    },
  };
}

function buildVisuals(target: ArenaScene): ArenaVisuals {
  const player = createPaperDollFighter(target, createPlayerPaperDollOptions(DEFAULT_STAGE_ORIGIN_X + DEFAULT_PLAYER_STAGE_X, FIGHTER_BASE_Y));
  const enemy = createPaperDollFighter(target, {
    x: DEFAULT_STAGE_ORIGIN_X + DEFAULT_ENEMY_STAGE_X,
    y: FIGHTER_BASE_Y,
    label: "GRUMBUS",
    facing: -1,
    skin: 0xd48f62,
    skinDark: 0xac673d,
    hair: 0x2f251a,
    muscle: 0x7a4328,
  });
  const playerHud = createHud(target, 30, 46, "BORSHEMIR");
  const enemyHud = createHud(target, 680, 46, "GRUMBUS");
  const roundText = target.add
    .text(GAME_WIDTH / 2, 92, "", {
      color: "#ffe7a4",
      fontFamily: "Georgia",
      fontSize: "20px",
      fontStyle: "900",
      stroke: "#d59045",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  roundText.setVisible(false);

  return { player, enemy, playerHud, enemyHud, roundText };
}

function createHud(target: Phaser.Scene, x: number, y: number, label: string): HudVisual {
  const panel = target.add.rectangle(x + 150, y + 34, 300, 74, 0xf1dca2).setStrokeStyle(4, 0x35180d);
  const hpTrack = target.add.rectangle(x + 150, y + 25, 230, 18, 0x35180d);
  const staminaTrack = target.add.rectangle(x + 150, y + 51, 230, 18, 0x35180d);
  const hpFill = target.add.rectangle(x + 35, y + 25, 226, 14, 0xc32a2a).setOrigin(0, 0.5);
  const staminaFill = target.add.rectangle(x + 35, y + 51, 226, 14, 0x43b5ab).setOrigin(0, 0.5);
  const text = target.add
    .text(x + 150, y + 82, "", {
      color: "#35180d",
      fontFamily: "Georgia",
      fontSize: "16px",
      fontStyle: "900",
    })
    .setOrigin(0.5);

  const name = target.add
    .text(x + 150, y - 4, label, {
      color: "#35180d",
      fontFamily: "Georgia",
      fontSize: "22px",
      fontStyle: "900",
    })
    .setOrigin(0.5);

  [panel, hpTrack, staminaTrack, hpFill, staminaFill, text, name].forEach((part) => part.setVisible(false));

  return { hpFill, staminaFill, label: text };
}

function createPaperDollFighter(target: Phaser.Scene, options: PaperDollFighterOptions): FighterVisual {
  const appearance: PaperDollAppearance = {
    facing: options.facing,
    skin: options.skin,
    skinDark: options.skinDark,
    hair: options.hair,
    muscle: options.muscle ?? DEFAULT_PAPER_DOLL_APPEARANCE.muscle,
  };
  const initialFeetY = options.y + PLAYER_AVATAR_FEET_Y_OFFSET;
  const rootContainer = target.add.container(options.x, initialFeetY);
  const root = part(rootContainer);
  const parts = {} as Record<PaperDollPartKey, FighterPart>;
  const faceParts: PaperDollFaceParts = {};
  const selectionHighlights = {} as Record<PaperDollPartKey, Phaser.GameObjects.Graphics>;

  PAPER_DOLL_PART_ORDER.forEach((key) => {
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const partContainer = target.add.container(pivot.x, pivot.y);

    addPaperDollPartVisual(target, partContainer, key, appearance, options, faceParts);
    selectionHighlights[key] = addPaperDollPartSelectionHighlight(target, partContainer, key);
    rootContainer.add(partContainer);
    parts[key] = part(partContainer);
  });

  root.scaleX = PAPER_DOLL_BASE_SCALE * appearance.facing;
  root.scaleY = PAPER_DOLL_BASE_SCALE;

  const name = part(
    target.add
      .text(options.x, initialFeetY + 30 * PAPER_DOLL_BASE_SCALE, options.label, {
        color: "#35180d",
        fontFamily: "Georgia",
        fontSize: "19px",
        fontStyle: "900",
      })
      .setOrigin(0.5),
  );
  name.setVisible(false);

  return {
    body: root,
    head: parts.head,
    eyeLeft: faceParts.eyeLeft ?? parts.head,
    eyeRight: faceParts.eyeRight ?? parts.head,
    helmet: parts.head,
    plume: parts.head,
    sword: parts.frontHand,
    armFront: parts.frontUpperArm,
    armBack: parts.backUpperArm,
    legFront: parts.frontThigh,
    legBack: parts.backThigh,
    shadow: root,
    name,
    movableParts: [root, name],
    animatedParts: [root],
    paperDollRig: {
      root,
      parts,
      faceParts,
      appearance,
      selectionHighlights,
    },
    debugScale: 1,
  };
}

const PAPER_DOLL_PART_ORDER: PaperDollPartKey[] = [
  "backThigh",
  "frontThigh",
  "backShin",
  "frontShin",
  "backFoot",
  "frontFoot",
  "backUpperArm",
  "frontUpperArm",
  "torso",
  "head",
  "backForearm",
  "frontForearm",
  "backHand",
  "frontHand",
];

const PAPER_DOLL_PART_PIVOTS: Record<PaperDollPartKey, { x: number; y: number }> = {
  head: { x: 0, y: -205 },
  torso: { x: 0, y: -84 },
  backUpperArm: { x: -43, y: -180 },
  backForearm: { x: -58, y: -115 },
  backHand: { x: -64, y: -55 },
  frontUpperArm: { x: 43, y: -180 },
  frontForearm: { x: 58, y: -115 },
  frontHand: { x: 64, y: -55 },
  backThigh: { x: -25, y: -78 },
  backShin: { x: -31, y: -40 },
  backFoot: { x: -38, y: -7 },
  frontThigh: { x: 25, y: -78 },
  frontShin: { x: 31, y: -40 },
  frontFoot: { x: 38, y: -7 },
};

const PAPER_DOLL_PART_HIT_AREAS: Record<PaperDollPartKey, Phaser.Geom.Rectangle> = {
  head: new Phaser.Geom.Rectangle(-50, -112, 100, 128),
  torso: new Phaser.Geom.Rectangle(-48, -112, 96, 126),
  backUpperArm: new Phaser.Geom.Rectangle(-28, -14, 56, 104),
  backForearm: new Phaser.Geom.Rectangle(-26, -12, 52, 84),
  backHand: new Phaser.Geom.Rectangle(-28, -22, 56, 64),
  frontUpperArm: new Phaser.Geom.Rectangle(-28, -14, 56, 104),
  frontForearm: new Phaser.Geom.Rectangle(-26, -12, 52, 84),
  frontHand: new Phaser.Geom.Rectangle(-28, -22, 56, 64),
  backThigh: new Phaser.Geom.Rectangle(-28, -16, 56, 100),
  backShin: new Phaser.Geom.Rectangle(-26, -12, 52, 92),
  backFoot: new Phaser.Geom.Rectangle(-56, -18, 86, 52),
  frontThigh: new Phaser.Geom.Rectangle(-28, -16, 56, 100),
  frontShin: new Phaser.Geom.Rectangle(-26, -12, 52, 92),
  frontFoot: new Phaser.Geom.Rectangle(-30, -18, 86, 52),
};

function applyPaperDollRigTuning(fighter: FighterVisual, scale: number, feetY: number, centerX = fighter.body.x): void {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  rig.root.x = centerX;
  rig.root.y = feetY;
  rig.root.scaleX = PAPER_DOLL_BASE_SCALE * scale * rig.appearance.facing;
  rig.root.scaleY = PAPER_DOLL_BASE_SCALE * scale;
  applyRigPartDebugTuning(rig);
  fighter.name.x = centerX;
  fighter.name.y = feetY + 30 * PAPER_DOLL_BASE_SCALE * scale;
  fighter.debugScale = scale;
}

function applyRigPartDebugTuning(rig: PaperDollRig): void {
  const activeDebugTuning = getActiveDebugTuning();
  const rigParts = activeDebugTuning?.rigParts;
  const faceParts = activeDebugTuning?.faceParts ?? DEFAULT_FACE_PARTS;

  RIG_PART_KEYS.forEach((key) => {
    const part = rig.parts[key];
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const tuning = rigParts?.[key] ?? DEFAULT_RIG_PARTS[key] ?? defaultRigPartTuning;

    applyRigPartTransform(part, pivot, tuning);
  });

  applyFacePartTransform(rig.faceParts.eyeLeft, HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeLeft);
  applyFacePartTransform(rig.faceParts.eyeRight, HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, faceParts.eyeRight);
}

function applyLoopingBodyAnimation(fighter: FighterVisual, time: number, animation: BodyAnimationTuning): void {
  if ((fighter.bodyAnimationLockedUntil ?? 0) > time) {
    return;
  }

  applyBodyAnimation(fighter, time, animation);
}

function applyBodyAnimation(fighter: FighterVisual, time: number, animation: BodyAnimationTuning): void {
  const duration = Math.max(1, animation.duration);
  const phase = (time % duration) / duration;
  const blend = 0.5 - Math.cos(phase * Math.PI * 2) * 0.5;

  applyBodyAnimationBlend(fighter, animation, blend);
}

function applyBodyAnimationBlend(fighter: FighterVisual, animation: BodyAnimationTuning, blend: number): void {
  const rig = fighter.paperDollRig;

  if (!rig) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    if (!animation.activeParts[key]) {
      return;
    }

    const part = rig.parts[key];
    const pivot = PAPER_DOLL_PART_PIVOTS[key];
    const tuning = interpolateRigPartTuning(animation.base[key] ?? defaultRigPartTuning, animation.breath[key] ?? defaultRigPartTuning, blend);

    applyRigPartTransform(part, pivot, tuning);
  });

  applyFacePartTransform(
    rig.faceParts.eyeLeft,
    HEAD_FACE_LEFT_EYE_X,
    HEAD_FACE_EYE_Y,
    interpolateFacePartTuning(animation.faceBase.eyeLeft, animation.faceBreath.eyeLeft, blend),
  );
  applyFacePartTransform(
    rig.faceParts.eyeRight,
    HEAD_FACE_RIGHT_EYE_X,
    HEAD_FACE_EYE_Y,
    interpolateFacePartTuning(animation.faceBase.eyeRight, animation.faceBreath.eyeRight, blend),
  );
}

function interpolateRigPartTuning(from: RigPartTuning, to: RigPartTuning, blend: number): RigPartTuning {
  return {
    x: lerp(from.x, to.x, blend),
    y: lerp(from.y, to.y, blend),
    angle: lerp(from.angle, to.angle, blend),
    scaleX: lerp(from.scaleX, to.scaleX, blend),
    scaleY: lerp(from.scaleY, to.scaleY, blend),
    flipX: blend < 0.5 ? from.flipX : to.flipX,
    flipY: blend < 0.5 ? from.flipY : to.flipY,
  };
}

function interpolateFacePartTuning(from: FacePartTuning, to: FacePartTuning, blend: number): FacePartTuning {
  return {
    x: lerp(from.x, to.x, blend),
    y: lerp(from.y, to.y, blend),
    scaleX: lerp(from.scaleX, to.scaleX, blend),
    scaleY: lerp(from.scaleY, to.scaleY, blend),
  };
}

function applyRigPartTransform(part: FighterPart, pivot: { x: number; y: number }, tuning: RigPartTuning): void {
  part.x = pivot.x + tuning.x;
  part.y = pivot.y + tuning.y;
  part.angle = tuning.angle;
  part.scaleX = tuning.scaleX * (tuning.flipX ? -1 : 1);
  part.scaleY = tuning.scaleY * (tuning.flipY ? -1 : 1);
}

function applyFacePartTransform(part: FighterPart | undefined, baseX: number, baseY: number, tuning: FacePartTuning): void {
  if (!part) {
    return;
  }

  part.x = baseX + tuning.x;
  part.y = baseY + tuning.y;
  part.scaleX = tuning.scaleX;
  part.scaleY = tuning.scaleY;
}

function enableDebugPaperDollPartPicking(rig: PaperDollRig | undefined): void {
  if (!rig) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    const partContainer = rig.parts[key] as Phaser.GameObjects.Container;

    partContainer.setInteractive(PAPER_DOLL_PART_HIT_AREAS[key], Phaser.Geom.Rectangle.Contains);

    if (partContainer.input) {
      partContainer.input.cursor = "pointer";
    }

    partContainer.on("pointerdown", (...args: unknown[]) => {
      const event = args[3] as { stopPropagation?: () => void } | undefined;

      event?.stopPropagation?.();
      updateDebugTuning({ selectedRigPart: key });
    });
  });
}

function syncPaperDollSelectionHighlight(rig: PaperDollRig | undefined): void {
  if (!rig) {
    return;
  }

  RIG_PART_KEYS.forEach((key) => {
    rig.selectionHighlights[key].setVisible(key === debugTuning.selectedRigPart);
  });
}

function lerp(from: number, to: number, blend: number): number {
  return from + (to - from) * blend;
}

function addPaperDollPartSelectionHighlight(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
): Phaser.GameObjects.Graphics {
  const highlight = target.add.graphics();

  drawPaperDollPartSelectionHighlight(highlight, key);
  highlight.setVisible(false);
  partContainer.add(highlight);

  return highlight;
}

function drawPaperDollPartSelectionHighlight(graphics: Phaser.GameObjects.Graphics, key: PaperDollPartKey): void {
  const fill = PAPER_DOLL_SELECTION_FILL;
  const stroke = PAPER_DOLL_SELECTION_STROKE;
  const fillAlpha = 0.18;
  const strokeAlpha = 0.9;
  const strokeWidth = 5;
  const side = key.startsWith("front") ? 1 : -1;

  graphics.clear();

  if (key === "torso") {
    drawDollPolygon(
      graphics,
      [
        { x: -41, y: -108 },
        { x: 41, y: -108 },
        { x: 34, y: -25 },
        { x: 19, y: 11 },
        { x: -19, y: 11 },
        { x: -34, y: -25 },
      ],
      fill,
      stroke,
      1,
      fillAlpha,
      strokeWidth,
      strokeAlpha,
    );
    return;
  }

  if (key === "head") {
    drawDollEllipse(graphics, -42, -33, 26, 35, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    drawDollEllipse(graphics, 42, -33, 26, 35, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    drawDollEllipse(graphics, 0, -39, 84, 92, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    drawDollEllipse(graphics, 0, 0, 30, 32, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("UpperArm")) {
    drawDollEllipse(graphics, 8 * side, 35, 36, 92, -0.18 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("Forearm")) {
    drawDollEllipse(graphics, 5 * side, 29, 32, 70, -0.06 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("Hand")) {
    drawDollEllipse(graphics, 4 * side, 12, 36, 36, 0, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("Thigh")) {
    drawDollEllipse(graphics, 3 * side, 25, 36, 78, -0.05 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  if (key.endsWith("Shin")) {
    drawDollEllipse(graphics, 4 * side, 28, 33, 76, 0.04 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
    return;
  }

  drawDollEllipse(graphics, 14 * side, 8, 56, 28, -0.08 * side, fill, stroke, 1, fillAlpha, strokeWidth, strokeAlpha);
}

function addPaperDollPartVisual(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  key: PaperDollPartKey,
  appearance: PaperDollAppearance,
  options: PaperDollFighterOptions,
  faceParts: PaperDollFaceParts,
): void {
  if (key === "head" && options.headAssetKey && target.textures.exists(options.headAssetKey)) {
    const image = target.add.image(0, HEAD_ASSET_LOCAL_BOTTOM_Y, options.headAssetKey);
    image.setOrigin(HEAD_ASSET_ORIGIN_X, HEAD_ASSET_ORIGIN_Y);
    image.displayHeight = HEAD_ASSET_DISPLAY_HEIGHT;
    image.scaleX = image.scaleY;
    partContainer.add(image);
    addPaperDollFaceOverlay(target, partContainer, faceParts, true);
    return;
  }

  if (key === "torso" && options.torsoAssetKey && target.textures.exists(options.torsoAssetKey)) {
    const image = target.add.image(0, TORSO_ASSET_LOCAL_BOTTOM_Y, options.torsoAssetKey);
    image.setOrigin(TORSO_ASSET_ORIGIN_X, TORSO_ASSET_ORIGIN_Y);
    image.displayHeight = TORSO_ASSET_DISPLAY_HEIGHT;
    image.scaleX = image.scaleY;
    partContainer.add(image);
    return;
  }

  const assetKey = options.bodyPartAssetKeys?.[key];
  const assetConfig = PAPER_DOLL_PART_ASSET_CONFIGS[key];

  if (assetKey && assetConfig && target.textures.exists(assetKey)) {
    const image = target.add.image(assetConfig.localX, assetConfig.localY, assetKey);
    image.setOrigin(assetConfig.originX, assetConfig.originY);
    image.displayHeight = assetConfig.displayHeight;
    image.scaleX = image.scaleY;
    partContainer.add(image);
    return;
  }

  const graphics = target.add.graphics();
  drawPaperDollPart(graphics, key, appearance);
  partContainer.add(graphics);

  if (key === "head") {
    addPaperDollFaceOverlay(target, partContainer, faceParts, false);
  }
}

function addPaperDollFaceOverlay(
  target: Phaser.Scene,
  partContainer: Phaser.GameObjects.Container,
  faceParts: PaperDollFaceParts,
  shouldCoverBakedEyes: boolean,
): void {
  if (shouldCoverBakedEyes) {
    const leftCover = target.add.ellipse(HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_COVER_WIDTH, HEAD_FACE_EYE_COVER_HEIGHT, HEAD_FACE_EYE_WHITE);
    const rightCover = target.add.ellipse(HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_COVER_WIDTH, HEAD_FACE_EYE_COVER_HEIGHT, HEAD_FACE_EYE_WHITE);

    partContainer.add([leftCover, rightCover]);
  }

  const eyeLeft = target.add.ellipse(HEAD_FACE_LEFT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_WIDTH, HEAD_FACE_EYE_HEIGHT, HEAD_FACE_EYE_BLACK);
  const eyeRight = target.add.ellipse(HEAD_FACE_RIGHT_EYE_X, HEAD_FACE_EYE_Y, HEAD_FACE_EYE_WIDTH, HEAD_FACE_EYE_HEIGHT, HEAD_FACE_EYE_BLACK);

  partContainer.add([eyeLeft, eyeRight]);
  faceParts.eyeLeft = part(eyeLeft);
  faceParts.eyeRight = part(eyeRight);
}

function drawPaperDollPart(graphics: Phaser.GameObjects.Graphics, key: PaperDollPartKey, appearance: PaperDollAppearance): void {
  const skin = appearance.skin;
  const skinDark = appearance.skinDark;
  const outline = 0x35180d;
  const muscle = appearance.muscle;
  const hair = appearance.hair;
  const isBack = key.startsWith("back");
  const side = key.startsWith("front") ? 1 : -1;
  const limbFill = isBack ? skinDark : skin;

  graphics.clear();

  if (key === "torso") {
    drawDollPolygon(
      graphics,
      [
        { x: -39, y: -106 },
        { x: 39, y: -106 },
        { x: 31, y: -25 },
        { x: 17, y: 8 },
        { x: -17, y: 8 },
        { x: -31, y: -25 },
      ],
      skin,
      outline,
      1,
      1,
      5,
    );
    drawDollLine(graphics, 0, -94, 0, -3, muscle, 1, 3, 0.7);
    drawDollEllipse(graphics, -14, -68, 25, 16, 0, 0x000000, muscle, 1, 0, 3, 0.7);
    drawDollEllipse(graphics, 14, -68, 25, 16, 0, 0x000000, muscle, 1, 0, 3, 0.7);
    drawDollEllipse(graphics, -8, -28, 16, 12, 0, 0x000000, muscle, 1, 0, 3, 0.7);
    drawDollEllipse(graphics, 8, -28, 16, 12, 0, 0x000000, muscle, 1, 0, 3, 0.7);
    return;
  }

  if (key === "head") {
    drawDollEllipse(graphics, 0, 0, 26, 28, 0, skin, outline, 1, 1, 4);
    drawDollEllipse(graphics, -42, -33, 23, 32, 0, skin, outline, 1, 1, 4);
    drawDollEllipse(graphics, 42, -33, 23, 32, 0, skin, outline, 1, 1, 4);
    drawDollEllipse(graphics, 0, -39, 78, 86, 0, skin, outline, 1, 1, 5);
    drawDollPolygon(
      graphics,
      [
        { x: -37, y: -46 },
        { x: -26, y: -77 },
        { x: 8, y: -87 },
        { x: 36, y: -64 },
        { x: 37, y: -42 },
        { x: 22, y: -53 },
        { x: -8, y: -57 },
        { x: -37, y: -38 },
      ],
      hair,
      outline,
      1,
      1,
      5,
    );
    drawDollPolygon(
      graphics,
      [
        { x: -12, y: -72 },
        { x: -2, y: -102 },
        { x: 15, y: -77 },
        { x: 4, y: -66 },
      ],
      hair,
      outline,
      1,
      1,
      4,
    );
    drawDollSmile(graphics, 0, -26, 12, outline, 1);
    return;
  }

  if (key.endsWith("UpperArm")) {
    drawDollEllipse(graphics, 8 * side, 35, 31, 86, -0.18 * side, limbFill, outline, 1, 1, 4);
    return;
  }

  if (key.endsWith("Forearm")) {
    drawDollEllipse(graphics, 5 * side, 29, 27, 64, -0.06 * side, limbFill, outline, 1, 1, 4);
    return;
  }

  if (key.endsWith("Hand")) {
    drawDollEllipse(graphics, 4 * side, 12, 30, 30, 0, limbFill, outline, 1, 1, 4);
    return;
  }

  if (key.endsWith("Thigh")) {
    drawDollEllipse(graphics, 3 * side, 25, 30, 72, -0.05 * side, limbFill, outline, 1, 1, 4);
    return;
  }

  if (key.endsWith("Shin")) {
    drawDollEllipse(graphics, 4 * side, 28, 27, 70, 0.04 * side, limbFill, outline, 1, 1, 4);
    return;
  }

  drawDollEllipse(graphics, 14 * side, 8, 50, 22, -0.08 * side, limbFill, outline, 1, 1, 4);
}

function drawDollEllipse(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  fill: number,
  outline: number,
  scale: number,
  fillAlpha = 1,
  strokeWidth = 4,
  strokeAlpha = 1,
): void {
  const points = createEllipsePoints(x, y, width / 2, height / 2, rotation, 28);
  drawDollPolygon(graphics, points, fill, outline, scale, fillAlpha, strokeWidth, strokeAlpha);
}

function drawDollPolygon(
  graphics: Phaser.GameObjects.Graphics,
  points: { x: number; y: number }[],
  fill: number,
  outline: number,
  scale: number,
  fillAlpha = 1,
  strokeWidth = 4,
  strokeAlpha = 1,
): void {
  if (points.length === 0) {
    return;
  }

  graphics.fillStyle(fill, fillAlpha);
  graphics.lineStyle(Math.max(1, strokeWidth * scale), outline, strokeAlpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x * scale, points[0].y * scale);

  for (const point of points.slice(1)) {
    graphics.lineTo(point.x * scale, point.y * scale);
  }

  graphics.closePath();

  if (fillAlpha > 0) {
    graphics.fillPath();
  }

  if (strokeWidth > 0 && strokeAlpha > 0) {
    graphics.strokePath();
  }
}

function drawDollLine(
  graphics: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: number,
  scale: number,
  width: number,
  alpha = 1,
): void {
  graphics.lineStyle(Math.max(1, width * scale), color, alpha);
  graphics.beginPath();
  graphics.moveTo(x1 * scale, y1 * scale);
  graphics.lineTo(x2 * scale, y2 * scale);
  graphics.strokePath();
}

function drawDollSmile(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color: number, scale: number): void {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= 10; i += 1) {
    const angle = 0.1 * Math.PI + (0.8 * Math.PI * i) / 10;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
    });
  }

  graphics.lineStyle(Math.max(1, 3 * scale), color, 1);
  graphics.beginPath();
  graphics.moveTo(points[0].x * scale, points[0].y * scale);

  for (const point of points.slice(1)) {
    graphics.lineTo(point.x * scale, point.y * scale);
  }

  graphics.strokePath();
}

function createEllipsePoints(
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
  segments: number,
): { x: number; y: number }[] {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < segments; i += 1) {
    const angle = (Math.PI * 2 * i) / segments;
    const localX = Math.cos(angle) * radiusX;
    const localY = Math.sin(angle) * radiusY;

    points.push({
      x: x + localX * cos - localY * sin,
      y: y + localX * sin + localY * cos,
    });
  }

  return points;
}

function renderScene(target: ArenaScene, current: CombatState): void {
  if (!target.visuals) {
    return;
  }

  positionFightersForState(target, target.visuals, current);
  updateCamera(target, current);
  setHud(target.visuals.playerHud, current.player);
  setHud(target.visuals.enemyHud, current.enemy);
  target.visuals.roundText.setText(`Round ${current.round} / ${ROUND_LIMIT}`);
  setFighterAlpha(target.visuals.player, current.player.hp <= 0 ? 0.45 : 1);
  setFighterAlpha(target.visuals.enemy, current.enemy.hp <= 0 ? 0.45 : 1);
}

function setHud(hud: HudVisual, fighter: FighterState): void {
  const maxHp = getFighterMaxHp(fighter);
  const maxStamina = getFighterMaxStamina(fighter);

  hud.hpFill.displayWidth = 226 * (fighter.hp / maxHp);
  hud.staminaFill.displayWidth = 226 * (fighter.stamina / maxStamina);
  hud.label.setText(`HP ${fighter.hp}/${maxHp}  STA ${fighter.stamina}/${maxStamina}`);
}

function setFighterAlpha(fighter: FighterVisual, alpha: number): void {
  getFighterParts(fighter).forEach((part) => part.setAlpha(alpha));
}

function positionFightersForState(target: Phaser.Scene, visuals: ArenaVisuals, current: CombatState): void {
  const layout = getStageLayout(current, getActiveDebugTuning());
  const shouldSnap = isDebugTuningActive();

  positionFighterForLayout(target, visuals.player, layout.playerX, layout.playerScale, layout.playerY, shouldSnap);
  positionFighterForLayout(target, visuals.enemy, layout.enemyX, layout.enemyScale, layout.enemyY, shouldSnap);
}

function positionFighterForLayout(
  target: Phaser.Scene,
  fighter: FighterVisual,
  x: number,
  scale: number,
  feetY: number,
  shouldSnap: boolean,
): void {
  if (shouldSnap) {
    setFighterXImmediate(fighter, x);
  } else {
    setFighterX(target, fighter, x);
  }

  applyFighterTuning(fighter, scale, feetY);
}

function applyFighterTuning(fighter: FighterVisual, scale: number, feetY: number): void {
  if (fighter.paperDollRig) {
    applyPaperDollRigTuning(fighter, scale, feetY);
  }
}

function updateCamera(target: Phaser.Scene, current: CombatState): void {
  const camera = target.cameras.main;
  const cameraTarget = getCameraTarget(current, getActiveDebugTuning());
  const shouldSnap = isDebugTuningActive();

  target.tweens.killTweensOf(camera);
  syncStageBackground(cameraTarget, shouldSnap);

  if (shouldSnap) {
    camera.setScroll(cameraTarget.scrollX, cameraTarget.scrollY);
    camera.setZoom(cameraTarget.zoom);
    return;
  }

  target.tweens.add({
    targets: camera,
    scrollX: cameraTarget.scrollX,
    scrollY: cameraTarget.scrollY,
    zoom: cameraTarget.zoom,
    duration: 320,
    ease: "Sine.easeInOut",
  });
}

function syncStageBackground(cameraTarget: CameraTarget, shouldSnap: boolean): void {
  const gameScreen = document.querySelector<HTMLElement>("#gameScreen");

  if (!gameScreen) {
    return;
  }

  gameScreen.style.setProperty("--arena-camera-x", `${-cameraTarget.scrollX * cameraTarget.zoom}px`);
  gameScreen.style.setProperty("--arena-camera-y", `${-cameraTarget.scrollY * cameraTarget.zoom}px`);
  gameScreen.style.setProperty("--arena-camera-zoom", `${cameraTarget.zoom}`);
  gameScreen.style.setProperty("--arena-camera-transition", shouldSnap ? "none" : "transform 320ms ease");
}

function getActiveDebugTuning(): typeof debugTuning | undefined {
  return isDebugTuningActive() ? debugTuning : undefined;
}

function isDebugTuningActive(): boolean {
  return typeof document !== "undefined" && document.body.classList.contains("debug-active");
}

function getActiveBodyAnimation(key: BodyAnimationKey): BodyAnimationTuning {
  if (isDebugTuningActive()) {
    return debugTuning.bodyAnimations[key] ?? DEFAULT_BODY_ANIMATIONS[key];
  }

  return DEFAULT_BODY_ANIMATIONS[key];
}

function getSelectedDebugBodyAnimation(): BodyAnimationTuning {
  return debugTuning.bodyAnimations[debugTuning.selectedBodyAnimation] ?? DEFAULT_BODY_ANIMATIONS[debugTuning.selectedBodyAnimation];
}

function setFighterXImmediate(fighter: FighterVisual, nextX: number): void {
  const delta = nextX - fighter.body.x;

  if (Math.abs(delta) < 0.5) {
    return;
  }

  getFighterParts(fighter).forEach((part) => {
    part.x += delta;
  });
}

function setFighterX(target: Phaser.Scene, fighter: FighterVisual, nextX: number): void {
  const delta = nextX - fighter.body.x;

  if (Math.abs(delta) < 0.5) {
    return;
  }

  getFighterParts(fighter).forEach((part) => {
    target.tweens.add({
      targets: part,
      x: part.x + delta,
      duration: FIGHTER_MOVE_DURATION,
      ease: "Sine.easeInOut",
    });
  });
}
function getFighterParts(fighter: FighterVisual): FighterPart[] {
  if (fighter.movableParts) {
    return [...fighter.movableParts];
  }

  return [
    fighter.body,
    fighter.head,
    fighter.eyeLeft,
    fighter.eyeRight,
    fighter.helmet,
    fighter.plume,
    fighter.sword,
    fighter.armFront,
    fighter.armBack,
    fighter.legFront,
    fighter.legBack,
    fighter.shadow,
    fighter.name,
    ...(fighter.extraParts ?? []),
  ] as FighterPart[];
}

function playBodyAnimationOnce(target: Phaser.Scene, fighter: FighterVisual, animation: BodyAnimationTuning): void {
  const rig = fighter.paperDollRig;

  if (!rig || !animation.enabled) {
    return;
  }

  const duration = Math.max(1, animation.duration);
  const lockedUntil = target.time.now + duration;

  fighter.bodyAnimationLockedUntil = lockedUntil;
  target.tweens.killTweensOf(Object.values(rig.parts));
  applyBodyAnimationBlend(fighter, animation, 0);

  target.tweens.addCounter({
    from: 0,
    to: 1,
    duration: Math.max(1, duration / 2),
    yoyo: true,
    ease: "Sine.easeInOut",
    onUpdate: (tween) => {
      applyBodyAnimationBlend(fighter, animation, tween.getValue());
    },
    onComplete: () => {
      if (fighter.bodyAnimationLockedUntil === lockedUntil) {
        fighter.bodyAnimationLockedUntil = 0;
      }
    },
  });
}

function animateAction(
  target: Phaser.Scene,
  actor: FighterVisual,
  opponent: FighterVisual,
  actionId: ActionId,
  direction: "left" | "right",
): void {
  const sign = direction === "right" ? 1 : -1;
  const dx = getActionAnimationDx(actor, opponent, actionId, direction);
  const y = actionId === "rest" ? "+=14" : 0;
  const parts = getAnimatedFighterParts(actor);

  if (actionId === "forward" || actionId === "back") {
    playBodyAnimationOnce(target, actor, getActiveBodyAnimation("walkCycle"));
    showFloatingText(target, actor.body.x, actor.body.y - 120, actionId === "forward" ? "STEP" : "BACK", "#ffe7a4");
    return;
  }

  if (actionId === "lunge") {
    playBodyAnimationOnce(target, actor, getActiveBodyAnimation("lunge"));
    target.tweens.add({
      targets: parts,
      x: `+=${dx * sign}`,
      duration: 160,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    createDust(target, opponent.body.x - 20 * sign, opponent.body.y + 72);
    return;
  }

  if (actionId === "block") {
    target.tweens.add({
      targets: actor.sword,
      angle: actor.sword.angle + 58 * sign,
      duration: 140,
      yoyo: true,
      ease: "Back.easeOut",
    });
    showFloatingText(target, actor.body.x, actor.body.y - 112, "BLOCK", "#ffe7a4");
    return;
  }

  if (actionId === "taunt") {
    target.tweens.add({
      targets: parts,
      angle: 9 * sign,
      duration: 110,
      yoyo: true,
      repeat: 3,
      ease: "Sine.easeInOut",
    });
    showFloatingText(target, actor.body.x, actor.body.y - 120, "BOO?", "#ffe7a4");
    return;
  }

  if (actionId === "rest") {
    target.tweens.add({
      targets: parts,
      y,
      duration: 180,
      yoyo: true,
      ease: "Quad.easeInOut",
    });
    showFloatingText(target, actor.body.x, actor.body.y - 120, "+STA", "#86fff2");
    return;
  }

  if (isAttackBodyAnimationKey(actionId)) {
    playBodyAnimationOnce(target, actor, getActiveBodyAnimation(actionId));
  }

  target.tweens.add({
    targets: parts,
    x: `+=${dx * sign}`,
    duration: 120,
    yoyo: true,
    ease: "Quad.easeOut",
  });

  target.tweens.add({
    targets: actor.sword,
    angle: actor.sword.angle - 32 * sign,
    duration: 110,
    yoyo: true,
    ease: "Back.easeOut",
  });

  createDust(target, opponent.body.x - 20 * sign, opponent.body.y + 72);
}

function isAttackBodyAnimationKey(actionId: ActionId): actionId is Extract<BodyAnimationKey, "light" | "medium" | "heavy"> {
  return actionId === "light" || actionId === "medium" || actionId === "heavy";
}

function getActionAnimationDx(actor: FighterVisual, opponent: FighterVisual, actionId: ActionId, direction: "left" | "right"): number {
  const baseDx = actionId === "lunge" ? 42 : actionId === "heavy" ? 32 : actionId === "medium" ? 28 : actionId === "light" ? 24 : actionId === "taunt" ? -12 : 0;

  if (actionId !== "lunge") {
    return baseDx;
  }

  const gapToOpponent = direction === "right" ? opponent.body.x - actor.body.x : actor.body.x - opponent.body.x;

  return Math.min(baseDx, Math.max(0, gapToOpponent - 2));
}
function shakeFighter(target: Phaser.Scene, fighter: FighterVisual): void {
  const parts = getAnimatedFighterParts(fighter);

  target.tweens.add({
    targets: parts,
    x: "+=10",
    duration: 45,
    yoyo: true,
    repeat: 3,
    ease: "Stepped",
  });
}

function showFloatingText(target: Phaser.Scene, x: number, y: number, text: string, color: string): void {
  const label = target.add
    .text(x, y, text, {
      color,
      fontFamily: "Georgia",
      fontSize: "24px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 4,
    })
    .setOrigin(0.5);

  target.tweens.add({
    targets: label,
    y: y - 48,
    alpha: 0,
    duration: 720,
    ease: "Quad.easeOut",
    onComplete: () => label.destroy(),
  });
}

function getAnimatedFighterParts(fighter: FighterVisual): FighterPart[] {
  if (fighter.animatedParts) {
    return fighter.animatedParts;
  }

  return getFighterParts(fighter).filter((part) => part !== fighter.shadow && part !== fighter.name);
}

function showDamagePopup(target: Phaser.Scene, x: number, y: number, amount: number): void {
  const popup = target.add.container(x, y).setDepth(40);
  const shadow = target.add.graphics();
  const burst = target.add.graphics();
  const label = target.add
    .text(0, -2, `${amount}`, {
      color: "#fff4cf",
      fontFamily: "Georgia",
      fontSize: "30px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 5,
    })
    .setOrigin(0.5);

  drawDamageBurst(shadow, 4, 5, 0x35180d, 0.92);
  drawDamageBurst(burst, 0, 0, 0xd52b1f, 1);
  popup.add([shadow, burst, label]);
  popup.setScale(0.58);
  popup.setAngle(-4);

  target.tweens.add({
    targets: popup,
    scale: 1,
    duration: 130,
    ease: "Back.easeOut",
  });

  target.tweens.add({
    targets: popup,
    y: y - 34,
    alpha: 0,
    duration: 680,
    delay: 180,
    ease: "Quad.easeIn",
    onComplete: () => popup.destroy(),
  });
}

function drawDamageBurst(graphics: Phaser.GameObjects.Graphics, offsetX: number, offsetY: number, color: number, alpha: number): void {
  const points = [
    { x: -34, y: -8 },
    { x: -48, y: -24 },
    { x: -24, y: -23 },
    { x: -19, y: -42 },
    { x: -4, y: -27 },
    { x: 12, y: -44 },
    { x: 15, y: -24 },
    { x: 42, y: -28 },
    { x: 28, y: -7 },
    { x: 46, y: 7 },
    { x: 24, y: 14 },
    { x: 24, y: 36 },
    { x: 4, y: 23 },
    { x: -11, y: 40 },
    { x: -15, y: 19 },
    { x: -42, y: 24 },
    { x: -29, y: 6 },
  ];

  graphics.fillStyle(color, alpha);
  graphics.lineStyle(3, 0x35180d, color === 0x35180d ? 0 : 0.86);
  graphics.beginPath();
  graphics.moveTo(points[0].x + offsetX, points[0].y + offsetY);

  for (const point of points.slice(1)) {
    graphics.lineTo(point.x + offsetX, point.y + offsetY);
  }

  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
}

function createDust(target: Phaser.Scene, x: number, y: number): void {
  for (let i = 0; i < 7; i += 1) {
    const dot = target.add.circle(x + Math.random() * 36 - 18, y + Math.random() * 16, 5 + Math.random() * 7, 0xf0bd72, 0.72);
    target.tweens.add({
      targets: dot,
      x: dot.x + Math.random() * 64 - 32,
      y: dot.y - 26 - Math.random() * 24,
      alpha: 0,
      duration: 480 + Math.random() * 180,
      onComplete: () => dot.destroy(),
    });
  }
}







