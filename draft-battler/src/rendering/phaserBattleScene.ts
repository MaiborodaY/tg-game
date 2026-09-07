import Phaser from "phaser";
import {
  getCardDefinition,
  PLAYER_STARTING_HP,
  type BattleTimeline,
  type BattleTimelineCastle,
  type BattleTimelineEvent,
  type BattleTimelineUnit,
  type CombatStepEvent,
  type Owner,
} from "../game";
import {
  DRAFT_CAMERA_ZOOM,
  createFieldLayout,
  getFieldLeftX,
  getFieldRatio,
  getFieldRightX,
  getFieldSlotColumn,
  getFieldSlotRow,
  getLaneX,
  getSlotLaneX,
  type FieldLayout,
} from "../fieldLayout";
import { getUnitAsset, getUnitAssets } from "../unitAssets";
import { BATTLE_UNIT_ART_GROUND_Y, getGroundedRangedAttackTiming, getGroundedUnitArtBounds, getGroundedUnitArtPlacement, hasGroundedProjectilePose } from "../unitArtGrounding";
import { UnitPoseState, type UnitPose } from "./unitPoseState";
import { UnitMotionState, type UnitMotionResult } from "./unitMotionState";
import {
  BATTLE_CAMERA_CLOSE_ZOOM,
  BATTLE_CAMERA_ZOOM,
  fitStaticUnitArtSize,
  getBattleCameraFrame,
  getBattleFormationPosition,
  getUnitPresentationScale,
} from "./battlePresentationLayout";
import {
  CASTLE_ASSAULT_APPROACH_MS,
  CASTLE_ASSAULT_FADE_MS,
  CASTLE_ASSAULT_FLASH_MS,
  CASTLE_ASSAULT_LUNGE_MS,
  createCastleAssaultPlan,
} from "./castleAssaultPresentation";
import {
  BattlePlaybackClock,
  BattlePlaybackCompletion,
  completeSkippedBattle,
  type BattlePlaybackSpeed,
  type FinalBattlePresentation,
} from "./battlePlayback";
import { applyArmorDelta } from "./armorPresentation";
import { createUnitCombatFeedback, getUnitVitals, UNIT_VITALS_BAR_HEIGHT, UNIT_VITALS_WIDTH } from "./battleUnitHud";
import { getBackdropCoverSize } from "./backdropLayout";
import {
  createBattleAbilityCalloutPlan,
  type BattleAbilityCallout,
  type BattleAbilityCalloutSource,
} from "./battleAbilityPresentation";

const GAME_WIDTH = 390;
const GAME_HEIGHT = 720;
const CASTLE_HP_BAR_WIDTH = 132;
const CASTLE_MAX_HP = PLAYER_STARTING_HP;
const UNIT_SPRITE_DISPLAY_WIDTH = 56;
const UNIT_SPRITE_DISPLAY_HEIGHT = 68;
const UNIT_SPRITE_SHEET_DISPLAY_SIZE = 96;
const UNIT_SPRITE_SHEET_Y = -16;
const UNIT_SPRITE_SHEET_COLUMNS = 5;
const UNIT_DEPTH_BUCKET_SIZE = 8;
const UNIT_SCALE_EPSILON = 0.01;
const UNIT_HP_WIDTH_EPSILON = 0.25;
const BATTLE_PRESENTATION_TIME_SCALE = 2;
const COMBAT_TICK_DURATION_MS = 30;
const COMBAT_STEP_RESULT_DELAY_MS = 110;
const BATTLE_CASTLE_CAMERA_ZOOM = 1.28;
const ENEMY_CASTLE_APPROACH_CAMERA_ZOOM = 1.14;
const PLAYER_KEEP_TEXTURE_KEY = "environment:player-keep";
const PLAYER_KEEP_ASSET_URL = new URL("../assets/environment/player_keep/keep.webp", import.meta.url).href;
const PLAYER_KEEP_DISPLAY_WIDTH = 292;
const PLAYER_KEEP_IMAGE_Y = -7;
const ENEMY_KEEP_DISPLAY_WIDTH = 112;
const ENEMY_CASTLE_HP_BAR_WIDTH = 106;
const KEEP_ASSET_HEIGHT_RATIO = 113 / 190;
const PLAYER_KEEP_DISPLAY_HEIGHT = PLAYER_KEEP_DISPLAY_WIDTH * KEEP_ASSET_HEIGHT_RATIO;
const PLAYER_CASTLE_HP_BAR_Y = PLAYER_KEEP_IMAGE_Y - PLAYER_KEEP_DISPLAY_HEIGHT / 2 - 14;
const PLAYER_CASTLE_HP_LABEL_Y = PLAYER_CASTLE_HP_BAR_Y - 14;
const PLAYER_PROCEDURAL_CASTLE_HP_BAR_Y = -56;
const PLAYER_PROCEDURAL_CASTLE_HP_LABEL_Y = -70;
const BATTLEFIELD_BASE_TEXTURE_KEY = "environment:battlefield:common-forest:base";
const BATTLEFIELD_BASE_ASSET_URL = new URL(
  "../assets/environment/battlefield/common_forest/battlefield_base.webp",
  import.meta.url,
).href;
const BATTLEFIELD_GAME_TEXTURE_KEY = "environment:battlefield:common-forest:diorama";
const BATTLEFIELD_GAME_ASSET_URL = new URL(
  "../assets/environment/battlefield/common_forest/battlefield_diorama.webp",
  import.meta.url,
).href;
const BATTLEFIELD_SIDE_PROPS_TEXTURE_KEY = "environment:battlefield:common-forest:side-props";
const BATTLEFIELD_SIDE_PROPS_ASSET_URL = new URL(
  "../assets/environment/battlefield/common_forest/side_props.webp",
  import.meta.url,
).href;
const BATTLEFIELD_SIDE_PROPS_OVERSCAN_Y = 54;
const BATTLEFIELD_SIDE_PROPS_ALPHA = 0.56;
const USE_DOM_BATTLEFIELD_ENVIRONMENT = false;
const ENABLE_BATTLEFIELD_SIDE_PROPS = false;
const SHOW_FIELD_DEBUG_GUIDES = false;
const BOARD_STAGE_TOP_OFFSET = 12;
const BOARD_STAGE_BOTTOM_OFFSET = 54;
const FPS_TARGET = 60;

export interface PlayBattleInput {
  timeline: BattleTimeline;
  onFinished?: () => void;
  onError?: (error: unknown) => void;
  onCastleHpChanged?: (owner: Owner, hp: number) => void;
  blockLabel: string;
  abilityCalloutLabels: BattleAbilityCalloutLabels;
  reducedMotion?: boolean;
}

export type BattleAbilityCalloutLabels = Readonly<Record<BattleAbilityCalloutSource, string>>;

export interface ShowDraftInput {
  playerCastleHp: number;
  enemyCastleHp: number;
  backdrop?: "menu" | "game";
}

type SceneCommand =
  | { type: "draft"; playerCastleHp: number; enemyCastleHp: number; backdrop?: "menu" | "game" }
  | {
      type: "battle";
      timeline: BattleTimeline;
      onFinished?: () => void;
      onError?: (error: unknown) => void;
      onCastleHpChanged?: (owner: Owner, hp: number) => void;
      blockLabel: string;
      abilityCalloutLabels: BattleAbilityCalloutLabels;
      reducedMotion: boolean;
    };

export interface BattlefieldController {
  showDraft: (input: ShowDraftInput) => void;
  playBattle: (input: PlayBattleInput) => void;
  setBattleSpeed: (speed: BattlePlaybackSpeed) => void;
  skipBattle: () => boolean;
  destroy: () => void;
}

interface ActiveBattlePlayback {
  token: number;
  timeline: BattleTimeline;
  completion: BattlePlaybackCompletion;
  onError?: (error: unknown) => void;
}

interface UnitView {
  unit: BattleTimelineUnit;
  container: Phaser.GameObjects.Container;
  vitals: Phaser.GameObjects.Container;
  hpFill: Phaser.GameObjects.Rectangle;
  hpLabel: Phaser.GameObjects.Text;
  armorLabel: Phaser.GameObjects.Text;
  armor: number;
  sprite?: Phaser.GameObjects.Sprite;
  facing: UnitFacing;
  poseState: UnitPoseState;
  motionState?: UnitMotionState;
  currentFrame?: number;
  depthBucket?: number;
  presentationScale?: number;
  hpFillWidth?: number;
  hpLabelText?: string;
  armorLabelText?: string;
}

type UnitFacing = "south" | "north";

interface UnitArtResult {
  objects: Phaser.GameObjects.GameObject[];
  sprite?: Phaser.GameObjects.Sprite;
}

interface CastleView {
  castle: BattleTimelineCastle;
  container: Phaser.GameObjects.Container;
  hpFill: Phaser.GameObjects.Rectangle;
  hpLabel: Phaser.GameObjects.Text;
  hpBarWidth: number;
  hpFillWidth?: number;
  hpLabelText?: string;
}

interface StrikeEffect {
  shadow: Phaser.GameObjects.Line;
  strike: Phaser.GameObjects.Line;
}

export function mountBattlefield(parent: HTMLElement): BattlefieldController {
  parent.replaceChildren();

  const scene = new CastleBattleScene();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#10150f",
    fps: {
      target: FPS_TARGET,
      limit: 0,
      min: 20,
      smoothStep: true,
    },
    render: {
      antialias: false,
      antialiasGL: false,
      desynchronized: false,
      powerPreference: "high-performance",
      roundPixels: true,
      transparent: false,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      autoRound: true,
    },
    scene,
  });

  return {
    showDraft: (input) => scene.showDraft(input),
    playBattle: (input) => scene.playBattle(input),
    setBattleSpeed: (speed) => scene.setBattleSpeed(speed),
    skipBattle: () => scene.skipBattle(),
    destroy: () => game.destroy(true),
  };
}

class CastleBattleScene extends Phaser.Scene {
  private readonly unitViews = new Map<string, UnitView>();
  private readonly castleViews = new Map<Owner, CastleView>();
  private readonly activeCombatPresentation = new Set<Promise<void>>();
  private readonly activeWalkTimers = new Set<Phaser.Time.TimerEvent>();
  private readonly activeDelayTimers = new Set<Phaser.Time.TimerEvent>();
  private presentationAbortController = new AbortController();
  private readonly strikePool: StrikeEffect[] = [];
  private readonly floatTextPool: Phaser.GameObjects.Text[] = [];
  private readonly glowPool: Phaser.GameObjects.Ellipse[] = [];
  private presentationLayer?: Phaser.GameObjects.Container;
  private viewportBackdrop?: Phaser.GameObjects.Image;
  private command: SceneCommand = {
    type: "draft",
    playerCastleHp: CASTLE_MAX_HP,
    enemyCastleHp: CASTLE_MAX_HP,
  };
  private layout!: FieldLayout;
  private ready = false;
  private playToken = 0;
  private destroyed = false;
  private blockLabel = "BLOCK";
  private abilityCalloutLabels: BattleAbilityCalloutLabels = {
    battle_banner: "BANNER: +{amount} ATK",
    thorn_guard: "THORNS: +{amount} ARMOR",
    pack_hunter: "PACK: +{amount} ATK",
    frost_hex: "FROST: -{amount} ATK",
    shield_wall: "ARMOR +{amount}",
    stone_skin: "ARMOR +{amount}",
    riposte: "ARMOR +{amount}",
    synergy_undead_4: "UNDEAD 4/4: +{amount} ATK",
    bone_pact: "BONE PACT",
    poison_bite: "POISONED",
    poison_tick: "POISON",
    armor_corrosion: "ARMOR −{amount}",
    bodyguard: "INTERCEPT",
    phantom_parry: "PARRY",
    counter: "COUNTER",
    piercing_bolt: "PIERCE",
    frost_delay: "DELAYED",
    moon_chorus: "MOON HEALING",
    threat_sight: "TOP THREAT",
  };
  private battleSpeed: BattlePlaybackSpeed = 1;
  private readonly playbackClock = new BattlePlaybackClock(this.battleSpeed);
  private activeBattle?: ActiveBattlePlayback;

  constructor() {
    super("CastleBattleScene");
  }

  preload(): void {
    if (!USE_DOM_BATTLEFIELD_ENVIRONMENT) {
      this.load.image(PLAYER_KEEP_TEXTURE_KEY, PLAYER_KEEP_ASSET_URL);
    }
    if (!USE_DOM_BATTLEFIELD_ENVIRONMENT) {
      this.load.image(BATTLEFIELD_BASE_TEXTURE_KEY, BATTLEFIELD_BASE_ASSET_URL);
      this.load.image(BATTLEFIELD_GAME_TEXTURE_KEY, BATTLEFIELD_GAME_ASSET_URL);
    }
    getUnitAssets().forEach((asset) => {
      if (asset.spriteSheet) {
        this.load.spritesheet(asset.spriteSheet.key, asset.spriteSheet.path, {
          frameWidth: asset.spriteSheet.frameWidth,
          frameHeight: asset.spriteSheet.frameHeight,
        });
      } else {
        this.load.image(asset.key, asset.path);
      }
    });
    if (!USE_DOM_BATTLEFIELD_ENVIRONMENT && ENABLE_BATTLEFIELD_SIDE_PROPS) {
      this.load.image(BATTLEFIELD_SIDE_PROPS_TEXTURE_KEY, BATTLEFIELD_SIDE_PROPS_ASSET_URL);
    }
  }

  create(): void {
    this.ready = true;
    this.destroyed = false;
    this.scale.on(Phaser.Scale.Events.RESIZE, this.refreshDraftAfterResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.refreshDraftAfterResize, this);
      this.destroyed = true;
      this.ready = false;
      this.cancelActiveBattle();
      this.playToken += 1;
      this.cancelPresentation();
      this.unitViews.clear();
      this.castleViews.clear();
      this.strikePool.length = 0;
      this.floatTextPool.length = 0;
      this.glowPool.length = 0;
      this.presentationLayer = undefined;
      this.viewportBackdrop = undefined;
    });

    this.applyCommand(this.command);
  }

  private refreshDraftAfterResize(): void {
    // The background follows Telegram's viewport even while the same battle keeps playing.
    this.refreshBackdropSize();
    if (!this.ready || this.destroyed || this.command.type !== "draft" || this.activeBattle) return;
    const { width, height } = this.scale;
    if (width <= 0 || height <= 0 || (this.layout?.width === width && this.layout?.height === height)) return;
    // A resize redraws only the current draft presentation; never restart or skip an active timeline.
    this.applyCommand(this.command);
  }

  showDraft(input: ShowDraftInput): void {
    this.setCommand({
      type: "draft",
      playerCastleHp: input.playerCastleHp,
      enemyCastleHp: input.enemyCastleHp,
      backdrop: input.backdrop,
    });
  }

  playBattle(input: PlayBattleInput): void {
    this.setCommand({
      type: "battle",
      timeline: input.timeline,
      onFinished: input.onFinished,
      onError: input.onError,
      onCastleHpChanged: input.onCastleHpChanged,
      blockLabel: input.blockLabel,
      abilityCalloutLabels: input.abilityCalloutLabels,
      reducedMotion: input.reducedMotion === true,
    });
  }

  setBattleSpeed(speed: BattlePlaybackSpeed): void {
    if (this.battleSpeed === speed) {
      return;
    }

    if (this.ready && !this.destroyed) {
      this.playbackClock.setSpeed(speed, this.time.now);
    }
    this.battleSpeed = speed;
    this.applyBattleSpeed();
  }

  skipBattle(): boolean {
    const activeBattle = this.activeBattle;
    if (!this.ready || this.destroyed || !activeBattle) {
      return false;
    }

    return this.completeBattleImmediately(activeBattle);
  }

  private completeBattleImmediately(activeBattle: ActiveBattlePlayback): boolean {
    return completeSkippedBattle(activeBattle.completion, activeBattle.timeline, (presentation) => {
      this.playToken += 1;
      this.playbackClock.stop();
      this.clearScene();
      this.renderFinalBattlePresentation(activeBattle.timeline, presentation);
      if (this.activeBattle === activeBattle) {
        this.activeBattle = undefined;
      }
    });
  }

  private setCommand(command: SceneCommand): void {
    this.command = command;

    if (!this.ready || this.destroyed) {
      return;
    }

    this.applyCommand(command);
  }

  private applyCommand(command: SceneCommand): void {
    this.cancelActiveBattle();
    this.playToken += 1;
    this.playbackClock.stop();
    this.clearScene();
    this.layout = createFieldLayout(this.scale.width, this.scale.height);
    this.drawField();

    if (command.type === "draft") {
      this.getDraftCastles(command.playerCastleHp, command.enemyCastleHp).forEach((castle) => this.createCastle(castle));
      this.wrapSceneInPresentationLayer();
      this.setDraftCamera();
      return;
    }

    command.timeline.castles.forEach((castle) => this.createCastle(castle));
    command.timeline.units.forEach((unit) => this.createUnit(unit));
    this.blockLabel = command.blockLabel;
    this.abilityCalloutLabels = command.abilityCalloutLabels;
    this.wrapSceneInPresentationLayer();
    const activeBattle: ActiveBattlePlayback = {
      token: this.playToken,
      timeline: command.timeline,
      completion: new BattlePlaybackCompletion({
        onFinished: command.onFinished,
        onCastleHpChanged: command.onCastleHpChanged,
      }),
      onError: command.onError,
    };
    this.activeBattle = activeBattle;
    command.timeline.castles.forEach((castle) => activeBattle.completion.emitCastleHp(castle.owner, castle.startHp));
    if (this.activeBattle !== activeBattle || !activeBattle.completion.isActive()) {
      return;
    }
    if (command.reducedMotion) {
      this.completeBattleImmediately(activeBattle);
      return;
    }

    void this.playTimeline(command.timeline, activeBattle).catch((error: unknown) => {
      if (this.activeBattle !== activeBattle || !activeBattle.completion.isActive()) {
        return;
      }

      this.activeBattle = undefined;
      activeBattle.completion.cancel();
      activeBattle.onError?.(error);
    });
  }

  private cancelPresentation(): void {
    this.presentationAbortController.abort();
    this.unitViews.forEach((view) => view.motionState?.dispose());
    this.tweens.killAll();
    this.activeWalkTimers.forEach((timer) => timer.remove(false));
    this.activeWalkTimers.clear();
    this.activeDelayTimers.forEach((timer) => timer.remove(false));
    this.activeDelayTimers.clear();
    this.time.removeAllEvents();
    this.activeCombatPresentation.clear();
  }

  private clearScene(): void {
    this.cancelPresentation();
    this.presentationAbortController = new AbortController();
    [...this.children.list].forEach((child) => child.destroy());
    this.presentationLayer = undefined;
    this.viewportBackdrop = undefined;
    this.unitViews.clear();
    this.castleViews.clear();
    this.strikePool.length = 0;
    this.floatTextPool.length = 0;
    this.glowPool.length = 0;
    this.applyBattleSpeed();
  }

  private applyBattleSpeed(): void {
    if (!this.ready || this.destroyed) {
      return;
    }

    this.time.timeScale = this.battleSpeed;
    this.tweens.timeScale = this.battleSpeed;
  }

  private cancelActiveBattle(): void {
    this.activeBattle?.completion.cancel();
    this.activeBattle = undefined;
  }

  private wrapSceneInPresentationLayer(): void {
    // Camera zoom belongs to the actors, never to the screen-filling background.
    const children = this.children.list.filter((child) => child !== this.viewportBackdrop);
    const layer = this.add.container(0, 0);

    if (children.length > 0) {
      layer.add(children);
    }

    this.presentationLayer = layer;
    this.resetPhaserCamera();
  }

  private addToPresentationLayer<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.presentationLayer?.add(object);

    return object;
  }

  private resetPhaserCamera(): void {
    const camera = this.cameras.main;

    camera.resetFX();
    camera.setZoom(1);
    camera.centerOn(this.layout.width / 2, this.layout.height / 2);
  }

  private drawField(): void {
    const { centerY, fieldTopY, fieldBottomY, laneFractions } = this.layout;
    const hasDomEnvironment = USE_DOM_BATTLEFIELD_ENVIRONMENT;
    const hasBattlefieldBase = !hasDomEnvironment && this.textures.exists(BATTLEFIELD_BASE_TEXTURE_KEY);

    if (!hasDomEnvironment) {
      this.drawParallaxBackdrop();
    }

    if (!hasBattlefieldBase && !hasDomEnvironment) {
      const field = this.add.graphics().setDepth(-30);
      field.fillStyle(0x141c12, 0.9);
      field.beginPath();
      field.moveTo(this.layout.fieldTopLeftX, fieldTopY);
      field.lineTo(this.layout.fieldTopRightX, fieldTopY);
      field.lineTo(this.layout.fieldBottomRightX, fieldBottomY);
      field.lineTo(this.layout.fieldBottomLeftX, fieldBottomY);
      field.closePath();
      field.fillPath();

      drawFieldBand(field, this.layout, fieldTopY + 22, centerY - 72, 0x202018, 0.18);
      drawFieldBand(field, this.layout, centerY - 52, centerY + 52, 0x2a2818, 0.34);
      drawFieldBand(field, this.layout, centerY + 78, fieldBottomY - 22, 0x182718, 0.2);
      this.drawGroundTexture(field);
      this.drawBoardStageOverlay();
    }

    if (SHOW_FIELD_DEBUG_GUIDES) {
      const lines = this.add.graphics().setDepth(-10);
      lines.lineStyle(1, 0xf3f0dd, hasBattlefieldBase ? 0.07 : 0.12);
      drawPerspectiveLine(lines, this.layout.fieldTopLeftX, fieldTopY, this.layout.fieldBottomLeftX, fieldBottomY);
      drawPerspectiveLine(lines, this.layout.fieldTopRightX, fieldTopY, this.layout.fieldBottomRightX, fieldBottomY);

      lines.lineStyle(1, 0xf3f0dd, hasBattlefieldBase ? 0.04 : 0.08);
      laneFractions.forEach((_, column) => {
        drawPerspectiveLine(
          lines,
          getLaneX(this.layout, column, fieldTopY + 8),
          fieldTopY + 8,
          getLaneX(this.layout, column, fieldBottomY - 8),
          fieldBottomY - 8,
        );
      });

      [fieldTopY + 96, centerY, fieldBottomY - 96].forEach((y, index) => {
        lines.lineStyle(index === 1 ? 2 : 1, index === 1 ? 0xe4c15e : 0xf3f0dd, index === 1 ? 0.32 : 0.06);
        drawPerspectiveLine(lines, getFieldLeftX(this.layout, y) + 14, y, getFieldRightX(this.layout, y) - 14, y);
      });
    }
  }

  private drawParallaxBackdrop(): void {
    const { width, height, fieldTopY } = this.layout;
    const backgroundPad = 260;

    const hasBattlefieldBase = this.textures.exists(BATTLEFIELD_BASE_TEXTURE_KEY);
    const sidePropsSize = getBackdropDisplaySize(this.layout, BATTLEFIELD_SIDE_PROPS_OVERSCAN_Y);

    if (hasBattlefieldBase) {
      // Keep the original menu art; the quieter lane is used only in a match.
      const useGameBackdrop = !(this.command.type === "draft" && this.command.backdrop === "menu") &&
        this.textures.exists(BATTLEFIELD_GAME_TEXTURE_KEY);
      this.viewportBackdrop = this.add
        .image(width / 2, height / 2, useGameBackdrop ? BATTLEFIELD_GAME_TEXTURE_KEY : BATTLEFIELD_BASE_TEXTURE_KEY)
        .setDepth(-120)
        .setScrollFactor(0);
      this.refreshBackdropSize();

      if (ENABLE_BATTLEFIELD_SIDE_PROPS && this.textures.exists(BATTLEFIELD_SIDE_PROPS_TEXTURE_KEY)) {
        this.add
          .image(width / 2, height / 2 + 8, BATTLEFIELD_SIDE_PROPS_TEXTURE_KEY)
          .setDepth(-25)
          .setScrollFactor(0.38)
          .setAlpha(BATTLEFIELD_SIDE_PROPS_ALPHA)
          .setDisplaySize(sidePropsSize.width, sidePropsSize.height);
      }

      return;
    }

    const far = this.add.graphics().setDepth(-100).setScrollFactor(0.06);
    far.fillStyle(0x0d120f, 1);
    far.fillRect(-backgroundPad, -backgroundPad, width + backgroundPad * 2, height + backgroundPad * 2);
    far.fillStyle(0x211913, 0.36);
    far.fillRect(-backgroundPad, -backgroundPad, width + backgroundPad * 2, height * 0.46 + backgroundPad);
    far.fillStyle(0x132019, 0.42);
    far.fillRect(-backgroundPad, height * 0.58, width + backgroundPad * 2, height * 0.56 + backgroundPad);

    const horizon = this.add.graphics().setDepth(-90).setScrollFactor(0.12);
    horizon.fillStyle(0x0b100e, 0.8);
    drawRidge(horizon, -160, width + 160, fieldTopY - 70, 38, 9);
    horizon.fillStyle(0x122018, 0.64);
    drawTreeline(horizon, -120, width + 120, fieldTopY - 24, 44, 12);

    const sideForest = this.add.graphics().setDepth(-70).setScrollFactor(0.34);
    drawSideForest(sideForest, this.layout);

    const sideProps = this.add.graphics().setDepth(-55).setScrollFactor(0.62);
    drawSideProps(sideProps, this.layout);
  }

  private refreshBackdropSize(): void {
    const image = this.viewportBackdrop;
    const { width, height } = this.scale;
    if (!image || this.destroyed || width <= 0 || height <= 0) return;
    const size = getBackdropCoverSize(width, height, image.width, image.height);
    image.setPosition(width / 2, height / 2).setDisplaySize(size.width, size.height);
  }

  private drawGroundTexture(field: Phaser.GameObjects.Graphics): void {
    const { fieldTopY, fieldBottomY } = this.layout;

    field.fillStyle(0x635c3e, 0.14);
    for (let index = 0; index < 34; index += 1) {
      const y = Phaser.Math.Linear(fieldTopY + 38, fieldBottomY - 34, (index + 0.5) / 34);
      const left = getFieldLeftX(this.layout, y);
      const right = getFieldRightX(this.layout, y);
      const x = Phaser.Math.Linear(left + 16, right - 16, getPatternValue(index, 0.37));
      const width = Phaser.Math.Linear(2, 7, getPatternValue(index, 0.71));
      const height = Phaser.Math.Linear(1, 4, getPatternValue(index, 0.19));
      field.fillEllipse(x, y, width, height);
    }

    field.fillStyle(0x090d08, 0.16);
    for (let index = 0; index < 18; index += 1) {
      const y = Phaser.Math.Linear(fieldTopY + 72, fieldBottomY - 44, (index + 0.35) / 18);
      const left = getFieldLeftX(this.layout, y);
      const right = getFieldRightX(this.layout, y);
      const x = Phaser.Math.Linear(left + 22, right - 22, getPatternValue(index, 0.53));
      field.fillEllipse(x, y, 11, 4);
    }
  }

  private drawBoardStageOverlay(): void {
    const { width, height, fieldTopY, fieldBottomY, centerY } = this.layout;
    const topY = fieldTopY + BOARD_STAGE_TOP_OFFSET;
    const bottomY = fieldBottomY - BOARD_STAGE_BOTTOM_OFFSET;
    const stage = this.add.graphics().setDepth(-22);

    stage.fillStyle(0x030603, 0.18);
    stage.beginPath();
    stage.moveTo(-80, fieldTopY - 18);
    stage.lineTo(getFieldLeftX(this.layout, topY) - 18, topY);
    stage.lineTo(getFieldLeftX(this.layout, bottomY) - 34, bottomY);
    stage.lineTo(-80, height + 80);
    stage.closePath();
    stage.fillPath();

    stage.beginPath();
    stage.moveTo(width + 80, fieldTopY - 18);
    stage.lineTo(getFieldRightX(this.layout, topY) + 18, topY);
    stage.lineTo(getFieldRightX(this.layout, bottomY) + 34, bottomY);
    stage.lineTo(width + 80, height + 80);
    stage.closePath();
    stage.fillPath();

    drawBoardPlane(stage, this.layout, topY, bottomY, 0x0c140b, 0.2, 0, 0);
    drawBoardPlane(stage, this.layout, topY + 20, bottomY - 28, 0xe4c15e, 0.035, 9, 26);

    stage.lineStyle(1, 0xe4c15e, 0.08);
    drawPerspectiveLine(stage, getFieldLeftX(this.layout, topY) + 8, topY, getFieldLeftX(this.layout, bottomY) + 24, bottomY);
    drawPerspectiveLine(stage, getFieldRightX(this.layout, topY) - 8, topY, getFieldRightX(this.layout, bottomY) - 24, bottomY);

    stage.fillStyle(0xe4c15e, 0.035);
    stage.fillEllipse(width / 2, centerY + 12, width * 0.68, 120);
  }

  private createCastle(castle: BattleTimelineCastle): void {
    const x = this.layout.width / 2;
    const y = this.layout.castleY[castle.owner];
    const color = castle.owner === "player" ? 0x6fbf73 : 0xd87458;
    const darkColor = castle.owner === "player" ? 0x315f36 : 0x743322;
    const container = this.add.container(x, y);
    const hasDomCastleArt = USE_DOM_BATTLEFIELD_ENVIRONMENT;
    const useKeepAsset = !hasDomCastleArt && this.textures.exists(PLAYER_KEEP_TEXTURE_KEY);
    const useKeepLayout = hasDomCastleArt || useKeepAsset;
    let castleArt: Phaser.GameObjects.GameObject[] = [];
    if (!hasDomCastleArt) {
      castleArt = useKeepAsset ? this.createKeepAssetArt(castle.owner) : this.createProceduralCastleArt(color, darkColor);
    }
    const hpBarWidth = castle.owner === "enemy" ? ENEMY_CASTLE_HP_BAR_WIDTH : CASTLE_HP_BAR_WIDTH;
    const hpBarHeight = castle.owner === "enemy" ? 6 : 8;
    const hpBarY = castle.owner === "player"
      ? useKeepLayout
        ? PLAYER_CASTLE_HP_BAR_Y
        : PLAYER_PROCEDURAL_CASTLE_HP_BAR_Y
      : useKeepLayout
        ? 49
        : 43;
    const hpLabelY = castle.owner === "player"
      ? useKeepLayout
        ? PLAYER_CASTLE_HP_LABEL_Y
        : PLAYER_PROCEDURAL_CASTLE_HP_LABEL_Y
      : useKeepLayout
        ? 60
        : 57;
    const hpBack = this.add.rectangle(-hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight, 0x3b1f1b, 0.9).setOrigin(0, 0.5);
    const hpFill = this.add.rectangle(-hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight, color, 1).setOrigin(0, 0.5);
    const hpLabel = this.add
      .text(0, hpLabelY, `${castle.startHp}/${castle.maxHp}`, {
        color: "#f3f0dd",
        fontFamily: "Arial",
        fontSize: castle.owner === "enemy" ? "10px" : "11px",
        stroke: "#10130f",
        strokeThickness: useKeepLayout ? 3 : 0,
      })
      .setOrigin(0.5);

    container.add([...castleArt, hpBack, hpFill, hpLabel]);
    container.setDepth(castle.owner === "player" ? 30 : 5);

    this.castleViews.set(castle.owner, { castle, container, hpFill, hpLabel, hpBarWidth });
    this.updateCastleHp(castle.owner, castle.startHp);
  }

  private createKeepAssetArt(owner: Owner): Phaser.GameObjects.GameObject[] {
    const isPlayer = owner === "player";
    const displayWidth = isPlayer ? PLAYER_KEEP_DISPLAY_WIDTH : ENEMY_KEEP_DISPLAY_WIDTH;
    const displayHeight = displayWidth * KEEP_ASSET_HEIGHT_RATIO;
    const image = this.add.image(0, isPlayer ? PLAYER_KEEP_IMAGE_Y : -8, PLAYER_KEEP_TEXTURE_KEY).setDisplaySize(displayWidth, displayHeight);

    if (!isPlayer) {
      image.setTint(0xd88a68).setAlpha(0.86);
    }

    return [image];
  }

  private createProceduralCastleArt(color: number, darkColor: number): Phaser.GameObjects.GameObject[] {
    const body = this.add.rectangle(0, 0, 152, 52, darkColor, 1).setStrokeStyle(2, color, 0.78);
    const leftTower = this.add.rectangle(-61, -14, 25, 52, color, 0.78).setStrokeStyle(1, 0xf3f0dd, 0.24);
    const rightTower = this.add.rectangle(61, -14, 25, 52, color, 0.78).setStrokeStyle(1, 0xf3f0dd, 0.24);
    const gate = this.add.rectangle(0, 15, 36, 25, 0x10130f, 0.72).setStrokeStyle(1, 0xf3f0dd, 0.18);

    return [body, leftTower, rightTower, gate];
  }

  private createUnit(unit: BattleTimelineUnit): void {
    const position = this.getHomePosition(unit.owner, unit.slotIndex);
    const sideColor = unit.owner === "player" ? 0x9fe08e : 0xf09a73;
    const sideDarkColor = unit.owner === "player" ? 0x407b45 : 0x804433;
    const strokeColor = unit.upgradeLevel ? 0xe4c15e : sideColor;
    const container = this.add.container(position.x, position.y);
    const objects: Phaser.GameObjects.GameObject[] = [];
    const contactShadow = this.add.ellipse(0, 25, 48, 10, 0x000000, 0.58);
    const unitArt = this.createUnitArt(unit, sideColor, sideDarkColor, strokeColor);
    const upgradeBadge = unit.upgradeLevel
      ? this.add
          .text(21, -49, "★", {
            color: "#e4c15e",
            fontFamily: "Arial",
            fontSize: "13px",
            fontStyle: "bold",
            stroke: "#10130f",
            strokeThickness: 3,
          })
          .setOrigin(0.5)
      : undefined;
    const vitalsBack = this.add.rectangle(0, 36, 68, 19, 0x10150f, 0.9).setStrokeStyle(1, sideDarkColor, 0.95);
    const hpBack = this.add.rectangle(-UNIT_VITALS_WIDTH / 2, 30, UNIT_VITALS_WIDTH, UNIT_VITALS_BAR_HEIGHT, 0x3b1f1b, 1).setOrigin(0, 0.5);
    const hpFill = this.add.rectangle(-UNIT_VITALS_WIDTH / 2, 30, UNIT_VITALS_WIDTH, UNIT_VITALS_BAR_HEIGHT, sideColor, 1).setOrigin(0, 0.5);
    const hpLabel = this.add
      .text(0, 40, `${unit.startHp}/${unit.maxHp}`, {
        color: "#f3f0dd",
        fontFamily: "Arial",
        fontSize: "10px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const armorLabel = this.add
      .text(23, 40, "", {
        color: "#d8ecff",
        fontFamily: "Arial",
        fontSize: "9px",
        fontStyle: "bold",
        stroke: "#08131d",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setVisible(false);
    objects.push(contactShadow, ...unitArt.objects);
    if (upgradeBadge) {
      objects.push(upgradeBadge);
    }
    const vitals = this.add.container(0, 0).add([vitalsBack, hpBack, hpFill, hpLabel, armorLabel]);
    objects.push(vitals);
    container.add(objects);

    if (unit.summonedBy) {
      container.setAlpha(0);
      container.setVisible(false);
    }

    // Summons may act before their appearance effect ends, including older or fallback art.
    const protectAnimation = Boolean(unit.summonedBy || (unitArt.sprite && getGroundedUnitArtBounds(unit.cardId)));
    const view: UnitView = {
      unit,
      container,
      vitals,
      hpFill,
      hpLabel,
      armorLabel,
      armor: 0,
      sprite: unitArt.sprite,
      facing: getDefaultUnitFacing(unit.owner),
      poseState: new UnitPoseState(protectAnimation),
      motionState: protectAnimation ? new UnitMotionState() : undefined,
      currentFrame: unitArt.sprite ? getUnitFrame(getDefaultUnitFacing(unit.owner), "idle") : undefined,
    };
    this.unitViews.set(unit.unitId, view);
    this.updateUnitSpatialStyle(view, true);
    this.updateUnitHp(view, unit.startHp);
    this.updateUnitArmor(view, 0);
  }

  private createUnitArt(unit: BattleTimelineUnit, sideColor: number, sideDarkColor: number, strokeColor: number): UnitArtResult {
    const asset = getUnitAsset(unit.cardId);

    if (asset?.spriteSheet && this.textures.exists(asset.spriteSheet.key)) {
      const frame = getUnitFrame(getDefaultUnitFacing(unit.owner), "idle");
      const sprite = this.add
        .sprite(0, UNIT_SPRITE_SHEET_Y, asset.spriteSheet.key, frame)
        .setDisplaySize(UNIT_SPRITE_SHEET_DISPLAY_SIZE, UNIT_SPRITE_SHEET_DISPLAY_SIZE);

      return { objects: [sprite], sprite };
    }

    if (asset && this.textures.exists(asset.key)) {
      const sprite = this.add.image(0, -12, asset.key);
      const groundedArt = getGroundedUnitArtPlacement(
        unit.cardId,
        UNIT_SPRITE_DISPLAY_WIDTH,
        UNIT_SPRITE_DISPLAY_HEIGHT,
        BATTLE_UNIT_ART_GROUND_Y,
      );
      if (groundedArt) {
        sprite.setOrigin(0, 0).setPosition(groundedArt.x, groundedArt.y).setDisplaySize(groundedArt.width, groundedArt.height);
      } else {
        const displaySize = fitStaticUnitArtSize(
          sprite.width,
          sprite.height,
          UNIT_SPRITE_DISPLAY_WIDTH,
          UNIT_SPRITE_DISPLAY_HEIGHT,
        );
        sprite.setDisplaySize(displaySize.width, displaySize.height);
      }
      if (unit.owner === "enemy") {
        sprite.setTint(0xf0a27c);
      }

      return { objects: [sprite] };
    }

    const shade = this.add.rectangle(2, -1, 42, 50, 0x050805, 0.28);
    const body = this.add.rectangle(0, -4, 39, 48, sideDarkColor, 1).setStrokeStyle(unit.upgradeLevel ? 3 : 2, strokeColor, 0.94);
    const head = this.add.ellipse(0, -31, 25, 22, sideColor, 1).setStrokeStyle(1, 0xf3f0dd, 0.34);
    const initials = this.add
      .text(0, -32, createInitials(unit.name), {
        color: unit.owner === "player" ? "#071007" : "#fff3de",
        fontFamily: "Arial",
        fontSize: "12px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    return { objects: [shade, body, head, initials] };
  }

  private async playTimeline(timeline: BattleTimeline, activeBattle: ActiveBattlePlayback): Promise<void> {
    const { token: playToken } = activeBattle;
    if (this.destroyed || playToken !== this.playToken || this.activeBattle !== activeBattle) {
      return;
    }

    this.startBattleCamera();
    await this.delay(260);

    for (const event of timeline.events) {
      if (this.destroyed || playToken !== this.playToken || this.activeBattle !== activeBattle) {
        return;
      }

      if (event.type !== "teams_enter") {
        const targetElapsedMs = scaleBattleDuration(event.time * COMBAT_TICK_DURATION_MS);
        const waitMs = this.playbackClock.getDelayUntil(targetElapsedMs, this.time.now);
        if (waitMs > 0) {
          await this.delayRaw(waitMs);
        }
      }

      if (this.destroyed || playToken !== this.playToken || this.activeBattle !== activeBattle) {
        return;
      }

      if (isConcurrentCombatEvent(event)) {
        this.playCombatEventConcurrently(event, playToken);
        continue;
      }

      await this.waitForActiveCombatPresentation();
      await this.playEvent(event, playToken, activeBattle);

      if (event.type === "teams_enter") {
        this.playbackClock.start(this.time.now);
      }
    }
  }

  private playCombatEventConcurrently(event: BattleTimelineEvent, playToken: number): void {
    const task = this.playConcurrentCombatEvent(event, playToken).catch(() => undefined);

    this.activeCombatPresentation.add(task);
    void task.finally(() => this.activeCombatPresentation.delete(task));
  }

  private async playConcurrentCombatEvent(event: BattleTimelineEvent, playToken: number): Promise<void> {
    const signal = this.presentationAbortController.signal;
    if (event.type === "combat_step") {
      await this.playCombatStep(event.events, event.time, playToken);
      return;
    }

    if (event.type === "unit_block" || event.type === "unit_damage" || event.type === "unit_die" || event.type === "unit_buff") {
      await this.delayRaw(scaleBattleDuration(event.time > 0 ? 110 : 0));
    }

    if (!signal.aborted) await this.playEvent(event, playToken, undefined, { focusCamera: false });
  }

  private async waitForActiveCombatPresentation(): Promise<void> {
    const signal = this.presentationAbortController.signal;
    while (!signal.aborted && this.activeCombatPresentation.size > 0) {
      await Promise.allSettled([...this.activeCombatPresentation]);
    }
  }

  private async playEvent(
    event: BattleTimelineEvent,
    playToken: number,
    activeBattle?: ActiveBattlePlayback,
    options: { focusCamera?: boolean } = {},
  ): Promise<void> {
    if (this.destroyed || playToken !== this.playToken) {
      return;
    }

    const focusCamera = options.focusCamera ?? true;

    if (event.type === "combat_step") {
      await this.playCombatStep(event.events, event.time, playToken);
      return;
    }

    if (event.type === "teams_enter") {
      this.focusCameraOnPoint(this.layout.width / 2, this.layout.centerY + 12, 360, BATTLE_CAMERA_ZOOM);
      await Promise.all(
        [...this.unitViews.values()]
          .filter((view) => !view.unit.summonedBy)
          .map((view) => this.moveUnitTo(view, this.getClashPosition(view.unit.owner, view.unit.slotIndex), 520)),
      );
      return;
    }

    if (event.type === "unit_spawn") {
      await this.playCombatStepSpawn(event, focusCamera);
      return;
    }

    if (event.type === "unit_buff") {
      const view = this.unitViews.get(event.unitId);
      if (!view) {
        return;
      }

      if (event.shieldDelta) {
        this.updateUnitArmor(view, applyArmorDelta(view.armor, event.shieldDelta));
      }

      if (focusCamera) {
        this.focusCameraOnPoint(view.container.x, view.container.y, 170, BATTLE_CAMERA_CLOSE_ZOOM);
      }
      await this.pulse(view.container, event.shieldDelta ? 0x86a8ff : 0xe4c15e);
      if (!this.isCurrentUnit(view) || playToken !== this.playToken) return;
      this.emitBattleAbilityCallouts([event]);
      return;
    }

    if (event.type === "unit_attack") {
      await this.playUnitAttack(event.attackerId, event.targetId, focusCamera);
      return;
    }

    if (event.type === "unit_ability") {
      this.emitBattleAbilityCallouts([event]);
      return;
    }

    if (event.type === "unit_damage") {
      const view = this.unitViews.get(event.unitId);
      if (!view) {
        return;
      }

      if (event.shieldAbsorbed > 0) {
        this.updateUnitArmor(view, applyArmorDelta(view.armor, -event.shieldAbsorbed));
      }
      this.updateUnitHp(view, event.remainingHp);
      this.emitBattleAbilityCallouts([event]);
      this.emitUnitCombatFeedback([event]);
      await this.flash(view.container, event.amount > 0 ? 0xda6b58 : 0x86a8ff);
      return;
    }

    if (event.type === "unit_block") {
      await this.playUnitBlock(event.unitId, event.attackerId, focusCamera);
      return;
    }

    if (event.type === "unit_heal") {
      const view = this.unitViews.get(event.unitId);
      if (!view) {
        return;
      }

      const source = this.unitViews.get(event.sourceUnitId);
      if (source && getCardDefinition(source.unit.cardId).abilityId === "heal_only") {
        await this.playRangedUnitAttack(source, view, focusCamera, "heal");
        if (this.destroyed || playToken !== this.playToken || this.unitViews.get(event.unitId) !== view) return;
      }

      this.updateUnitHp(view, event.remainingHp);
      this.emitUnitCombatFeedback([event]);
      await this.flash(view.container, 0x79c77a);
      return;
    }

    if (event.type === "unit_die") {
      const view = this.unitViews.get(event.unitId);
      if (!view || !view.container.visible) {
        return;
      }

      this.updateUnitHp(view, 0);
      this.setUnitPose(view, "dead", view.facing);
      await this.tween({
        targets: view.container,
        alpha: 0.34,
        angle: view.sprite ? 0 : view.unit.owner === "player" ? -9 : 9,
        duration: 190,
        ease: "Sine.easeOut",
      });
      return;
    }

    if (event.type === "castle_assault") {
      await this.playCastleAssault(event, playToken, activeBattle);
      return;
    }

    if (event.type === "battle_finished") {
      this.focusCameraOnPoint(this.layout.width / 2, this.layout.centerY + 12, 220, 1.08);
      await this.delay(180);
      if (playToken === this.playToken && this.activeBattle === activeBattle) {
        this.playbackClock.stop();
        this.activeBattle = undefined;
        activeBattle?.completion.finish();
      }
    }
  }

  private async playCombatStep(events: readonly CombatStepEvent[], time: number, playToken: number): Promise<void> {
    if (this.destroyed || playToken !== this.playToken) {
      return;
    }

    const spawnEvents = events.filter((event) => event.type === "unit_spawn");
    const attackEvents = events.filter((event) => event.type === "unit_attack");
    const healEvents = events.filter((event) => event.type === "unit_heal");

    const spawnTask = Promise.all(spawnEvents.map((event) => this.playCombatStepSpawn(event)));
    const actionTask = Promise.all([
      ...attackEvents.map((event) => this.playUnitAttack(event.attackerId, event.targetId, false)),
      ...healEvents.map((event) => this.playCombatStepHealCast(event)),
    ]);
    const resultTask = this.playCombatStepResults(events, time, playToken);

    await Promise.all([spawnTask, actionTask, resultTask]);
  }

  private async playCombatStepSpawn(event: Extract<CombatStepEvent, { type: "unit_spawn" }>, focusCamera = false): Promise<void> {
    const view = this.unitViews.get(event.unitId);
    if (!view || !this.isCurrentUnit(view)) {
      return;
    }

    const clashPosition = this.getClashPosition(view.unit.owner, view.unit.slotIndex);
    const position = view.unit.summonedBy ? clashPosition : this.getHomePosition(view.unit.owner, view.unit.slotIndex);
    view.container.setPosition(position.x, position.y);
    this.updateUnitSpatialStyle(view, true);
    view.container.setAlpha(view.unit.summonedBy ? 1 : 0);
    view.container.setVisible(true);
    if (focusCamera) {
      this.focusCameraOnPoint(clashPosition.x, clashPosition.y, 180, BATTLE_CAMERA_ZOOM);
    }

    if (view.unit.summonedBy) {
      // The skeleton's first attack is already due next tick; never walk its body in from home.
      this.setUnitPose(view, "idle", getDefaultUnitFacing(view.unit.owner));
      this.emitBattleAbilityCallouts([event]);
      await this.playSummonAppearance(view);
      return;
    }

    const stopWalking = this.startUnitWalkCycle(view);
    try {
      await this.tweenUnitMotion(view, {
        targets: view.container,
        alpha: 1,
        x: clashPosition.x,
        y: clashPosition.y,
        duration: 360,
        ease: "Sine.easeOut",
        onUpdate: () => this.updateUnitSpatialStyle(view),
      });
    } finally {
      this.updateUnitSpatialStyle(view, true);
      stopWalking();
    }
    if (this.isCurrentUnit(view)) this.emitBattleAbilityCallouts([event]);
  }

  private async playSummonAppearance(view: UnitView): Promise<void> {
    const signal = this.presentationAbortController.signal;
    if (signal.aborted || this.destroyed) return;
    const scale = view.presentationScale ?? 1;
    const glow = this.acquireGlow(
      view.container.x, view.container.y + BATTLE_UNIT_ART_GROUND_Y * scale,
      58 * scale, 18 * scale, 0xa7e68e, 0.42,
    ).setDepth(view.container.depth - 1);

    await this.tween({ targets: glow, alpha: 0, scale: 1.4, duration: 140, ease: "Sine.easeOut" }, signal);
    if (!signal.aborted && !this.destroyed) this.releaseGlow(glow);
  }

  private async playCombatStepHealCast(event: Extract<CombatStepEvent, { type: "unit_heal" }>): Promise<void> {
    const view = this.unitViews.get(event.unitId);
    const source = this.unitViews.get(event.sourceUnitId);
    if (!view || !source || getCardDefinition(source.unit.cardId).abilityId !== "heal_only") {
      return;
    }

    await this.playRangedUnitAttack(source, view, false, "heal");
  }

  private async playCombatStepResults(events: readonly CombatStepEvent[], time: number, playToken: number): Promise<void> {
    const signal = this.presentationAbortController.signal;
    const resultEvents = events.filter((event) => event.type !== "unit_spawn" && event.type !== "unit_attack");
    if (resultEvents.length === 0) {
      return;
    }

    await this.delayRaw(scaleBattleDuration(time > 0 ? COMBAT_STEP_RESULT_DELAY_MS : 0));
    if (signal.aborted || this.destroyed || playToken !== this.playToken) {
      return;
    }

    const deathEvents = resultEvents.filter((event) => event.type === "unit_die");
    const visibleResultEvents = resultEvents.filter((event) => event.type !== "unit_die");
    const armorFeedbackTasks: Promise<void>[] = [];
    const healedViews = new Set<UnitView>();

    this.emitBattleAbilityCallouts(visibleResultEvents);

    visibleResultEvents.forEach((event) => {
      if (event.type === "unit_buff") {
        const view = this.unitViews.get(event.unitId);
        if (view && event.shieldDelta) {
          this.updateUnitArmor(view, applyArmorDelta(view.armor, event.shieldDelta));
          armorFeedbackTasks.push(this.flash(view.container, 0x86a8ff));
        }
        return;
      }

      if (event.type === "unit_damage") {
        const view = this.unitViews.get(event.unitId);
        if (view) {
          if (event.shieldAbsorbed > 0) {
            this.updateUnitArmor(view, applyArmorDelta(view.armor, -event.shieldAbsorbed));
          }
          this.updateUnitHp(view, event.remainingHp);
        }
        return;
      }

      if (event.type === "unit_heal") {
        const view = this.unitViews.get(event.unitId);
        if (view) {
          this.updateUnitHp(view, event.remainingHp);
          if (event.amount > 0) healedViews.add(view);
        }
      }
    });

    this.emitUnitCombatFeedback(visibleResultEvents);
    await Promise.all([
      ...armorFeedbackTasks,
      // A group heal shares one casting pose, but every recipient needs visible feedback.
      ...[...healedViews].map((view) => this.flash(view.container, 0x79c77a, 140)),
      ...deathEvents.map((event) => this.playCombatStepDeath(event)),
    ]);
  }

  private emitBattleAbilityCallouts(events: readonly CombatStepEvent[]): void {
    const timelineUnits = this.activeBattle?.timeline.units ?? [];
    const callouts = createBattleAbilityCalloutPlan(events, timelineUnits, 1);

    for (const callout of callouts) {
      const view = this.unitViews.get(callout.anchorUnitId) ?? this.unitViews.get(callout.unitId);
      if (!view) {
        continue;
      }

      const labelTemplate = this.abilityCalloutLabels[callout.source];
      const label = labelTemplate.replace("{amount}", String(callout.amount ?? ""));
      this.floatText(view.container.x, view.container.y - 76, label, getAbilityCalloutColor(callout), 0.8);
    }
  }

  private emitUnitCombatFeedback(events: readonly CombatStepEvent[]): void {
    const units = [...this.unitViews.values()].map((view) => view.unit);
    for (const feedback of createUnitCombatFeedback(events, units, this.blockLabel)) {
      const view = this.unitViews.get(feedback.unitId);
      if (!view || !this.isCurrentUnit(view)) continue;
      const color = feedback.tone === "damage" ? "#f4b097" : feedback.tone === "heal" ? "#b7efaa" : "#c1e2ff";
      this.floatText(view.container.x, view.container.y - 54, feedback.label, color, 0.9);
    }
  }

  private async playCombatStepDeath(event: Extract<CombatStepEvent, { type: "unit_die" }>): Promise<void> {
    const view = this.unitViews.get(event.unitId);
    if (!view || !view.container.visible) {
      return;
    }

    this.updateUnitHp(view, 0);
    this.updateUnitArmor(view, 0);
    this.setUnitPose(view, "dead", view.facing);
    await this.tween({
      targets: view.container,
      alpha: 0.34,
      angle: view.sprite ? 0 : view.unit.owner === "player" ? -9 : 9,
      duration: 190,
      ease: "Sine.easeOut",
    });
  }

  private getDraftCastles(playerCastleHp: number, enemyCastleHp: number): BattleTimelineCastle[] {
    return [
      {
        owner: "enemy",
        maxHp: CASTLE_MAX_HP,
        startHp: enemyCastleHp,
        finalHp: enemyCastleHp,
      },
      {
        owner: "player",
        maxHp: CASTLE_MAX_HP,
        startHp: playerCastleHp,
        finalHp: playerCastleHp,
      },
    ];
  }

  private async playUnitAttack(attackerId: string, targetId: string, focusCamera: boolean): Promise<void> {
    const attacker = this.unitViews.get(attackerId);
    const target = this.unitViews.get(targetId);
    if (!attacker || !target) {
      return;
    }

    // Authored range-2 throws/casts are visual choices, not changes to combat reach.
    if (getCardDefinition(attacker.unit.cardId).stats.range >= 3 || (attacker.sprite && hasGroundedProjectilePose(attacker.unit.cardId))) {
      await this.playRangedUnitAttack(attacker, target, focusCamera);
      return;
    }

    const start = { x: attacker.container.x, y: attacker.container.y };
    const strike = {
      x: start.x + (target.container.x - start.x) * 0.34,
      y: start.y + (target.container.y - start.y) * 0.34,
    };
    const attackFacing = getDefaultUnitFacing(attacker.unit.owner);
    this.setUnitPose(attacker, "attack", attackFacing);
    if (focusCamera) {
      this.focusCameraOnPoint(
        (attacker.container.x + target.container.x) / 2,
        (attacker.container.y + target.container.y) / 2,
        115,
        BATTLE_CAMERA_CLOSE_ZOOM,
      );
    }

    const strikeMotion = await this.tweenUnitMotion(attacker, {
      targets: attacker.container,
      x: strike.x,
      y: strike.y,
      duration: 115,
      ease: "Sine.easeOut",
      onUpdate: () => this.updateUnitSpatialStyle(attacker),
    });
    if (strikeMotion === "disposed" || attacker.motionState?.isDisposed()) return;
    this.updateUnitSpatialStyle(attacker, true);
    this.drawStrike(attacker.container.x, attacker.container.y, target.container.x, target.container.y);
    // A simultaneous lethal hit still lands, but the fallen body must not slide back home.
    if (strikeMotion === "dead") return;
    const returnMotion = await this.tweenUnitMotion(attacker, {
      targets: attacker.container,
      x: start.x,
      y: start.y,
      duration: 130,
      ease: "Sine.easeIn",
      onUpdate: () => this.updateUnitSpatialStyle(attacker),
    });
    if (returnMotion === "disposed" || attacker.motionState?.isDisposed()) return;
    this.updateUnitSpatialStyle(attacker, true);
    this.setUnitPose(attacker, "idle", attackFacing);
  }

  private async playUnitBlock(unitId: string, attackerId: string, focusCamera: boolean): Promise<void> {
    const defender = this.unitViews.get(unitId);
    if (!defender) {
      return;
    }

    const attacker = this.unitViews.get(attackerId);
    const startX = defender.container.x;
    const startY = defender.container.y;
    const attackFacing = getDefaultUnitFacing(defender.unit.owner);
    this.setUnitPose(defender, "attack", attackFacing);

    if (focusCamera) {
      this.focusCameraOnPoint(
        attacker ? (attacker.container.x + defender.container.x) / 2 : defender.container.x,
        attacker ? (attacker.container.y + defender.container.y) / 2 : defender.container.y,
        115,
        BATTLE_CAMERA_CLOSE_ZOOM,
      );
    }

    const blockMotion = await this.tweenUnitMotion(defender, {
      targets: defender.container,
      x: startX + (defender.unit.owner === "player" ? 4 : -4),
      y: startY + (defender.unit.owner === "player" ? 4 : -4),
      duration: 85,
      yoyo: true,
      ease: "Sine.easeOut",
      onUpdate: () => this.updateUnitSpatialStyle(defender),
    });
    if (blockMotion === "disposed" || defender.motionState?.isDisposed()) return;
    this.updateUnitSpatialStyle(defender, true);

    this.floatText(defender.container.x, defender.container.y - 54, this.blockLabel, "#86a8ff");
    await this.flash(defender.container, 0x86a8ff);
    this.setUnitPose(defender, "idle", attackFacing);
  }

  private async playRangedUnitAttack(
    attacker: UnitView,
    target: UnitView,
    focusCamera: boolean,
    intent: "attack" | "heal" = "attack",
  ): Promise<void> {
    const castSignal = this.presentationAbortController.signal;
    if (this.destroyed || castSignal.aborted || attacker.motionState?.isDisposed()) return;
    const attackFacing = getDefaultUnitFacing(attacker.unit.owner);
    this.setUnitPose(attacker, "attack", attackFacing);
    if (focusCamera) {
      this.focusCameraOnPoint(
        (attacker.container.x + target.container.x) / 2,
        (attacker.container.y + target.container.y) / 2,
        115,
        BATTLE_CAMERA_CLOSE_ZOOM,
      );
    }

    const groundedTiming = getGroundedRangedAttackTiming(attacker.unit.cardId, Boolean(attacker.sprite));
    if (groundedTiming) {
      // The authored cast/shot pose already moves the body; keep its feet on the contact shadow.
      await this.delayCast(groundedTiming.windupMs, castSignal);
      if (castSignal.aborted || this.destroyed) return;
      if (intent === "attack") this.drawStrike(attacker.container.x, attacker.container.y, target.container.x, target.container.y);
      await this.delayCast(groundedTiming.recoveryMs, castSignal);
    } else if (attacker.sprite) {
      const startY = attacker.sprite.y;
      await this.tween({
        targets: attacker.sprite,
        y: startY - 5,
        duration: 90,
        ease: "Sine.easeOut",
      });
      if (castSignal.aborted || this.destroyed) return;
      if (intent === "attack") this.drawStrike(attacker.container.x, attacker.container.y, target.container.x, target.container.y);
      await this.tween({
        targets: attacker.sprite,
        y: startY + 2,
        duration: 70,
        ease: "Sine.easeIn",
      });
      if (castSignal.aborted || this.destroyed) return;
      await this.tween({
        targets: attacker.sprite,
        y: startY,
        duration: 55,
        ease: "Sine.easeOut",
      });
    } else {
      const startY = attacker.container.y;
      await this.tween({
        targets: attacker.container,
        y: startY - 4,
        duration: 90,
        ease: "Sine.easeOut",
        onUpdate: () => this.updateUnitSpatialStyle(attacker),
      });
      if (castSignal.aborted || this.destroyed) return;
      this.updateUnitSpatialStyle(attacker, true);
      if (intent === "attack") this.drawStrike(attacker.container.x, attacker.container.y, target.container.x, target.container.y);
      await this.tween({
        targets: attacker.container,
        y: startY,
        duration: 90,
        ease: "Sine.easeIn",
        onUpdate: () => this.updateUnitSpatialStyle(attacker),
      });
      if (castSignal.aborted || this.destroyed) return;
      this.updateUnitSpatialStyle(attacker, true);
    }

    if (castSignal.aborted || this.destroyed) return;
    this.setUnitPose(attacker, "idle", attackFacing);
  }

  private async playCastleAssault(
    event: Extract<BattleTimelineEvent, { type: "castle_assault" }>,
    playToken: number,
    activeBattle?: ActiveBattlePlayback,
  ): Promise<void> {
    const castle = this.castleViews.get(event.owner);
    if (!castle) {
      return;
    }

    const attackers = event.attackerIds
      .map((unitId) => this.unitViews.get(unitId))
      .filter((view): view is UnitView => Boolean(view?.container.visible));

    this.focusCameraForCastleApproach(event.owner, CASTLE_ASSAULT_APPROACH_MS);
    await Promise.all(
      attackers.map((view) =>
        this.moveUnitTo(
          view,
          this.getCastleApproachPosition(event.owner, view.unit.slotIndex),
          CASTLE_ASSAULT_APPROACH_MS,
        ),
      ),
    );

    if (!this.isCurrentBattle(playToken, activeBattle)) {
      return;
    }

    const attackerById = new Map(attackers.map((view) => [view.unit.unitId, view]));
    await Promise.all(
      createCastleAssaultPlan(event.attackerIds, event.damage, event.remainingHp).map(async (hit) => {
        const { attackerId, delayMs, remainingHpAfterHit } = hit;
        const attacker = attackerById.get(attackerId);
        await this.delay(delayMs);
        if (!this.isCurrentBattle(playToken, activeBattle)) return;

        const attackFacing = event.owner === "enemy" ? "north" : "south";
        const startY = attacker?.container.y;
        if (attacker && startY !== undefined) {
          this.setUnitPose(attacker, "attack", attackFacing);
          const lungeMotion = await this.tweenUnitMotion(attacker, {
            targets: attacker.container,
            y: startY + (event.owner === "player" ? 18 : -18),
            duration: CASTLE_ASSAULT_LUNGE_MS,
            ease: "Sine.easeOut",
            onUpdate: () => this.updateUnitSpatialStyle(attacker),
          });
          if (lungeMotion === "disposed" || attacker.motionState?.isDisposed()) return;
          this.updateUnitSpatialStyle(attacker, true);
        } else {
          await this.delay(CASTLE_ASSAULT_LUNGE_MS);
        }

        if (!this.isCurrentBattle(playToken, activeBattle)) {
          return;
        }

        if (remainingHpAfterHit !== undefined) {
          this.updateCastleHp(event.owner, remainingHpAfterHit);
          activeBattle?.completion.emitCastleHp(event.owner, remainingHpAfterHit);
        }
        if (!this.isCurrentBattle(playToken, activeBattle)) return;

        if (attacker && startY !== undefined) {
          const returnMotion = await this.tweenUnitMotion(attacker, {
            targets: attacker.container,
            y: startY,
            duration: CASTLE_ASSAULT_LUNGE_MS,
            ease: "Sine.easeIn",
            onUpdate: () => this.updateUnitSpatialStyle(attacker),
          });
          if (returnMotion === "disposed" || attacker.motionState?.isDisposed()) return;
          this.updateUnitSpatialStyle(attacker, true);
          this.setUnitPose(attacker, "idle", attackFacing);
        } else {
          await this.delay(CASTLE_ASSAULT_LUNGE_MS);
        }
      }),
    );

    if (!this.isCurrentBattle(playToken, activeBattle)) {
      return;
    }

    this.floatText(
      castle.container.x,
      castle.container.y + (event.owner === "player" ? -72 : 82),
      `-${event.damage}`,
      "#da6b58",
      1.35,
    );
    await Promise.all([
      this.flash(castle.container, 0xda6b58, CASTLE_ASSAULT_FLASH_MS),
      ...attackers.map((view) => this.playUnitSacrifice(view, CASTLE_ASSAULT_FADE_MS)),
    ]);
  }

  private isCurrentBattle(playToken: number, activeBattle?: ActiveBattlePlayback): boolean {
    return (
      !this.destroyed &&
      playToken === this.playToken &&
      (!activeBattle || (this.activeBattle === activeBattle && activeBattle.completion.isActive()))
    );
  }

  private async playUnitSacrifice(view: UnitView, duration: number): Promise<void> {
    if (!this.isCurrentUnit(view) || !view.container.visible) {
      return;
    }

    this.updateUnitHp(view, 0);
    this.updateUnitArmor(view, 0);
    this.setUnitPose(view, "dead", view.facing);
    await this.tween({
      targets: view.container,
      alpha: 0,
      // Shrink relative to perspective, keeping the contact point on the ground.
      scaleX: view.container.scaleX * 0.76,
      scaleY: view.container.scaleY * 0.76,
      y: view.container.y + BATTLE_UNIT_ART_GROUND_Y * view.container.scaleY * 0.24,
      duration,
      ease: "Sine.easeIn",
    });
    if (this.isCurrentUnit(view)) view.container.setVisible(false);
  }

  private drawStrike(startX: number, startY: number, endX: number, endY: number): void {
    const signal = this.presentationAbortController.signal;
    if (signal.aborted || this.destroyed) return;
    const effect = this.acquireStrikeEffect();
    const { shadow, strike } = effect;

    shadow.setTo(startX + 2, startY + 4, endX + 2, endY + 4);
    strike.setTo(startX, startY, endX, endY);

    shadow.setDepth(899);
    strike.setDepth(900);
    this.tweens.add({
      targets: [shadow, strike],
      alpha: 0,
      scaleX: 1.18,
      duration: scaleBattleDuration(140),
      onComplete: () => { if (!signal.aborted && !this.destroyed) this.releaseStrikeEffect(effect); },
    });
  }

  private acquireStrikeEffect(): StrikeEffect {
    const effect = this.strikePool.pop() ?? this.createStrikeEffect();
    const objects = [effect.shadow, effect.strike];

    this.tweens.killTweensOf(objects);
    objects.forEach((object) => {
      object.setActive(true).setVisible(true).setAlpha(1).setScale(1);
    });

    return effect;
  }

  private createStrikeEffect(): StrikeEffect {
    const effect = {
      shadow: this.add.line(0, 0, 0, 0, 0, 0, 0x090604, 0.58).setOrigin(0).setActive(false).setVisible(false),
      strike: this.add.line(0, 0, 0, 0, 0, 0, 0xf3f0dd, 0.88).setOrigin(0).setActive(false).setVisible(false),
    };

    [effect.shadow, effect.strike].forEach((object) => this.addToPresentationLayer(object));

    return effect;
  }

  private releaseStrikeEffect(effect: StrikeEffect): void {
    [effect.shadow, effect.strike].forEach((object) => {
      object.setActive(false).setVisible(false).setAlpha(1).setScale(1);
    });
    this.strikePool.push(effect);
  }

  private renderFinalBattlePresentation(timeline: BattleTimeline, presentation: FinalBattlePresentation): void {
    this.layout = createFieldLayout(this.scale.width, this.scale.height);
    this.drawField();

    timeline.castles.forEach((castle) => {
      this.createCastle({ ...castle, startHp: presentation.castles[castle.owner] });
    });
    timeline.units.forEach((unit) => {
      const finalUnit = presentation.units.get(unit.unitId);
      if (!finalUnit) {
        return;
      }

      this.createUnit({ ...unit, startHp: finalUnit.hp });
      const view = this.unitViews.get(unit.unitId);
      if (!view) {
        return;
      }

      const clashPosition = this.getClashPosition(unit.owner, unit.slotIndex);
      view.container.setPosition(clashPosition.x, clashPosition.y).setAlpha(1).setAngle(0).setVisible(finalUnit.visible);
      this.updateUnitSpatialStyle(view, true);
      this.updateUnitHp(view, finalUnit.hp);
      this.setUnitPose(view, "idle", getDefaultUnitFacing(unit.owner));
    });

    this.wrapSceneInPresentationLayer();
    this.setPresentationCamera(this.layout.width / 2, this.layout.centerY + 12, 1.08);
  }

  private async moveUnitTo(view: UnitView, position: { x: number; y: number }, duration: number): Promise<void> {
    const stopWalking = this.startUnitWalkCycle(view);
    try {
      await this.tweenUnitMotion(view, {
        targets: view.container,
        x: position.x,
        y: position.y,
        duration,
        ease: "Sine.easeInOut",
        onUpdate: () => {
          this.updateUnitSpatialStyle(view);
        },
      });
    } finally {
      this.updateUnitSpatialStyle(view, true);
      stopWalking();
    }
  }

  private startUnitWalkCycle(view: UnitView): () => void {
    const facing = getDefaultUnitFacing(view.unit.owner);
    const signal = this.presentationAbortController.signal;

    this.setUnitPose(view, "walkA", facing);

    if (!view.sprite || this.destroyed) {
      return () => this.setUnitPose(view, "idle", facing);
    }

    let nextPose: UnitPose = "walkB";
    const timer = this.time.addEvent({
      delay: scaleBattleDuration(150),
      loop: true,
      callback: () => {
        if (signal.aborted || !this.isCurrentUnit(view)) return;
        this.setUnitPose(view, nextPose, facing);
        nextPose = nextPose === "walkA" ? "walkB" : "walkA";
      },
    });
    this.activeWalkTimers.add(timer);

    return () => {
      timer.remove(false);
      this.activeWalkTimers.delete(timer);
      if (!signal.aborted) this.setUnitPose(view, "idle", facing);
    };
  }

  private isCurrentUnit(view: UnitView): boolean {
    return !this.destroyed && !this.presentationAbortController.signal.aborted
      && this.unitViews.get(view.unit.unitId) === view && !view.motionState?.isDisposed();
  }

  private setUnitPose(view: UnitView, pose: UnitPose, facing: UnitFacing = view.facing): void {
    if (!this.isCurrentUnit(view)) return;
    if (pose === "dead") view.motionState?.die();
    if (!view.poseState.accept(pose)) {
      return;
    }
    view.facing = facing;

    if (!view.sprite) {
      return;
    }

    const frame = getUnitFrame(facing, pose);

    if (view.currentFrame !== frame) {
      view.sprite.setFrame(frame);
      view.currentFrame = frame;
    }

    if (view.sprite.flipX) {
      view.sprite.setFlipX(false);
    }
  }

  private updateUnitSpatialStyle(view: UnitView, force = false): void {
    if (!this.isCurrentUnit(view)) return;
    const { container } = view;
    const nextDepthBucket = Math.round(container.y / UNIT_DEPTH_BUCKET_SIZE) * UNIT_DEPTH_BUCKET_SIZE;
    const nextScale = getUnitPresentationScale(this.layout, container.y, this.command.type);

    if (force || view.depthBucket !== nextDepthBucket) {
      container.setDepth(nextDepthBucket);
      view.depthBucket = nextDepthBucket;
    }

    if (force || view.presentationScale === undefined || Math.abs(view.presentationScale - nextScale) >= UNIT_SCALE_EPSILON) {
      container.setScale(nextScale);
      view.presentationScale = nextScale;
    }
  }

  private setDraftCamera(): void {
    this.setPresentationCamera(this.layout.width / 2, this.layout.height / 2, DRAFT_CAMERA_ZOOM);
  }

  private startBattleCamera(): void {
    this.setPresentationCamera(this.layout.width / 2, this.layout.height / 2, DRAFT_CAMERA_ZOOM);
    this.focusCameraOnPoint(this.layout.width / 2, this.layout.centerY + 14, 520, BATTLE_CAMERA_ZOOM);
  }

  private focusCameraForCastleApproach(owner: Owner, duration: number): void {
    const focusY = owner === "enemy" ? this.layout.centerY - 92 : this.layout.centerY + 92;
    const zoom = owner === "enemy" ? ENEMY_CASTLE_APPROACH_CAMERA_ZOOM : BATTLE_CASTLE_CAMERA_ZOOM;
    this.focusCameraOnPoint(this.layout.width / 2, focusY, duration, zoom);
  }

  private focusCameraOnPoint(x: number, y: number, duration: number, zoom: number): void {
    // Hold the complete formation during hits, blocks and buffs; only phase changes move the camera.
    if (zoom === BATTLE_CAMERA_CLOSE_ZOOM) return;
    const fittedFormation = zoom === BATTLE_CAMERA_ZOOM;
    if (fittedFormation) {
      const frame = getBattleCameraFrame(this.layout);
      x = frame.x;
      y = frame.y;
      zoom = frame.zoom;
    }
    // The fitted frame already owns safe margins; legacy point clamps displace it at zoom < 1.
    const focus = fittedFormation ? { x, y } : getCameraFocusPoint(this.layout, x, y, zoom);
    const target = getPresentationCameraLayerTransform(this.layout, focus.x, focus.y, zoom);
    const scaledDuration = scaleBattleDuration(duration);
    const layer = this.presentationLayer;

    if (!layer) {
      return;
    }

    this.resetPhaserCamera();
    this.tweens.killTweensOf(layer);
    this.tweens.add({
      targets: layer,
      x: target.x,
      y: target.y,
      scaleX: target.scale,
      scaleY: target.scale,
      duration: scaledDuration,
      ease: "Sine.easeInOut",
    });
  }

  private setPresentationCamera(focusX: number, focusY: number, zoom: number): void {
    const layer = this.presentationLayer;
    const target = getPresentationCameraLayerTransform(this.layout, focusX, focusY, zoom);

    this.resetPhaserCamera();
    layer?.setPosition(target.x, target.y).setScale(target.scale);
  }

  private updateUnitHp(view: UnitView, hp: number): void {
    if (!this.isCurrentUnit(view)) return;
    const vitals = getUnitVitals(hp, view.unit.maxHp, view.armor);
    const fillWidth = Math.max(1, UNIT_VITALS_WIDTH * vitals.ratio);
    const hpLabelText = vitals.hpLabel;
    view.vitals.setVisible(vitals.alive);
    view.hpFill.setVisible(vitals.alive);

    if (view.hpFillWidth === undefined || Math.abs(view.hpFillWidth - fillWidth) >= UNIT_HP_WIDTH_EPSILON) {
      view.hpFill.setDisplaySize(fillWidth, UNIT_VITALS_BAR_HEIGHT);
      view.hpFillWidth = fillWidth;
    }

    if (view.hpLabelText !== hpLabelText) {
      view.hpLabel.setText(hpLabelText);
      view.hpLabelText = hpLabelText;
    }
  }

  private updateUnitArmor(view: UnitView, armor: number): void {
    if (!this.isCurrentUnit(view)) return;
    const { armor: normalizedArmor, armorLabel: armorLabelText } = getUnitVitals(0, view.unit.maxHp, armor);
    view.armor = normalizedArmor;

    if (view.armorLabelText !== armorLabelText) {
      view.armorLabel.setText(armorLabelText).setVisible(normalizedArmor > 0);
      view.hpLabel.setX(normalizedArmor > 0 ? -10 : 0);
      view.armorLabelText = armorLabelText;
    }
  }

  private updateCastleHp(owner: Owner, hp: number): void {
    const view = this.castleViews.get(owner);
    if (!view) {
      return;
    }

    const ratio = view.castle.maxHp > 0 ? clamp(hp / view.castle.maxHp, 0, 1) : 0;
    const fillWidth = Math.max(1, view.hpBarWidth * ratio);
    const hpLabelText = `${Math.max(0, hp)}/${view.castle.maxHp}`;

    if (view.hpFillWidth === undefined || Math.abs(view.hpFillWidth - fillWidth) >= UNIT_HP_WIDTH_EPSILON) {
      view.hpFill.setDisplaySize(fillWidth, view.hpFill.displayHeight);
      view.hpFillWidth = fillWidth;
    }

    if (view.hpLabelText !== hpLabelText) {
      view.hpLabel.setText(hpLabelText);
      view.hpLabelText = hpLabelText;
    }
  }

  private floatText(x: number, y: number, label: string, color: string, scale = 1): void {
    const signal = this.presentationAbortController.signal;
    if (signal.aborted || this.destroyed) return;
    const text = this.acquireFloatText();

    text.setPosition(x, y).setText(label).setColor(color).setScale(scale).setDepth(980);

    this.tweens.add({
      targets: text,
      y: y - 14,
      alpha: 0,
      duration: scaleBattleDuration(380),
      ease: "Sine.easeOut",
      onComplete: () => { if (!signal.aborted && !this.destroyed) this.releaseFloatText(text); },
    });
  }

  private acquireFloatText(): Phaser.GameObjects.Text {
    const text = this.floatTextPool.pop() ?? this.createFloatText();

    this.tweens.killTweensOf(text);
    text.setActive(true).setVisible(true).setAlpha(1).setScale(1);

    return text;
  }

  private createFloatText(): Phaser.GameObjects.Text {
    return this.addToPresentationLayer(
      this.add
        .text(0, 0, "", {
          color: "#f3f0dd",
          fontFamily: "Arial",
          fontSize: "13px",
          fontStyle: "bold",
          stroke: "#10130f",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setActive(false)
        .setVisible(false),
    );
  }

  private releaseFloatText(text: Phaser.GameObjects.Text): void {
    text.setActive(false).setVisible(false).setAlpha(1).setText("");
    this.floatTextPool.push(text);
  }

  private async flash(target: Phaser.GameObjects.Container, color: number, duration = 180): Promise<void> {
    const signal = this.presentationAbortController.signal;
    if (signal.aborted || this.destroyed) return;
    const glow = this.acquireGlow(target.x, target.y - 8, 74, 74, color, 0.32).setDepth(target.depth + 1);

    await this.tween({
      targets: glow,
      alpha: 0,
      scale: 1.35,
      duration,
      ease: "Sine.easeOut",
    });

    if (!signal.aborted && !this.destroyed) this.releaseGlow(glow);
  }

  private async pulse(target: Phaser.GameObjects.Container, color: number): Promise<void> {
    const signal = this.presentationAbortController.signal;
    if (signal.aborted || this.destroyed) return;
    const glow = this.acquireGlow(target.x, target.y - 8, 68, 68, color, 0.22).setDepth(target.depth + 1);

    await this.tween({
      targets: glow,
      alpha: 0,
      scale: 1.25,
      duration: 140,
      ease: "Sine.easeOut",
    });

    if (!signal.aborted && !this.destroyed) this.releaseGlow(glow);
  }

  private acquireGlow(x: number, y: number, width: number, height: number, color: number, alpha: number): Phaser.GameObjects.Ellipse {
    const glow = this.glowPool.pop() ?? this.createGlow();

    this.tweens.killTweensOf(glow);
    glow
      .setPosition(x, y)
      .setSize(width, height)
      .setFillStyle(color, alpha)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1)
      .setScale(1);

    return glow;
  }

  private createGlow(): Phaser.GameObjects.Ellipse {
    return this.addToPresentationLayer(this.add.ellipse(0, 0, 1, 1, 0xffffff, 0).setActive(false).setVisible(false));
  }

  private releaseGlow(glow: Phaser.GameObjects.Ellipse): void {
    glow.setActive(false).setVisible(false).setAlpha(1).setScale(1);
    this.glowPool.push(glow);
  }

  private getHomePosition(owner: Owner, slotIndex: number): { x: number; y: number } {
    const row = getFieldSlotRow(slotIndex);
    const y = this.layout.homeRowsY[owner][row] ?? this.layout.homeRowsY[owner][0];

    return {
      x:
        owner === "player"
          ? getSlotLaneX(this.layout, getFieldSlotColumn(slotIndex), y)
          : getLaneX(this.layout, getFieldSlotColumn(slotIndex), y),
      y,
    };
  }

  private getClashPosition(owner: Owner, slotIndex: number): { x: number; y: number } {
    return getBattleFormationPosition(this.layout, owner, slotIndex);
  }

  private getCastleApproachPosition(owner: Owner, slotIndex: number): { x: number; y: number } {
    const row = getFieldSlotRow(slotIndex);
    // Keep both battlefield rows visible when the whole army arrives together.
    const y = this.layout.castleApproachY[owner] + row * (owner === "enemy" ? 22 : -22);

    return {
      x: getLaneX(this.layout, getFieldSlotColumn(slotIndex), y),
      y,
    };
  }

  private delay(durationMs: number): Promise<void> {
    return this.scheduleDelay(scaleBattleDuration(durationMs));
  }

  private delayRaw(durationMs: number): Promise<void> {
    return this.scheduleDelay(durationMs);
  }

  private delayCast(durationMs: number, signal: AbortSignal): Promise<void> {
    return this.scheduleDelay(scaleBattleDuration(durationMs), signal);
  }

  private scheduleDelay(durationMs: number, signal = this.presentationAbortController.signal): Promise<void> {
    if (durationMs <= 0 || signal.aborted || this.destroyed) return Promise.resolve();

    // Death preserves an already committed shot; scene replacement cancels and settles it.
    return new Promise((resolve) => {
      const finish = () => {
        this.activeDelayTimers.delete(timer);
        signal.removeEventListener("abort", cancel);
        resolve();
      };
      const cancel = () => {
        timer.remove(false);
        finish();
      };
      const timer = this.time.delayedCall(durationMs, finish);
      this.activeDelayTimers.add(timer);
      signal.addEventListener("abort", cancel, { once: true });
    });
  }

  private async tweenUnitMotion(view: UnitView, config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<UnitMotionResult> {
    const signal = this.presentationAbortController.signal;
    if (!this.isCurrentUnit(view)) return "disposed";
    if (!view.motionState) {
      await this.tween(config, signal);
      return signal.aborted || !this.isCurrentUnit(view) ? "disposed" : "completed";
    }
    if (this.destroyed) return "disposed";
    return view.motionState.run((complete) => {
      const tween = this.tweens.add({
        ...config,
        duration: typeof config.duration === "number" ? scaleBattleDuration(config.duration) : config.duration,
        onComplete: complete,
      });
      return () => tween.stop();
    });
  }

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig, signal = this.presentationAbortController.signal): Promise<void> {
    if (this.destroyed || signal?.aborted) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", cancel);
        resolve();
      };
      const cancel = () => {
        // Killing a Phaser tween alone does not complete the awaiting presentation task.
        finish();
        tween.stop();
      };
      const tween = this.tweens.add({
        ...config,
        duration: typeof config.duration === "number" ? scaleBattleDuration(config.duration) : config.duration,
        onComplete: finish,
      });
      if (!settled) {
        signal?.addEventListener("abort", cancel, { once: true });
        if (signal?.aborted) cancel();
      }
    });
  }
}

function scaleBattleDuration(durationMs: number): number {
  return Math.max(1, Math.round(durationMs * BATTLE_PRESENTATION_TIME_SCALE));
}

function getDefaultUnitFacing(owner: Owner): UnitFacing {
  return owner === "player" ? "north" : "south";
}

function getUnitFrame(facing: UnitFacing, pose: UnitPose): number {
  return getUnitFacingRow(facing) * UNIT_SPRITE_SHEET_COLUMNS + getUnitPoseColumn(pose);
}

function getUnitFacingRow(facing: UnitFacing): number {
  if (facing === "north") {
    return 1;
  }

  return 0;
}

function getUnitPoseColumn(pose: UnitPose): number {
  if (pose === "walkA") {
    return 1;
  }

  if (pose === "walkB") {
    return 2;
  }

  if (pose === "attack") {
    return 3;
  }

  if (pose === "dead") {
    return 4;
  }

  return 0;
}

function isConcurrentCombatEvent(event: BattleTimelineEvent): boolean {
  return (
    event.type === "combat_step" ||
    event.type === "unit_spawn" ||
    event.type === "unit_buff" ||
    event.type === "unit_attack" ||
    event.type === "unit_ability" ||
    event.type === "unit_block" ||
    event.type === "unit_damage" ||
    event.type === "unit_heal" ||
    event.type === "unit_die"
  );
}

function getAbilityCalloutColor(callout: BattleAbilityCallout): string {
  if (callout.tone === "poison") {
    return "#b7dc72";
  }
  if (callout.tone === "damage") {
    return "#f5a579";
  }
  if (callout.tone === "heal") {
    return "#a4dfba";
  }
  if (callout.tone === "armor") {
    return "#9fc4ff";
  }
  if (callout.tone === "debuff") {
    return "#b6a0ff";
  }
  if (callout.tone === "summon") {
    return "#a7e68e";
  }

  return "#f1d67a";
}

function getBackdropDisplaySize(layout: FieldLayout, overscanY: number): { width: number; height: number } {
  return {
    width: layout.width + overscanY * (layout.width / layout.height),
    height: layout.height + overscanY,
  };
}

function getCameraFocusPoint(layout: FieldLayout, x: number, y: number, zoom: number): { x: number; y: number } {
  const horizontalInset = layout.width * 0.12;
  const verticalInset = Math.max(82, 108 / zoom);

  return {
    x: clamp(x, horizontalInset, layout.width - horizontalInset),
    y: clamp(y, verticalInset, layout.height - verticalInset),
  };
}

function getPresentationCameraLayerTransform(
  layout: FieldLayout,
  focusX: number,
  focusY: number,
  zoom: number,
): { x: number; y: number; scale: number } {
  return {
    x: layout.width / 2 - focusX * zoom,
    y: layout.height / 2 - focusY * zoom,
    scale: zoom,
  };
}

function drawPerspectiveLine(
  graphics: Phaser.GameObjects.Graphics,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void {
  graphics.beginPath();
  graphics.moveTo(startX, startY);
  graphics.lineTo(endX, endY);
  graphics.strokePath();
}

function drawFieldBand(
  graphics: Phaser.GameObjects.Graphics,
  layout: FieldLayout,
  topY: number,
  bottomY: number,
  color: number,
  alpha: number,
): void {
  graphics.fillStyle(color, alpha);
  graphics.beginPath();
  graphics.moveTo(getFieldLeftX(layout, topY), topY);
  graphics.lineTo(getFieldRightX(layout, topY), topY);
  graphics.lineTo(getFieldRightX(layout, bottomY), bottomY);
  graphics.lineTo(getFieldLeftX(layout, bottomY), bottomY);
  graphics.closePath();
  graphics.fillPath();
}

function drawBoardPlane(
  graphics: Phaser.GameObjects.Graphics,
  layout: FieldLayout,
  topY: number,
  bottomY: number,
  color: number,
  alpha: number,
  topInset: number,
  bottomInset: number,
): void {
  graphics.fillStyle(color, alpha);
  graphics.beginPath();
  graphics.moveTo(getFieldLeftX(layout, topY) + topInset, topY);
  graphics.lineTo(getFieldRightX(layout, topY) - topInset, topY);
  graphics.lineTo(getFieldRightX(layout, bottomY) - bottomInset, bottomY);
  graphics.lineTo(getFieldLeftX(layout, bottomY) + bottomInset, bottomY);
  graphics.closePath();
  graphics.fillPath();
}

function drawRidge(
  graphics: Phaser.GameObjects.Graphics,
  startX: number,
  endX: number,
  baseY: number,
  height: number,
  peakCount: number,
): void {
  const step = (endX - startX) / peakCount;

  graphics.beginPath();
  graphics.moveTo(startX, baseY + height);
  graphics.lineTo(startX, baseY + height * 0.28);

  for (let index = 0; index <= peakCount; index += 1) {
    const x = startX + step * index;
    const peakHeight = Phaser.Math.Linear(height * 0.36, height, getPatternValue(index, 0.11));
    graphics.lineTo(x, baseY - peakHeight);
    graphics.lineTo(x + step * 0.48, baseY + height * 0.1);
  }

  graphics.lineTo(endX, baseY + height);
  graphics.closePath();
  graphics.fillPath();
}

function drawTreeline(
  graphics: Phaser.GameObjects.Graphics,
  startX: number,
  endX: number,
  baseY: number,
  treeHeight: number,
  treeCount: number,
): void {
  const step = (endX - startX) / treeCount;

  for (let index = 0; index <= treeCount; index += 1) {
    const x = startX + step * index + step * Phaser.Math.Linear(-0.18, 0.18, getPatternValue(index, 0.29));
    const height = Phaser.Math.Linear(treeHeight * 0.58, treeHeight, getPatternValue(index, 0.43));
    drawPine(graphics, x, baseY + height * 0.34, height);
  }
}

function drawSideForest(graphics: Phaser.GameObjects.Graphics, layout: FieldLayout): void {
  const treeCount = 18;

  for (let index = 0; index < treeCount; index += 1) {
    const ratio = index / (treeCount - 1);
    const y = Phaser.Math.Linear(layout.fieldTopY + 12, layout.fieldBottomY - 10, ratio);
    const depthRatio = getFieldRatio(layout, y);
    const treeSize = Phaser.Math.Linear(28, 72, depthRatio) * Phaser.Math.Linear(0.8, 1.18, getPatternValue(index, 0.61));
    const offset = Phaser.Math.Linear(28, 58, depthRatio);
    const jitter = Phaser.Math.Linear(-10, 10, getPatternValue(index, 0.73));
    const leftX = getFieldLeftX(layout, y) - offset - jitter;
    const rightX = getFieldRightX(layout, y) + offset + jitter;

    graphics.fillStyle(0x0b160f, Phaser.Math.Linear(0.36, 0.72, depthRatio));
    drawPine(graphics, leftX, y + treeSize * 0.28, treeSize);
    drawPine(graphics, rightX, y + treeSize * 0.28, treeSize);
  }
}

function drawSideProps(graphics: Phaser.GameObjects.Graphics, layout: FieldLayout): void {
  const propCount = 12;

  graphics.lineStyle(1, 0xe4c15e, 0.1);
  drawPerspectiveLine(graphics, getFieldLeftX(layout, layout.fieldTopY) - 8, layout.fieldTopY, getFieldLeftX(layout, layout.fieldBottomY) - 20, layout.fieldBottomY);
  drawPerspectiveLine(graphics, getFieldRightX(layout, layout.fieldTopY) + 8, layout.fieldTopY, getFieldRightX(layout, layout.fieldBottomY) + 20, layout.fieldBottomY);

  for (let index = 0; index < propCount; index += 1) {
    const ratio = (index + 0.35) / propCount;
    const y = Phaser.Math.Linear(layout.fieldTopY + 20, layout.fieldBottomY - 18, ratio);
    const depthRatio = getFieldRatio(layout, y);
    const rockSize = Phaser.Math.Linear(4, 12, depthRatio);
    const sideOffset = Phaser.Math.Linear(18, 42, depthRatio);
    const leftX = getFieldLeftX(layout, y) - sideOffset;
    const rightX = getFieldRightX(layout, y) + sideOffset;

    graphics.fillStyle(0x2e3329, 0.72);
    graphics.fillEllipse(leftX, y, rockSize * 1.4, rockSize * 0.72);
    graphics.fillEllipse(rightX, y + 3, rockSize * 1.4, rockSize * 0.72);

    if (index % 3 === 1) {
      graphics.fillStyle(0xe4a94f, 0.56);
      graphics.fillEllipse(leftX - 4, y - rockSize * 1.4, rockSize * 0.45, rockSize * 0.8);
      graphics.fillEllipse(rightX + 4, y - rockSize * 1.4, rockSize * 0.45, rockSize * 0.8);
    }
  }
}

function drawPine(graphics: Phaser.GameObjects.Graphics, x: number, y: number, height: number): void {
  const width = height * 0.46;

  graphics.fillTriangle(x, y - height, x - width * 0.52, y - height * 0.42, x + width * 0.52, y - height * 0.42);
  graphics.fillTriangle(x, y - height * 0.72, x - width * 0.72, y - height * 0.18, x + width * 0.72, y - height * 0.18);
  graphics.fillTriangle(x, y - height * 0.44, x - width, y + height * 0.12, x + width, y + height * 0.12);
  graphics.fillRect(x - width * 0.08, y - height * 0.02, width * 0.16, height * 0.22);
}

function getPatternValue(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;

  return value - Math.floor(value);
}

function createInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
