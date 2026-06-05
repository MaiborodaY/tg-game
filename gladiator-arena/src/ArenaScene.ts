import Phaser from "phaser";
import { getActionWheelSlots } from "./actionWheelLayout";
import { getCameraTarget, getEnemyWorldX, getPlayerWorldX } from "./arenaCamera";
import {
  ARENA_WORLD_LEFT,
  ARENA_WORLD_WIDTH,
  FIGHTER_BASE_Y,
} from "./arenaLayout";
import {
  ARENA_BACKGROUND_ASSET_KEY,
  ARENA_BACKGROUND_ASSET_URL,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_AVATAR_DISPLAY_HEIGHT,
  PLAYER_AVATAR_FEET_Y_OFFSET,
  PLAYER_BODY_ASSET_KEY,
  PLAYER_BODY_ASSET_URL,
} from "./assets";
import { actions, canUseAction, MAX_HP, MAX_STAMINA, ROUND_LIMIT, START_DISTANCE, type ActionId, type CombatState, type FighterState } from "./combat";
import { debugTuning, subscribeDebugTuning } from "./debugTuning";

interface FighterVisual {
  avatar?: Phaser.GameObjects.Image;
  body: Phaser.GameObjects.Rectangle;
  head: Phaser.GameObjects.Arc;
  eyeLeft: Phaser.GameObjects.Arc;
  eyeRight: Phaser.GameObjects.Arc;
  helmet: Phaser.GameObjects.Rectangle;
  plume: Phaser.GameObjects.Rectangle;
  sword: Phaser.GameObjects.Rectangle;
  armFront: Phaser.GameObjects.Rectangle;
  armBack: Phaser.GameObjects.Rectangle;
  legFront: Phaser.GameObjects.Rectangle;
  legBack: Phaser.GameObjects.Rectangle;
  shadow: Phaser.GameObjects.Ellipse;
  name: Phaser.GameObjects.Text;
}

interface HudVisual {
  hpFill: Phaser.GameObjects.Rectangle;
  staminaFill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface ActionButtonVisual {
  actionId: ActionId;
  container: Phaser.GameObjects.Container;
  disc: Phaser.GameObjects.Arc;
  shine: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  caption: Phaser.GameObjects.Text;
}

interface ActionWheelVisual {
  buttons: Map<ActionId, ActionButtonVisual>;
}

interface ArenaVisuals {
  player: FighterVisual;
  enemy: FighterVisual;
  playerHud: HudVisual;
  enemyHud: HudVisual;
  roundText: Phaser.GameObjects.Text;
  actionWheel: ActionWheelVisual;
}

type ScalableGameObject = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

const VECTOR_FIGHTER_SCALE = 0.34;
const FIGHTER_MOVE_DURATION = 280;
const CAMERA_MOVE_DURATION = 340;
const ACTION_BUTTON_RADIUS = 30;
const ACTION_BUTTON_SIZE = ACTION_BUTTON_RADIUS * 2;
const ACTION_WHEEL_DEPTH = 60;

let readyCallback: ((scene: ArenaScene) => void) | undefined;
let actionCallback: ((actionId: ActionId) => void) | undefined;

export class ArenaScene extends Phaser.Scene {
  visuals?: ArenaVisuals;
  currentState?: CombatState;

  constructor() {
    super("ArenaScene");
  }

  preload(): void {
    this.load.image(ARENA_BACKGROUND_ASSET_KEY, ARENA_BACKGROUND_ASSET_URL);
    this.load.image(PLAYER_BODY_ASSET_KEY, PLAYER_BODY_ASSET_URL);
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
      showFloatingText(this, this.visuals.enemy.body.x, this.visuals.enemy.body.y - 124, `-${nextState.lastPlayerDamage}`, "#fff1bd");
      shakeFighter(this, this.visuals.enemy);
    }

    if (nextState.lastEnemyDamage > 0) {
      showFloatingText(this, this.visuals.player.body.x, this.visuals.player.body.y - 124, `-${nextState.lastEnemyDamage}`, "#fff1bd");
      shakeFighter(this, this.visuals.player);
    }
  }

  update(): void {
    if (this.visuals && this.currentState) {
      positionActionWheel(this, this.currentState);
    }
  }
}

export function launchArena(onReady: (scene: ArenaScene) => void, onAction: (actionId: ActionId) => void): void {
  readyCallback = onReady;
  actionCallback = onAction;

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

function buildVisuals(target: ArenaScene): ArenaVisuals {
  const player = createGladiator(target, getPlayerWorldX({ playerPosition: 0 }), FIGHTER_BASE_Y, 1, 0xcc412f, "BORSHEMIR", PLAYER_BODY_ASSET_KEY);
  const enemy = createGladiator(target, getEnemyWorldX({ enemyPosition: START_DISTANCE }), FIGHTER_BASE_Y, -1, 0x5d7f3e, "GRUMBUS");
  const playerHud = createHud(target, 30, 46, "BORSHEMIR");
  const enemyHud = createHud(target, 680, 46, "GRUMBUS");
  const actionWheel = createActionWheel(target);
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

  return { player, enemy, playerHud, enemyHud, roundText, actionWheel };
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

function createActionWheel(target: ArenaScene): ActionWheelVisual {
  const buttons = new Map<ActionId, ActionButtonVisual>();

  for (const actionId of ["forward", "back", "lunge", "light", "heavy", "taunt", "rest"] satisfies ActionId[]) {
    buttons.set(actionId, createActionButton(target, actionId));
  }

  return { buttons };
}

function createActionButton(target: ArenaScene, actionId: ActionId): ActionButtonVisual {
  const container = target.add.container(0, 0).setDepth(ACTION_WHEEL_DEPTH).setScrollFactor(0);
  const isRest = actionId === "rest";
  const isMove = actionId === "forward" || actionId === "back";
  const fill = isRest ? 0x248982 : isMove ? 0xd17a23 : 0xc62a24;
  const disc = target.add.circle(0, 0, ACTION_BUTTON_RADIUS, fill, 0.94).setStrokeStyle(3, 0x35180d);
  const shine = target.add.circle(-12, -13, 13, 0xfff4bf, 0.88);
  const label = target.add
    .text(0, actionId === "lunge" ? 8 : -4, getActionButtonLabel(actionId), {
      color: "#fff0bd",
      fontFamily: "Georgia",
      fontSize: actionId === "lunge" ? "12px" : "13px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 3,
    })
    .setOrigin(0.5);
  const caption = target.add
    .text(0, 15, actions[actionId].title, {
      color: "#fff0bd",
      fontFamily: "Georgia",
      fontSize: "8px",
      fontStyle: "900",
      stroke: "#35180d",
      strokeThickness: 2,
    })
    .setOrigin(0.5);

  container.add([disc, shine]);

  if (actionId === "lunge") {
    const blade = target.add.rectangle(3, -12, 5, 28, 0xfff6d5).setAngle(42).setStrokeStyle(1, 0x35180d);
    const guard = target.add.rectangle(-6, 3, 18, 4, 0x35180d).setAngle(42);
    const handle = target.add.rectangle(-11, 10, 5, 12, 0x8a3a18).setAngle(42).setStrokeStyle(1, 0x35180d);
    container.add([blade, guard, handle]);
  }

  container.add([label, caption]);
  container.setSize(ACTION_BUTTON_SIZE, ACTION_BUTTON_SIZE);
  container.setInteractive(new Phaser.Geom.Circle(0, 0, ACTION_BUTTON_RADIUS), Phaser.Geom.Circle.Contains);
  container.on("pointerdown", () => {
    const state = target.currentState;

    if (state && canUseAction(state, actionId, "player")) {
      actionCallback?.(actionId);
    }
  });

  container.setVisible(false);

  return { actionId, container, disc, shine, label, caption };
}

function getActionButtonLabel(actionId: ActionId): string {
  if (actionId === "forward") {
    return "FWD";
  }

  if (actionId === "back") {
    return "BACK";
  }

  if (actionId === "lunge") {
    return "LUNGE";
  }

  if (actionId === "light") {
    return "SLASH";
  }

  if (actionId === "heavy") {
    return "BONK";
  }

  if (actionId === "taunt") {
    return "TAUNT";
  }

  return "REST";
}

function updateActionWheel(target: ArenaScene, current: CombatState): void {
  if (!target.visuals) {
    return;
  }

  const slots = getActionWheelSlots(current.distance);
  const visibleIds = new Set(slots.map((slot) => slot.actionId));

  for (const [actionId, button] of target.visuals.actionWheel.buttons) {
    const visible = current.result === "playing" && visibleIds.has(actionId);
    const enabled = visible && canUseAction(current, actionId, "player");

    button.container.setVisible(visible);
    button.container.setAlpha(enabled ? 1 : 0.44);
    button.caption.setText(slots.find((slot) => slot.actionId === actionId)?.caption ?? actions[actionId].title);
  }

  positionActionWheel(target, current);
}

function positionActionWheel(target: ArenaScene, current: CombatState): void {
  if (!target.visuals) {
    return;
  }

  const slots = getActionWheelSlots(current.distance);
  const anchor = getPlayerScreenAnchor(target);

  for (const slot of slots) {
    const button = target.visuals.actionWheel.buttons.get(slot.actionId);

    if (!button) {
      continue;
    }

    button.container.setScale(debugTuning.actionWheelScale);
    button.container.setPosition(
      anchor.x + slot.offsetX + debugTuning.actionWheelOffsetX,
      anchor.y + slot.offsetY + debugTuning.actionWheelOffsetY,
    );
  }
}

function getPlayerScreenAnchor(target: ArenaScene): { x: number; y: number } {
  const player = target.visuals?.player;

  if (!player) {
    return { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
  }

  const camera = target.cameras.main;
  const x = (player.body.x - camera.scrollX) * camera.zoom;
  const y = (player.body.y - camera.scrollY) * camera.zoom;

  return {
    x: clampScreen(x, 100, GAME_WIDTH - 100),
    y: clampScreen(y - 58, 142, GAME_HEIGHT - 146),
  };
}

function clampScreen(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
function createGladiator(
  target: Phaser.Scene,
  x: number,
  y: number,
  facing: 1 | -1,
  color: number,
  label: string,
  bodyTextureKey?: string,
): FighterVisual {
  const shadow = target.add.ellipse(x, y + 132, 160, 28, 0x000000, 0.22);
  const legBack = target.add
    .rectangle(x - 32 * facing, y + 92, 34, 88, 0xd9854d)
    .setAngle(8 * facing)
    .setStrokeStyle(4, 0x35180d);
  const legFront = target.add
    .rectangle(x + 28 * facing, y + 92, 34, 88, 0xd9854d)
    .setAngle(-8 * facing)
    .setStrokeStyle(4, 0x35180d);
  const armBack = target.add
    .rectangle(x - 78 * facing, y + 20, 30, 94, 0xd9854d)
    .setAngle(24 * facing)
    .setStrokeStyle(4, 0x35180d);
  const body = target.add.rectangle(x, y + 28, 112, 124, color).setStrokeStyle(5, 0x35180d);
  const armFront = target.add
    .rectangle(x + 74 * facing, y + 20, 30, 96, 0xd9854d)
    .setAngle(-38 * facing)
    .setStrokeStyle(4, 0x35180d);
  const head = target.add.circle(x, y - 54, 42, 0xd9854d).setStrokeStyle(5, 0x35180d);
  const eyeLeft = target.add.circle(x - 14 * facing, y - 60, 4, 0x160703);
  const eyeRight = target.add.circle(x + 16 * facing, y - 60, 4, 0x160703);
  const helmet = target.add.rectangle(x, y - 98, 100, 38, 0xaeb7af).setStrokeStyle(5, 0x35180d);
  const plume = target.add.rectangle(x + 34 * facing, y - 140, 17, 82, 0xcc412f).setAngle(9 * facing);
  const sword = target.add
    .rectangle(x + 94 * facing, y + 5, 16, 112, 0xf5f4da)
    .setAngle(-28 * facing)
    .setStrokeStyle(4, 0x35180d);
  const name = target.add
    .text(x, y + 162, label, {
      color: "#35180d",
      fontFamily: "Georgia",
      fontSize: "19px",
      fontStyle: "900",
    })
    .setOrigin(0.5);
  name.setVisible(false);

  const vectorParts = [legBack, legFront, armBack, body, armFront, head, eyeLeft, eyeRight, helmet, plume, sword];
  const hasBodyAsset = bodyTextureKey ? target.textures.exists(bodyTextureKey) : false;
  const avatar = hasBodyAsset
    ? target.add
        .image(x, y + PLAYER_AVATAR_FEET_Y_OFFSET, bodyTextureKey)
        .setOrigin(0.5, 455 / 512)
    : undefined;

  if (avatar) {
    avatar.displayHeight = PLAYER_AVATAR_DISPLAY_HEIGHT;
    avatar.scaleX = avatar.scaleY;
    vectorParts.forEach((part) => part.setVisible(false));
  } else {
    scaleObjectsFromPivot([...vectorParts, shadow], x, y + PLAYER_AVATAR_FEET_Y_OFFSET, VECTOR_FIGHTER_SCALE);
  }

  target.tweens.add({
    targets: avatar ? [avatar] : [head, eyeLeft, eyeRight, helmet, body, armBack, armFront, sword, plume],
    y: "+=5",
    duration: 950,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  return {
    ...(avatar ? { avatar } : {}),
    body,
    head,
    eyeLeft,
    eyeRight,
    helmet,
    plume,
    sword,
    armFront,
    armBack,
    legFront,
    legBack,
    shadow,
    name,
  };
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
  updateActionWheel(target, current);
}

function setHud(hud: HudVisual, fighter: FighterState): void {
  hud.hpFill.displayWidth = 226 * (fighter.hp / MAX_HP);
  hud.staminaFill.displayWidth = 226 * (fighter.stamina / MAX_STAMINA);
  hud.label.setText(`HP ${fighter.hp}/${MAX_HP}  STA ${fighter.stamina}/${MAX_STAMINA}`);
}

function setFighterAlpha(fighter: FighterVisual, alpha: number): void {
  Object.values(fighter).forEach((part) => part.setAlpha(alpha));
}

function positionFightersForState(target: Phaser.Scene, visuals: ArenaVisuals, current: CombatState): void {
  setFighterX(target, visuals.player, getPlayerWorldX(current) + debugTuning.playerXOffset);
  setFighterX(target, visuals.enemy, getEnemyWorldX(current) + debugTuning.enemyXOffset);
  applyFighterTuning(visuals.player, "player");
  applyFighterTuning(visuals.enemy, "enemy");
}

function applyFighterTuning(fighter: FighterVisual, side: "player" | "enemy"): void {
  const scale = side === "player" ? debugTuning.playerScale : debugTuning.enemyScale;
  const scaleRatio = scale / fighter.debugScale;

  if (fighter.avatar) {
    fighter.avatar.displayHeight = PLAYER_AVATAR_DISPLAY_HEIGHT * scale;
    fighter.avatar.scaleX = fighter.avatar.scaleY;
  } else if (Math.abs(scaleRatio - 1) > 0.001) {
    scaleObjectsFromPivot(getScalableFighterParts(fighter), fighter.shadow.x, fighter.shadow.y, scaleRatio);
  }

  fighter.debugScale = scale;
  setFighterY(fighter, FIGHTER_BASE_Y + 28 + debugTuning.fighterYOffset);
}

function setFighterY(fighter: FighterVisual, nextBodyY: number): void {
  const delta = nextBodyY - fighter.body.y;

  if (Math.abs(delta) < 0.5) {
    return;
  }

  getFighterParts(fighter).forEach((part) => {
    part.y += delta;
  });
}

function getScalableFighterParts(fighter: FighterVisual): ScalableGameObject[] {
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
  ];
}
function updateCamera(target: Phaser.Scene, current: CombatState): void {
  const camera = target.cameras.main;
  const cameraTarget = getCameraTarget(current);

  target.tweens.killTweensOf(camera);
  target.tweens.add({
    targets: camera,
    scrollX: cameraTarget.scrollX,
    scrollY: cameraTarget.scrollY,
    zoom: cameraTarget.zoom,
    duration: CAMERA_MOVE_DURATION,
    ease: "Sine.easeInOut",
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

function getFighterParts(fighter: FighterVisual): Array<Phaser.GameObjects.GameObject & { x: number; y: number }> {
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
    ...(fighter.avatar ? [fighter.avatar] : []),
  ];
}

function scaleObjectsFromPivot(parts: ScalableGameObject[], pivotX: number, pivotY: number, scale: number): void {
  parts.forEach((part) => {
    part.x = pivotX + (part.x - pivotX) * scale;
    part.y = pivotY + (part.y - pivotY) * scale;
    part.scaleX *= scale;
    part.scaleY *= scale;
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
  const dx = actionId === "lunge" ? 42 : actionId === "heavy" ? 32 : actionId === "light" ? 24 : actionId === "taunt" ? -12 : 0;
  const y = actionId === "rest" ? "+=14" : 0;
  const parts = actor.avatar
    ? [actor.avatar, actor.name]
    : [
        actor.body,
        actor.head,
        actor.eyeLeft,
        actor.eyeRight,
        actor.helmet,
        actor.sword,
        actor.armFront,
        actor.armBack,
        actor.legFront,
        actor.legBack,
        actor.name,
      ];

  if (actionId === "forward" || actionId === "back") {
    showFloatingText(target, actor.body.x, actor.body.y - 120, actionId === "forward" ? "STEP" : "BACK", "#ffe7a4");
    return;
  }

  if (actionId === "block") {
    if (actor.avatar) {
      target.tweens.add({
        targets: actor.avatar,
        angle: 5 * sign,
        duration: 140,
        yoyo: true,
        ease: "Back.easeOut",
      });
    }

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
    if (actor.avatar) {
      target.tweens.add({
        targets: actor.avatar,
        angle: 7 * sign,
        duration: 110,
        yoyo: true,
        repeat: 3,
        ease: "Sine.easeInOut",
      });
    }

    target.tweens.add({
      targets: [actor.head, actor.eyeLeft, actor.eyeRight, actor.helmet],
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

function shakeFighter(target: Phaser.Scene, fighter: FighterVisual): void {
  const parts = fighter.avatar
    ? [fighter.avatar]
    : [
        fighter.body,
        fighter.head,
        fighter.eyeLeft,
        fighter.eyeRight,
        fighter.helmet,
        fighter.sword,
        fighter.armFront,
        fighter.armBack,
        fighter.legFront,
        fighter.legBack,
      ];

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



