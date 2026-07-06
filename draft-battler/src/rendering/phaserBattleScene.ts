import Phaser from "phaser";
import {
  getCardDefinition,
  PLAYER_STARTING_HP,
  type BattleTimeline,
  type BattleTimelineCastle,
  type BattleTimelineEvent,
  type BattleTimelineUnit,
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
  getUnitPerspectiveScale,
  type FieldLayout,
} from "../fieldLayout";
import { getUnitAsset, getUnitAssets } from "../unitAssets";

const GAME_WIDTH = 390;
const GAME_HEIGHT = 720;
const UNIT_HP_BAR_WIDTH = 42;
const CASTLE_HP_BAR_WIDTH = 132;
const ENEMY_CASTLE_PREVIEW_HP = 16;
const PLAYER_CASTLE_MAX_HP = PLAYER_STARTING_HP;
const UNIT_PRESENTATION_SCALE = 0.86;
const UNIT_SPRITE_DISPLAY_WIDTH = 56;
const UNIT_SPRITE_DISPLAY_HEIGHT = 68;
const UNIT_SPRITE_SHEET_DISPLAY_SIZE = 96;
const UNIT_SPRITE_SHEET_SHADE_DISPLAY_SIZE = 101;
const UNIT_SPRITE_SHEET_Y = -16;
const UNIT_SPRITE_SHEET_SHADE_Y = -13;
const UNIT_SPRITE_SHEET_COLUMNS = 5;
const UNIT_DEPTH_BUCKET_SIZE = 8;
const UNIT_SCALE_EPSILON = 0.01;
const UNIT_HP_WIDTH_EPSILON = 0.25;
const BATTLE_PRESENTATION_TIME_SCALE = 2;
const COMBAT_TICK_DURATION_MS = 30;
const BATTLE_CAMERA_ZOOM = 1.18;
const BATTLE_CAMERA_CLOSE_ZOOM = 1.32;
const BATTLE_CASTLE_CAMERA_ZOOM = 1.28;
const ENEMY_CASTLE_APPROACH_CAMERA_ZOOM = 1.14;
const PLAYER_KEEP_TEXTURE_KEY = "environment:player-keep";
const PLAYER_KEEP_ASSET_URL = new URL("../assets/environment/player_keep/keep.webp", import.meta.url).href;
const PLAYER_KEEP_DISPLAY_WIDTH = 292;
const ENEMY_KEEP_DISPLAY_WIDTH = 112;
const ENEMY_CASTLE_HP_BAR_WIDTH = 106;
const KEEP_ASSET_HEIGHT_RATIO = 113 / 190;
const BATTLEFIELD_BASE_TEXTURE_KEY = "environment:battlefield:common-forest:base";
const BATTLEFIELD_BASE_ASSET_URL = new URL(
  "../assets/environment/battlefield/common_forest/battlefield_base.webp",
  import.meta.url,
).href;
const BATTLEFIELD_SIDE_PROPS_TEXTURE_KEY = "environment:battlefield:common-forest:side-props";
const BATTLEFIELD_SIDE_PROPS_ASSET_URL = new URL(
  "../assets/environment/battlefield/common_forest/side_props.webp",
  import.meta.url,
).href;
const BATTLEFIELD_LOW_POWER_OVERSCAN_Y = 36;
const BATTLEFIELD_BASE_OVERSCAN_Y = 120;
const BATTLEFIELD_SIDE_PROPS_OVERSCAN_Y = 54;
const BATTLEFIELD_SIDE_PROPS_ALPHA = 0.56;
const USE_DOM_BATTLEFIELD_ENVIRONMENT = true;
const ENABLE_BATTLEFIELD_SIDE_PROPS = false;
const SHOW_FIELD_DEBUG_GUIDES = false;
const BOARD_STAGE_TOP_OFFSET = 12;
const BOARD_STAGE_BOTTOM_OFFSET = 54;
const LOW_POWER_FPS_LIMIT = 30;
const DEFAULT_FPS_TARGET = 60;
const LOW_POWER_CPU_CORES = 4;
const LOW_POWER_DEVICE_MEMORY_GB = 4;
const COMPACT_TOUCH_VIEWPORT_WIDTH = 520;

export interface PlayBattleInput {
  timeline: BattleTimeline;
  onFinished?: () => void;
}

export interface ShowDraftInput {
  playerCastleHp: number;
}

type SceneCommand =
  | { type: "draft"; playerCastleHp: number }
  | { type: "battle"; timeline: BattleTimeline; onFinished?: () => void };

export interface BattlefieldController {
  showDraft: (input: ShowDraftInput) => void;
  playBattle: (input: PlayBattleInput) => void;
  destroy: () => void;
}

interface UnitView {
  unit: BattleTimelineUnit;
  container: Phaser.GameObjects.Container;
  hpFill: Phaser.GameObjects.Rectangle;
  hpLabel: Phaser.GameObjects.Text;
  sprite?: Phaser.GameObjects.Sprite;
  shadeSprite?: Phaser.GameObjects.Sprite;
  facing: UnitFacing;
  currentFrame?: number;
  depthBucket?: number;
  presentationScale?: number;
  hpFillWidth?: number;
  hpLabelText?: string;
}

type UnitFacing = "south" | "north";
type UnitPose = "idle" | "walkA" | "walkB" | "attack" | "dead";

interface UnitArtResult {
  objects: Phaser.GameObjects.GameObject[];
  sprite?: Phaser.GameObjects.Sprite;
  shadeSprite?: Phaser.GameObjects.Sprite;
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
  ember: Phaser.GameObjects.Line;
  impact: Phaser.GameObjects.Ellipse;
}

interface NavigatorPerformanceHints extends Navigator {
  connection?: {
    saveData?: boolean;
  };
  deviceMemory?: number;
}

interface RenderPerformanceProfile {
  fpsLimit: number;
  fpsTarget: number;
  lowPower: boolean;
}

function getRenderPerformanceProfile(): RenderPerformanceProfile {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { fpsLimit: 0, fpsTarget: DEFAULT_FPS_TARGET, lowPower: false };
  }

  const nav = navigator as NavigatorPerformanceHints;
  const minViewportSide = Math.min(window.innerWidth, window.innerHeight);
  const compactTouchViewport = navigator.maxTouchPoints > 0 && minViewportSide <= COMPACT_TOUCH_VIEWPORT_WIDTH;
  const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= LOW_POWER_CPU_CORES;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= LOW_POWER_DEVICE_MEMORY_GB;
  const saveData = nav.connection?.saveData === true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slowUpdate = window.matchMedia("(update: slow)").matches;
  const lowPower = compactTouchViewport || lowCpu || lowMemory || saveData || reducedMotion || slowUpdate;

  return {
    fpsLimit: lowPower ? LOW_POWER_FPS_LIMIT : 0,
    fpsTarget: lowPower ? LOW_POWER_FPS_LIMIT : DEFAULT_FPS_TARGET,
    lowPower,
  };
}

export function mountBattlefield(parent: HTMLElement): BattlefieldController {
  parent.replaceChildren();

  const renderProfile = getRenderPerformanceProfile();
  const scene = new CastleBattleScene(renderProfile);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0)",
    fps: {
      target: renderProfile.fpsTarget,
      limit: renderProfile.fpsLimit,
      min: 20,
      smoothStep: true,
    },
    render: {
      antialias: !renderProfile.lowPower,
      antialiasGL: !renderProfile.lowPower,
      desynchronized: renderProfile.lowPower,
      powerPreference: renderProfile.lowPower ? "low-power" : "high-performance",
      roundPixels: renderProfile.lowPower,
      transparent: true,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      autoRound: renderProfile.lowPower,
    },
    scene,
  });

  return {
    showDraft: (input) => scene.showDraft(input),
    playBattle: (input) => scene.playBattle(input),
    destroy: () => game.destroy(true),
  };
}

class CastleBattleScene extends Phaser.Scene {
  private readonly unitViews = new Map<string, UnitView>();
  private readonly castleViews = new Map<Owner, CastleView>();
  private readonly activeCombatPresentation = new Set<Promise<void>>();
  private readonly activeWalkTimers = new Set<Phaser.Time.TimerEvent>();
  private readonly strikePool: StrikeEffect[] = [];
  private readonly floatTextPool: Phaser.GameObjects.Text[] = [];
  private readonly glowPool: Phaser.GameObjects.Ellipse[] = [];
  private command: SceneCommand = { type: "draft", playerCastleHp: PLAYER_CASTLE_MAX_HP };
  private layout!: FieldLayout;
  private ready = false;
  private playToken = 0;
  private destroyed = false;

  constructor(private readonly renderProfile: RenderPerformanceProfile) {
    super("CastleBattleScene");
  }

  preload(): void {
    if (!USE_DOM_BATTLEFIELD_ENVIRONMENT) {
      this.load.image(PLAYER_KEEP_TEXTURE_KEY, PLAYER_KEEP_ASSET_URL);
    }
    if (!USE_DOM_BATTLEFIELD_ENVIRONMENT) {
      this.load.image(BATTLEFIELD_BASE_TEXTURE_KEY, BATTLEFIELD_BASE_ASSET_URL);
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroyed = true;
      this.ready = false;
    });

    this.applyCommand(this.command);
  }

  showDraft(input: ShowDraftInput): void {
    this.setCommand({ type: "draft", playerCastleHp: input.playerCastleHp });
  }

  playBattle(input: PlayBattleInput): void {
    this.setCommand({ type: "battle", timeline: input.timeline, onFinished: input.onFinished });
  }

  private setCommand(command: SceneCommand): void {
    this.command = command;

    if (!this.ready || this.destroyed) {
      return;
    }

    this.applyCommand(command);
  }

  private applyCommand(command: SceneCommand): void {
    this.playToken += 1;
    this.clearScene();
    this.layout = createFieldLayout(this.scale.width, this.scale.height);
    this.drawField(command.type);

    if (command.type === "draft") {
      this.getDraftCastles(command.playerCastleHp).forEach((castle) => this.createCastle(castle));
      this.setDraftCamera();
      return;
    }

    command.timeline.castles.forEach((castle) => this.createCastle(castle));
    command.timeline.units.forEach((unit) => this.createUnit(unit));
    void this.playTimeline(command.timeline, this.playToken, command.onFinished);
  }

  private clearScene(): void {
    this.tweens.killAll();
    this.activeWalkTimers.forEach((timer) => timer.remove(false));
    this.activeWalkTimers.clear();
    [...this.children.list].forEach((child) => child.destroy());
    this.unitViews.clear();
    this.castleViews.clear();
    this.activeCombatPresentation.clear();
    this.strikePool.length = 0;
    this.floatTextPool.length = 0;
    this.glowPool.length = 0;
  }

  private drawField(mode: SceneCommand["type"]): void {
    const { width, centerY, fieldTopY, fieldBottomY, laneFractions } = this.layout;
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

    if ((hasBattlefieldBase || hasDomEnvironment) && !this.renderProfile.lowPower) {
      this.drawFieldGuideRunes();

      if (mode === "battle") {
        this.drawBattleScreenAtmosphere();
      }
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

    this.add
      .text(width / 2, centerY - 88, "CLASH", {
        color: "#e4c15e",
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(-5)
      .setAlpha(0.82);

    if (!this.renderProfile.lowPower) {
      this.drawForegroundAtmosphere();
    }
  }

  private drawFieldGuideRunes(): void {
    const { centerY, fieldBottomY, width } = this.layout;
    const topY = this.layout.castleY.enemy + 54;
    const bottomY = fieldBottomY - 118;
    const clashY = centerY - 52;
    const topHalfWidth = 78;
    const guides = this.add.graphics().setDepth(-18).setScrollFactor(1);

    guides.lineStyle(1, 0xd8bf73, 0.16);
    drawPerspectiveLine(
      guides,
      width / 2 - topHalfWidth,
      topY,
      getFieldLeftX(this.layout, bottomY) + 30,
      bottomY,
    );
    drawPerspectiveLine(
      guides,
      width / 2 + topHalfWidth,
      topY,
      getFieldRightX(this.layout, bottomY) - 30,
      bottomY,
    );

    guides.lineStyle(1, 0xd8bf73, 0.06);
    drawPerspectiveLine(guides, width / 2, topY + 6, width / 2, bottomY - 4);

    guides.lineStyle(1, 0xe4c15e, 0.18);
    drawPerspectiveLine(
      guides,
      getFieldLeftX(this.layout, clashY) + 24,
      clashY,
      getFieldRightX(this.layout, clashY) - 24,
      clashY,
    );
    drawRuneDiamond(guides, width / 2, clashY, 9, 5);
  }

  private drawBattleScreenAtmosphere(): void {
    const { width, height } = this.layout;
    const atmosphere = this.add.graphics().setDepth(-16).setScrollFactor(0);
    const bandCount = 5;

    for (let index = 0; index < bandCount; index += 1) {
      const amount = index / (bandCount - 1);
      const alpha = Phaser.Math.Linear(0.18, 0.028, amount);
      atmosphere.fillStyle(0x050807, alpha);
      atmosphere.fillRect(0, index * 28, width, 30);
    }

    atmosphere.fillStyle(0x030503, 0.16);
    atmosphere.fillRect(0, height - 118, width, 118);

    for (let index = 0; index < 4; index += 1) {
      const stripWidth = 26 + index * 18;
      const alpha = Phaser.Math.Linear(0.15, 0.035, index / 3);
      atmosphere.fillStyle(0x010302, alpha);
      atmosphere.fillRect(0, 0, stripWidth, height);
      atmosphere.fillRect(width - stripWidth, 0, stripWidth, height);
    }

    atmosphere.fillStyle(0x010302, 0.08);
    atmosphere.fillRect(0, 0, width, height);
  }

  private drawParallaxBackdrop(): void {
    const { width, height, fieldTopY } = this.layout;
    const backgroundPad = 260;

    const hasBattlefieldBase = this.textures.exists(BATTLEFIELD_BASE_TEXTURE_KEY);
    const baseOverscanY = this.renderProfile.lowPower ? BATTLEFIELD_LOW_POWER_OVERSCAN_Y : BATTLEFIELD_BASE_OVERSCAN_Y;
    const baseSize = getBackdropDisplaySize(this.layout, baseOverscanY);
    const sidePropsSize = getBackdropDisplaySize(this.layout, BATTLEFIELD_SIDE_PROPS_OVERSCAN_Y);

    if (hasBattlefieldBase) {
      this.add
        .image(width / 2, height / 2, BATTLEFIELD_BASE_TEXTURE_KEY)
        .setDepth(-120)
        .setScrollFactor(1)
        .setDisplaySize(baseSize.width, baseSize.height);

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

  private drawForegroundAtmosphere(): void {
    const { width, height } = this.layout;
    const atmosphere = this.add.graphics().setDepth(2).setScrollFactor(0.18);

    atmosphere.fillStyle(0x071007, 0.28);
    atmosphere.fillRect(-160, -120, width + 320, 150);
    atmosphere.fillRect(-160, height - 48, width + 320, 168);
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
    const castlePlatform = hasDomCastleArt || this.renderProfile.lowPower ? [] : this.createCastlePlatform(castle.owner);

    const hpBarWidth = castle.owner === "enemy" ? ENEMY_CASTLE_HP_BAR_WIDTH : CASTLE_HP_BAR_WIDTH;
    const hpBarHeight = castle.owner === "enemy" ? 6 : 8;
    const hpBarY = useKeepLayout ? (castle.owner === "player" ? 58 : 49) : 43;
    const hpLabelY = useKeepLayout ? (castle.owner === "player" ? 70 : 60) : 57;
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

    container.add([...castlePlatform, ...castleArt, hpBack, hpFill, hpLabel]);
    container.setDepth(castle.owner === "player" ? 30 : 5);

    this.castleViews.set(castle.owner, { castle, container, hpFill, hpLabel, hpBarWidth });
    this.updateCastleHp(castle.owner, castle.startHp);
  }

  private createKeepAssetArt(owner: Owner): Phaser.GameObjects.GameObject[] {
    const isPlayer = owner === "player";
    const displayWidth = isPlayer ? PLAYER_KEEP_DISPLAY_WIDTH : ENEMY_KEEP_DISPLAY_WIDTH;
    const displayHeight = displayWidth * KEEP_ASSET_HEIGHT_RATIO;
    const image = this.add.image(0, isPlayer ? -7 : -8, PLAYER_KEEP_TEXTURE_KEY).setDisplaySize(displayWidth, displayHeight);

    if (!isPlayer) {
      image.setTint(0xd88a68).setAlpha(0.86);
    }

    if (this.renderProfile.lowPower) {
      return [image];
    }

    const glowColor = isPlayer ? 0x79c77a : 0xd87458;
    const glow = this.add.ellipse(0, isPlayer ? 58 : 34, displayWidth * 0.78, displayHeight * 0.24, glowColor, isPlayer ? 0.15 : 0.1);

    return [glow, image];
  }

  private createCastlePlatform(owner: Owner): Phaser.GameObjects.GameObject[] {
    const isPlayer = owner === "player";
    const color = isPlayer ? 0x79c77a : 0xd87458;

    if (!isPlayer) {
      return this.createEnemyCastlePlatform(color);
    }

    const y = 58;
    const width = 304;
    const height = 44;
    const shadow = this.add.ellipse(0, y + 4, width * 1.04, height, 0x020402, 0.34);
    const pad = this.add.ellipse(0, y, width, height, color, 0.16);
    const rim = this.add.ellipse(0, y - 1, width * 0.86, height * 0.58).setStrokeStyle(1, color, 0.22);

    return [shadow, pad, rim];
  }

  private createEnemyCastlePlatform(color: number): Phaser.GameObjects.GameObject[] {
    const platform = this.add.graphics();
    const topY = 28;
    const bottomY = 48;
    const topHalfWidth = 48;
    const bottomHalfWidth = 70;

    platform.fillStyle(0x020402, 0.24);
    drawLocalTrapezoid(
      platform,
      -bottomHalfWidth - 7,
      topY + 3,
      bottomHalfWidth + 7,
      topY + 3,
      bottomHalfWidth + 13,
      bottomY + 5,
      -bottomHalfWidth - 13,
      bottomY + 5,
    );
    platform.fillStyle(color, 0.09);
    drawLocalTrapezoid(
      platform,
      -topHalfWidth,
      topY,
      topHalfWidth,
      topY,
      bottomHalfWidth,
      bottomY,
      -bottomHalfWidth,
      bottomY,
    );
    platform.lineStyle(1, color, 0.18);
    strokeLocalTrapezoid(
      platform,
      -topHalfWidth,
      topY,
      topHalfWidth,
      topY,
      bottomHalfWidth,
      bottomY,
      -bottomHalfWidth,
      bottomY,
    );

    return [platform];
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
    const hpBack = this.add.rectangle(-UNIT_HP_BAR_WIDTH / 2, 31, UNIT_HP_BAR_WIDTH, 6, 0x3b1f1b, 0.92).setOrigin(0, 0.5);
    const hpFill = this.add.rectangle(-UNIT_HP_BAR_WIDTH / 2, 31, UNIT_HP_BAR_WIDTH, 6, 0x79c77a, 1).setOrigin(0, 0.5);
    const hpLabel = this.add
      .text(0, 41, `${unit.startHp}/${unit.maxHp}`, {
        color: "#f3f0dd",
        fontFamily: "Arial",
        fontSize: "10px",
      })
      .setOrigin(0.5);
    if (!this.renderProfile.lowPower) {
      objects.push(this.add.ellipse(0, 28, 76, 19, 0x000000, 0.34));
    }
    objects.push(contactShadow, ...unitArt.objects);
    if (upgradeBadge) {
      objects.push(upgradeBadge);
    }
    objects.push(hpBack, hpFill, hpLabel);
    container.add(objects);

    if (unit.summonedBy) {
      container.setAlpha(0);
      container.setVisible(false);
    }

    const view: UnitView = {
      unit,
      container,
      hpFill,
      hpLabel,
      sprite: unitArt.sprite,
      shadeSprite: unitArt.shadeSprite,
      facing: getDefaultUnitFacing(unit.owner),
      currentFrame: unitArt.sprite ? getUnitFrame(getDefaultUnitFacing(unit.owner), "idle") : undefined,
    };
    this.unitViews.set(unit.unitId, view);
    this.updateUnitSpatialStyle(view, true);
    this.updateUnitHp(view, unit.startHp);
  }

  private createUnitArt(
    unit: BattleTimelineUnit,
    sideColor: number,
    sideDarkColor: number,
    strokeColor: number,
  ): UnitArtResult {
    const asset = getUnitAsset(unit.cardId);

    if (asset?.spriteSheet && this.textures.exists(asset.spriteSheet.key)) {
      const frame = getUnitFrame(getDefaultUnitFacing(unit.owner), "idle");
      const sprite = this.add
        .sprite(0, UNIT_SPRITE_SHEET_Y, asset.spriteSheet.key, frame)
        .setDisplaySize(UNIT_SPRITE_SHEET_DISPLAY_SIZE, UNIT_SPRITE_SHEET_DISPLAY_SIZE);

      if (this.renderProfile.lowPower) {
        return { objects: [sprite], sprite };
      }

      const shade = this.add
        .sprite(2, UNIT_SPRITE_SHEET_SHADE_Y, asset.spriteSheet.key, frame)
        .setDisplaySize(UNIT_SPRITE_SHEET_SHADE_DISPLAY_SIZE, UNIT_SPRITE_SHEET_SHADE_DISPLAY_SIZE)
        .setTint(0x050805)
        .setAlpha(0.42);

      return { objects: [shade, sprite], sprite, shadeSprite: shade };
    }

    if (asset && this.textures.exists(asset.key)) {
      const sprite = this.add.image(0, -12, asset.key).setDisplaySize(UNIT_SPRITE_DISPLAY_WIDTH, UNIT_SPRITE_DISPLAY_HEIGHT);
      if (unit.owner === "enemy") {
        sprite.setTint(0xf0a27c);
      }

      if (this.renderProfile.lowPower) {
        return { objects: [sprite] };
      }

      const shade = this.add
        .image(2, -9, asset.key)
        .setDisplaySize(UNIT_SPRITE_DISPLAY_WIDTH + 5, UNIT_SPRITE_DISPLAY_HEIGHT + 5)
        .setTint(0x050805)
        .setAlpha(0.42);

      return { objects: [shade, sprite] };
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

  private async playTimeline(timeline: BattleTimeline, playToken: number, onFinished?: () => void): Promise<void> {
    this.startBattleCamera();
    await this.delay(260);
    let clockStartedAt: number | undefined;

    for (const event of timeline.events) {
      if (this.destroyed || playToken !== this.playToken) {
        return;
      }

      if (event.type !== "teams_enter") {
        clockStartedAt ??= this.time.now;
        const targetElapsedMs = scaleBattleDuration(event.time * COMBAT_TICK_DURATION_MS);
        const currentElapsedMs = this.time.now - clockStartedAt;
        const waitMs = Math.max(0, targetElapsedMs - currentElapsedMs);
        if (waitMs > 0) {
          await this.delayRaw(waitMs);
        }
      }

      if (isConcurrentCombatEvent(event)) {
        this.playCombatEventConcurrently(event, playToken);
        continue;
      }

      await this.waitForActiveCombatPresentation();
      await this.playEvent(event, playToken, onFinished);

      if (event.type === "teams_enter") {
        clockStartedAt = this.time.now;
      }
    }
  }

  private playCombatEventConcurrently(event: BattleTimelineEvent, playToken: number): void {
    const task = this.playConcurrentCombatEvent(event, playToken).catch(() => undefined);

    this.activeCombatPresentation.add(task);
    void task.finally(() => this.activeCombatPresentation.delete(task));
  }

  private async playConcurrentCombatEvent(event: BattleTimelineEvent, playToken: number): Promise<void> {
    if (event.type === "unit_block" || event.type === "unit_damage" || event.type === "unit_die" || event.type === "unit_buff") {
      await this.delayRaw(scaleBattleDuration(event.time > 0 ? 110 : 0));
    }

    await this.playEvent(event, playToken, undefined, { focusCamera: false });
  }

  private async waitForActiveCombatPresentation(): Promise<void> {
    while (this.activeCombatPresentation.size > 0) {
      await Promise.allSettled([...this.activeCombatPresentation]);
    }
  }

  private async playEvent(
    event: BattleTimelineEvent,
    playToken: number,
    onFinished?: () => void,
    options: { focusCamera?: boolean } = {},
  ): Promise<void> {
    if (this.destroyed || playToken !== this.playToken) {
      return;
    }

    const focusCamera = options.focusCamera ?? true;

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
      const view = this.unitViews.get(event.unitId);
      if (!view) {
        return;
      }

      const homePosition = this.getHomePosition(view.unit.owner, view.unit.slotIndex);
      view.container.setPosition(homePosition.x, homePosition.y);
      this.updateUnitSpatialStyle(view, true);
      view.container.setAlpha(0);
      view.container.setVisible(true);
      const clashPosition = this.getClashPosition(view.unit.owner, view.unit.slotIndex);
      if (focusCamera) {
        this.focusCameraOnPoint(clashPosition.x, clashPosition.y, 180, BATTLE_CAMERA_ZOOM);
      }
      const stopWalking = this.startUnitWalkCycle(view);
      try {
        await this.tween({
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
      return;
    }

    if (event.type === "unit_buff") {
      const view = this.unitViews.get(event.unitId);
      if (!view) {
        return;
      }

      if (focusCamera) {
        this.focusCameraOnPoint(view.container.x, view.container.y, 170, BATTLE_CAMERA_CLOSE_ZOOM);
      }
      await this.pulse(view.container, 0xe4c15e);
      return;
    }

    if (event.type === "unit_attack") {
      await this.playUnitAttack(event.attackerId, event.targetId, focusCamera);
      return;
    }

    if (event.type === "unit_damage") {
      const view = this.unitViews.get(event.unitId);
      if (!view) {
        return;
      }

      this.updateUnitHp(view, event.remainingHp);
      if (event.amount > 0) {
        this.cameras.main.shake(scaleBattleDuration(80), 0.004, true);
      }
      this.floatText(view.container.x, view.container.y - 54, event.amount > 0 ? `-${event.amount}` : "shield", "#da6b58");
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
        await this.playRangedUnitAttack(source, view, focusCamera);
      }

      this.updateUnitHp(view, event.remainingHp);
      this.floatText(view.container.x, view.container.y - 54, `+${event.amount}`, "#79c77a");
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

    if (event.type === "unit_move_to_castle") {
      const view = this.unitViews.get(event.unitId);
      if (!view || !view.container.visible) {
        return;
      }

      const castleApproach = this.getCastleApproachPosition(event.targetOwner, view.unit.slotIndex);
      this.focusCameraForCastleApproach(event.targetOwner, 320);
      await this.moveUnitTo(view, castleApproach, 420);
      return;
    }

    if (event.type === "castle_hit") {
      await this.playCastleHit(event.owner, event.attackerId, event.damage, event.remainingHp);
      return;
    }

    if (event.type === "unit_sacrifice") {
      await this.playUnitSacrifice(event.unitId);
      return;
    }

    if (event.type === "battle_finished") {
      this.focusCameraOnPoint(this.layout.width / 2, this.layout.centerY + 12, 220, 1.08);
      await this.delay(120);
      this.showResult(event.winner);
      await this.delay(420);
      if (playToken === this.playToken) {
        onFinished?.();
      }
    }
  }

  private getDraftCastles(playerCastleHp: number): BattleTimelineCastle[] {
    return [
      {
        owner: "enemy",
        maxHp: ENEMY_CASTLE_PREVIEW_HP,
        startHp: ENEMY_CASTLE_PREVIEW_HP,
        finalHp: ENEMY_CASTLE_PREVIEW_HP,
      },
      {
        owner: "player",
        maxHp: PLAYER_CASTLE_MAX_HP,
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

    if (getCardDefinition(attacker.unit.cardId).stats.range >= 3) {
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

    await this.tween({
      targets: attacker.container,
      x: strike.x,
      y: strike.y,
      duration: 115,
      ease: "Sine.easeOut",
      onUpdate: () => this.updateUnitSpatialStyle(attacker),
    });
    this.updateUnitSpatialStyle(attacker, true);
    this.drawStrike(attacker.container.x, attacker.container.y, target.container.x, target.container.y);
    await this.tween({
      targets: attacker.container,
      x: start.x,
      y: start.y,
      duration: 130,
      ease: "Sine.easeIn",
      onUpdate: () => this.updateUnitSpatialStyle(attacker),
    });
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

    await this.tween({
      targets: defender.container,
      x: startX + (defender.unit.owner === "player" ? 4 : -4),
      y: startY + (defender.unit.owner === "player" ? 4 : -4),
      duration: 85,
      yoyo: true,
      ease: "Sine.easeOut",
      onUpdate: () => this.updateUnitSpatialStyle(defender),
    });
    this.updateUnitSpatialStyle(defender, true);

    this.floatText(defender.container.x, defender.container.y - 54, "block", "#86a8ff");
    await this.flash(defender.container, 0x86a8ff);
    this.setUnitPose(defender, "idle", attackFacing);
  }

  private async playRangedUnitAttack(attacker: UnitView, target: UnitView, focusCamera: boolean): Promise<void> {
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

    if (attacker.sprite) {
      const startY = attacker.sprite.y;
      await this.tween({
        targets: attacker.sprite,
        y: startY - 5,
        duration: 90,
        ease: "Sine.easeOut",
      });
      this.drawStrike(attacker.container.x, attacker.container.y, target.container.x, target.container.y);
      await this.tween({
        targets: attacker.sprite,
        y: startY + 2,
        duration: 70,
        ease: "Sine.easeIn",
      });
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
      this.updateUnitSpatialStyle(attacker, true);
      this.drawStrike(attacker.container.x, attacker.container.y, target.container.x, target.container.y);
      await this.tween({
        targets: attacker.container,
        y: startY,
        duration: 90,
        ease: "Sine.easeIn",
        onUpdate: () => this.updateUnitSpatialStyle(attacker),
      });
      this.updateUnitSpatialStyle(attacker, true);
    }

    this.setUnitPose(attacker, "idle", attackFacing);
  }

  private async playCastleHit(owner: Owner, attackerId: string, damage: number, remainingHp: number): Promise<void> {
    const castle = this.castleViews.get(owner);
    const attacker = this.unitViews.get(attackerId);
    if (!castle || !attacker) {
      return;
    }

    this.focusCameraForCastleApproach(owner, 120);
    const startY = attacker.container.y;
    const attackFacing = owner === "enemy" ? "north" : "south";
    this.setUnitPose(attacker, "attack", attackFacing);
    await this.tween({
      targets: attacker.container,
      y: startY + (owner === "player" ? 18 : -18),
      duration: 105,
      yoyo: true,
      ease: "Sine.easeOut",
      onUpdate: () => this.updateUnitSpatialStyle(attacker),
    });
    this.updateUnitSpatialStyle(attacker, true);

    this.updateCastleHp(owner, remainingHp);
    this.cameras.main.shake(scaleBattleDuration(120), 0.006, true);
    this.floatText(castle.container.x, castle.container.y + (owner === "player" ? -72 : 82), `-${damage}`, "#da6b58");
    await this.flash(castle.container, 0xda6b58);
    this.setUnitPose(attacker, "idle", attackFacing);
  }

  private async playUnitSacrifice(unitId: string): Promise<void> {
    const view = this.unitViews.get(unitId);
    if (!view || !view.container.visible) {
      return;
    }

    this.updateUnitHp(view, 0);
    this.setUnitPose(view, "dead", view.facing);
    await this.tween({
      targets: view.container,
      alpha: 0,
      scale: 0.76,
      duration: 170,
      ease: "Sine.easeIn",
    });
    view.container.setVisible(false);
  }

  private drawStrike(startX: number, startY: number, endX: number, endY: number): void {
    const effect = this.acquireStrikeEffect();
    const { shadow, strike, ember, impact } = effect;

    shadow.setTo(startX + 2, startY + 4, endX + 2, endY + 4);
    strike.setTo(startX, startY, endX, endY);
    ember.setTo(startX, startY + 2, endX, endY + 2);
    impact.setPosition(endX, endY + 8);
    ember.setVisible(!this.renderProfile.lowPower);
    impact.setVisible(!this.renderProfile.lowPower);

    shadow.setDepth(899);
    strike.setDepth(900);
    ember.setDepth(901);
    impact.setDepth(898);
    this.tweens.add({
      targets: this.renderProfile.lowPower ? [shadow, strike] : [shadow, strike, ember, impact],
      alpha: 0,
      scaleX: 1.18,
      duration: scaleBattleDuration(140),
      onComplete: () => this.releaseStrikeEffect(effect),
    });
  }

  private acquireStrikeEffect(): StrikeEffect {
    const effect = this.strikePool.pop() ?? this.createStrikeEffect();
    const objects = [effect.shadow, effect.strike, effect.ember, effect.impact];

    this.tweens.killTweensOf(objects);
    objects.forEach((object) => {
      object.setActive(true).setVisible(true).setAlpha(1).setScale(1);
    });
    effect.impact.setBlendMode(Phaser.BlendModes.ADD);

    return effect;
  }

  private createStrikeEffect(): StrikeEffect {
    return {
      shadow: this.add.line(0, 0, 0, 0, 0, 0, 0x090604, 0.58).setOrigin(0).setActive(false).setVisible(false),
      strike: this.add.line(0, 0, 0, 0, 0, 0, 0xf3f0dd, 0.88).setOrigin(0).setActive(false).setVisible(false),
      ember: this.add.line(0, 0, 0, 0, 0, 0, 0xf08a5f, 0.52).setOrigin(0).setActive(false).setVisible(false),
      impact: this.add
        .ellipse(0, 0, 34, 12, 0xe4a94f, 0.18)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setActive(false)
        .setVisible(false),
    };
  }

  private releaseStrikeEffect(effect: StrikeEffect): void {
    [effect.shadow, effect.strike, effect.ember, effect.impact].forEach((object) => {
      object.setActive(false).setVisible(false).setAlpha(1).setScale(1);
    });
    this.strikePool.push(effect);
  }

  private showResult(winner: string): void {
    const label = winner === "player" ? "VICTORY" : winner === "enemy" ? "DEFEAT" : "DRAW";
    const color = winner === "player" ? "#79c77a" : winner === "enemy" ? "#da6b58" : "#e4c15e";
    const text = this.add
      .text(this.layout.width / 2, this.layout.centerY, label, {
        color,
        fontFamily: "Arial",
        fontSize: "34px",
        fontStyle: "bold",
        stroke: "#10130f",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(1000)
      .setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: scaleBattleDuration(180),
      ease: "Sine.easeOut",
    });
  }

  private async moveUnitTo(view: UnitView, position: { x: number; y: number }, duration: number): Promise<void> {
    const stopWalking = this.startUnitWalkCycle(view);
    try {
      await this.tween({
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

    this.setUnitPose(view, "walkA", facing);

    if (!view.sprite || this.destroyed) {
      return () => this.setUnitPose(view, "idle", facing);
    }

    let nextPose: UnitPose = "walkB";
    const timer = this.time.addEvent({
      delay: scaleBattleDuration(150),
      loop: true,
      callback: () => {
        this.setUnitPose(view, nextPose, facing);
        nextPose = nextPose === "walkA" ? "walkB" : "walkA";
      },
    });
    this.activeWalkTimers.add(timer);

    return () => {
      timer.remove(false);
      this.activeWalkTimers.delete(timer);
      this.setUnitPose(view, "idle", facing);
    };
  }

  private setUnitPose(view: UnitView, pose: UnitPose, facing: UnitFacing = view.facing): void {
    view.facing = facing;

    if (!view.sprite) {
      return;
    }

    const frame = getUnitFrame(facing, pose);

    if (view.currentFrame !== frame) {
      view.sprite.setFrame(frame);
      view.currentFrame = frame;

      if (view.shadeSprite) {
        view.shadeSprite.setFrame(frame);
      }
    }

    if (view.sprite.flipX) {
      view.sprite.setFlipX(false);
    }

    if (view.shadeSprite) {
      view.shadeSprite.setFlipX(false);
      if (view.shadeSprite.x !== 2) {
        view.shadeSprite.setX(2);
      }
    }
  }

  private updateUnitSpatialStyle(view: UnitView, force = false): void {
    const { container } = view;
    const nextDepthBucket = Math.round(container.y / UNIT_DEPTH_BUCKET_SIZE) * UNIT_DEPTH_BUCKET_SIZE;
    const nextScale = getUnitPerspectiveScale(this.layout, container.y) * UNIT_PRESENTATION_SCALE;

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
    const camera = this.cameras.main;
    camera.resetFX();
    camera.setZoom(DRAFT_CAMERA_ZOOM);
    camera.centerOn(this.layout.width / 2, this.layout.height / 2);
  }

  private startBattleCamera(): void {
    const camera = this.cameras.main;
    camera.resetFX();
    camera.setZoom(DRAFT_CAMERA_ZOOM);
    camera.centerOn(this.layout.width / 2, this.layout.height / 2);
    this.focusCameraOnPoint(this.layout.width / 2, this.layout.centerY + 14, 520, BATTLE_CAMERA_ZOOM);
  }

  private focusCameraForCastleApproach(owner: Owner, duration: number): void {
    const focusY = owner === "enemy" ? this.layout.centerY - 92 : this.layout.centerY + 92;
    const zoom = owner === "enemy" ? ENEMY_CASTLE_APPROACH_CAMERA_ZOOM : BATTLE_CASTLE_CAMERA_ZOOM;
    this.focusCameraOnPoint(this.layout.width / 2, focusY, duration, zoom);
  }

  private focusCameraOnPoint(x: number, y: number, duration: number, zoom: number): void {
    const camera = this.cameras.main;
    const focus = getCameraFocusPoint(this.layout, x, y, zoom);
    const scaledDuration = scaleBattleDuration(duration);
    camera.pan(focus.x, focus.y, scaledDuration, "Sine.easeInOut", true);
    camera.zoomTo(zoom, scaledDuration, "Sine.easeInOut", true);
  }

  private updateUnitHp(view: UnitView, hp: number): void {
    const ratio = view.unit.maxHp > 0 ? clamp(hp / view.unit.maxHp, 0, 1) : 0;
    const fillWidth = Math.max(1, UNIT_HP_BAR_WIDTH * ratio);
    const hpLabelText = `${Math.max(0, hp)}/${view.unit.maxHp}`;

    if (view.hpFillWidth === undefined || Math.abs(view.hpFillWidth - fillWidth) >= UNIT_HP_WIDTH_EPSILON) {
      view.hpFill.setDisplaySize(fillWidth, 6);
      view.hpFillWidth = fillWidth;
    }

    if (view.hpLabelText !== hpLabelText) {
      view.hpLabel.setText(hpLabelText);
      view.hpLabelText = hpLabelText;
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

  private floatText(x: number, y: number, label: string, color: string): void {
    const text = this.acquireFloatText();

    text.setPosition(x, y).setText(label).setColor(color).setDepth(980);

    this.tweens.add({
      targets: text,
      y: y - 22,
      alpha: 0,
      duration: scaleBattleDuration(520),
      ease: "Sine.easeOut",
      onComplete: () => this.releaseFloatText(text),
    });
  }

  private acquireFloatText(): Phaser.GameObjects.Text {
    const text = this.floatTextPool.pop() ?? this.createFloatText();

    this.tweens.killTweensOf(text);
    text.setActive(true).setVisible(true).setAlpha(1).setScale(1);

    return text;
  }

  private createFloatText(): Phaser.GameObjects.Text {
    return this.add
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
      .setVisible(false);
  }

  private releaseFloatText(text: Phaser.GameObjects.Text): void {
    text.setActive(false).setVisible(false).setAlpha(1).setText("");
    this.floatTextPool.push(text);
  }

  private async flash(target: Phaser.GameObjects.Container, color: number): Promise<void> {
    const glow = this.acquireGlow(target.x, target.y - 8, 74, 74, color, 0.32).setDepth(target.depth + 1);

    await this.tween({
      targets: glow,
      alpha: 0,
      scale: 1.35,
      duration: 180,
      ease: "Sine.easeOut",
    });

    this.releaseGlow(glow);
  }

  private async pulse(target: Phaser.GameObjects.Container, color: number): Promise<void> {
    const glow = this.acquireGlow(target.x, target.y - 8, 68, 68, color, 0.22).setDepth(target.depth + 1);

    await this.tween({
      targets: glow,
      alpha: 0,
      scale: 1.25,
      duration: 140,
      ease: "Sine.easeOut",
    });

    this.releaseGlow(glow);
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
    return this.add.ellipse(0, 0, 1, 1, 0xffffff, 0).setActive(false).setVisible(false);
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
    const row = getFieldSlotRow(slotIndex);
    const y = this.layout.clashRowsY[owner][row] ?? this.layout.clashRowsY[owner][0];

    return {
      x: getLaneX(this.layout, getFieldSlotColumn(slotIndex), y),
      y,
    };
  }

  private getCastleApproachPosition(owner: Owner, slotIndex: number): { x: number; y: number } {
    const y = this.layout.castleApproachY[owner];

    return {
      x: getLaneX(this.layout, getFieldSlotColumn(slotIndex), y),
      y,
    };
  }

  private delay(durationMs: number): Promise<void> {
    if (durationMs <= 0 || this.destroyed) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.time.delayedCall(scaleBattleDuration(durationMs), () => resolve());
    });
  }

  private delayRaw(durationMs: number): Promise<void> {
    if (durationMs <= 0 || this.destroyed) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.time.delayedCall(durationMs, () => resolve());
    });
  }

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    if (this.destroyed) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.tweens.add({
        ...config,
        duration: typeof config.duration === "number" ? scaleBattleDuration(config.duration) : config.duration,
        onComplete: () => resolve(),
      });
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
    event.type === "unit_spawn" ||
    event.type === "unit_buff" ||
    event.type === "unit_attack" ||
    event.type === "unit_block" ||
    event.type === "unit_damage" ||
    event.type === "unit_heal" ||
    event.type === "unit_die"
  );
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

function drawRuneDiamond(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number,
): void {
  graphics.beginPath();
  graphics.moveTo(x, y - halfHeight);
  graphics.lineTo(x + halfWidth, y);
  graphics.lineTo(x, y + halfHeight);
  graphics.lineTo(x - halfWidth, y);
  graphics.closePath();
  graphics.strokePath();
}

function drawLocalTrapezoid(
  graphics: Phaser.GameObjects.Graphics,
  topLeftX: number,
  topY: number,
  topRightX: number,
  rightY: number,
  bottomRightX: number,
  bottomY: number,
  bottomLeftX: number,
  leftY: number,
): void {
  graphics.beginPath();
  graphics.moveTo(topLeftX, topY);
  graphics.lineTo(topRightX, rightY);
  graphics.lineTo(bottomRightX, bottomY);
  graphics.lineTo(bottomLeftX, leftY);
  graphics.closePath();
  graphics.fillPath();
}

function strokeLocalTrapezoid(
  graphics: Phaser.GameObjects.Graphics,
  topLeftX: number,
  topY: number,
  topRightX: number,
  rightY: number,
  bottomRightX: number,
  bottomY: number,
  bottomLeftX: number,
  leftY: number,
): void {
  graphics.beginPath();
  graphics.moveTo(topLeftX, topY);
  graphics.lineTo(topRightX, rightY);
  graphics.lineTo(bottomRightX, bottomY);
  graphics.lineTo(bottomLeftX, leftY);
  graphics.closePath();
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
