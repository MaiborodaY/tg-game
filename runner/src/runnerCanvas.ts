import { RUNNER_MAGNET_RADIUS, type RunnerObstacle, type RunnerPickup, type RunnerState } from "./runnerState";

export type RunnerPetType = "cat" | "dog";

export function drawRunnerFrame(
  context: CanvasRenderingContext2D,
  state: RunnerState,
  petType: RunnerPetType
): void {
  const { width, height } = state.world;
  context.clearRect(0, 0, width, height);
  drawSky(context, state);
  drawFarm(context, state);
  drawPickups(context, state.pickups, state.activeMs);
  drawObstacles(context, state.obstacles, state.activeMs);
  drawPet(context, state, petType);
}

function drawSky(context: CanvasRenderingContext2D, state: RunnerState): void {
  const { width, height, groundY } = state.world;
  const zone = Math.floor(state.activeMs / 20_000) % 3;
  const palettes = [
    ["#9edbed", "#f2efb6"],
    ["#a9d6f0", "#f9d9a3"],
    ["#c2c9ef", "#f5c9a1"]
  ] as const;
  const palette = palettes[zone] || palettes[0];
  const gradient = context.createLinearGradient(0, 0, 0, groundY);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(1, palette[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = zone === 2 ? "rgba(255, 221, 128, 0.84)" : "rgba(255, 235, 133, 0.92)";
  context.beginPath();
  context.arc(width - 58, 82, 24, 0, Math.PI * 2);
  context.fill();

  const farOffset = -((state.distance * 0.12) % 180);
  context.fillStyle = "rgba(255, 255, 255, 0.66)";
  for (let index = -1; index < 4; index += 1) {
    drawCloud(context, farOffset + index * 180, 78 + (index % 2) * 55, 0.8 + (index % 3) * 0.1);
  }

  drawHillLayer(context, state.distance * 0.08, groundY, width, "#a9ca78", 78, 190);
  drawHillLayer(context, state.distance * 0.17, groundY, width, "#84b65d", 48, 150);
}

function drawFarm(context: CanvasRenderingContext2D, state: RunnerState): void {
  const { width, height, groundY } = state.world;
  const fenceOffset = -((state.distance * 0.42) % 74);
  context.fillStyle = "#d9b26d";
  context.fillRect(0, groundY - 35, width, 7);
  context.fillRect(0, groundY - 14, width, 7);
  for (let x = fenceOffset - 20; x < width + 30; x += 74) {
    roundRect(context, x, groundY - 54, 10, 54, 4);
    context.fill();
  }

  const groundGradient = context.createLinearGradient(0, groundY, 0, height);
  groundGradient.addColorStop(0, "#6e9f49");
  groundGradient.addColorStop(0.1, "#88af55");
  groundGradient.addColorStop(1, "#a57442");
  context.fillStyle = groundGradient;
  context.fillRect(0, groundY, width, height - groundY);

  context.fillStyle = "#47793a";
  context.fillRect(0, groundY, width, 6);
  const furrowOffset = -((state.distance * 0.72) % 64);
  context.strokeStyle = "rgba(92, 60, 33, 0.35)";
  context.lineWidth = 3;
  for (let x = furrowOffset - 80; x < width + 80; x += 64) {
    context.beginPath();
    context.moveTo(x, groundY + 22);
    context.lineTo(x + 54, height);
    context.stroke();
  }

  context.strokeStyle = "rgba(237, 216, 158, 0.58)";
  context.lineWidth = 2;
  context.setLineDash([11, 12]);
  context.beginPath();
  context.moveTo(0, groundY + 13);
  context.lineTo(width, groundY + 13);
  context.stroke();
  context.setLineDash([]);
}

function drawHillLayer(
  context: CanvasRenderingContext2D,
  distance: number,
  groundY: number,
  width: number,
  color: string,
  amplitude: number,
  period: number
): void {
  const offset = -(distance % period);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, groundY);
  for (let x = offset - period; x <= width + period; x += period) {
    context.quadraticCurveTo(x + period * 0.5, groundY - amplitude, x + period, groundY);
  }
  context.lineTo(width, groundY);
  context.closePath();
  context.fill();
}

function drawCloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number
): void {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.beginPath();
  context.arc(18, 18, 15, Math.PI, 0);
  context.arc(40, 14, 20, Math.PI, 0);
  context.arc(65, 20, 14, Math.PI, 0);
  context.lineTo(78, 32);
  context.lineTo(5, 32);
  context.closePath();
  context.fill();
  context.restore();
}

function drawPet(
  context: CanvasRenderingContext2D,
  state: RunnerState,
  petType: RunnerPetType
): void {
  const { player } = state;
  const blink = player.invulnerableRemainingMs > 0
    && Math.floor(state.activeMs / 75) % 2 === 0;
  if (blink) return;

  const runPhase = state.activeMs * 0.018;
  const airborne = !player.onGround;
  const legSwing = airborne ? 2 : Math.sin(runPhase) * 6;
  const bodyColor = petType === "dog" ? "#c98b4b" : "#dc8d45";
  const darkColor = petType === "dog" ? "#744729" : "#8d4b2b";
  const lightColor = petType === "dog" ? "#f1c98d" : "#f4bb77";

  context.save();
  context.translate(player.x, player.y);

  context.globalAlpha = airborne ? 0.16 : 0.24;
  context.fillStyle = "#31582c";
  context.beginPath();
  context.ellipse(
    player.width * 0.45,
    state.world.groundY - player.y + 7,
    airborne ? 17 : 23,
    airborne ? 4 : 6,
    0,
    0,
    Math.PI * 2
  );
  context.fill();
  context.globalAlpha = 1;

  context.strokeStyle = darkColor;
  context.lineWidth = 7;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(7, 18);
  context.quadraticCurveTo(-17, 2 + Math.sin(runPhase) * 5, -15, -11);
  context.stroke();

  context.strokeStyle = bodyColor;
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(15, player.height - 12);
  context.lineTo(13 + legSwing, player.height + 1);
  context.moveTo(player.width - 13, player.height - 12);
  context.lineTo(player.width - 13 - legSwing, player.height + 1);
  context.stroke();

  context.fillStyle = bodyColor;
  roundRect(context, 2, 8, player.width - 7, player.height - 13, 14);
  context.fill();

  context.fillStyle = lightColor;
  context.beginPath();
  context.ellipse(player.width * 0.55, player.height * 0.56, 12, 9, -0.15, 0, Math.PI * 2);
  context.fill();

  const headX = player.width - 8;
  const headY = 10;
  context.fillStyle = bodyColor;
  context.beginPath();
  context.arc(headX, headY, 17, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = darkColor;
  if (petType === "dog") {
    context.beginPath();
    context.ellipse(headX - 13, headY - 3, 7, 13, -0.45, 0, Math.PI * 2);
    context.ellipse(headX + 13, headY - 3, 7, 13, 0.45, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(headX - 15, headY - 9);
    context.lineTo(headX - 10, headY - 25);
    context.lineTo(headX - 2, headY - 12);
    context.moveTo(headX + 4, headY - 12);
    context.lineTo(headX + 13, headY - 25);
    context.lineTo(headX + 16, headY - 7);
    context.fill();
  }

  context.fillStyle = "#26311f";
  context.beginPath();
  context.arc(headX + 6, headY - 2, 2.2, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(headX + 17, headY + 5, 2.5, 0, Math.PI * 2);
  context.fill();

  if (player.shieldRemainingMs > 0) {
    context.strokeStyle = "rgba(86, 191, 220, 0.9)";
    context.lineWidth = 3;
    context.fillStyle = "rgba(132, 222, 236, 0.14)";
    context.beginPath();
    context.ellipse(player.width * 0.5, player.height * 0.42, player.width * 0.78, player.height * 0.82, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  if (player.magnetRemainingMs > 0) {
    context.strokeStyle = "rgba(239, 91, 85, 0.72)";
    context.lineWidth = 2;
    context.setLineDash([4, 5]);
    context.beginPath();
    context.arc(
      player.width * 0.5,
      player.height * 0.5,
      RUNNER_MAGNET_RADIUS,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.setLineDash([]);
  }
  context.restore();
}

function drawObstacles(
  context: CanvasRenderingContext2D,
  obstacles: RunnerObstacle[],
  activeMs: number
): void {
  for (const obstacle of obstacles) {
    if (obstacle.kind === "crate") drawCrate(context, obstacle);
    else if (obstacle.kind === "hay") drawHay(context, obstacle);
    else if (obstacle.kind === "puddle") drawPuddle(context, obstacle);
    else drawCrow(context, obstacle, activeMs);
  }
}

function drawCrate(context: CanvasRenderingContext2D, obstacle: RunnerObstacle): void {
  context.fillStyle = "#b87339";
  context.strokeStyle = "#71451f";
  context.lineWidth = 3;
  roundRect(context, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 6);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(obstacle.x + 5, obstacle.y + 5);
  context.lineTo(obstacle.x + obstacle.width - 5, obstacle.y + obstacle.height - 5);
  context.moveTo(obstacle.x + obstacle.width - 5, obstacle.y + 5);
  context.lineTo(obstacle.x + 5, obstacle.y + obstacle.height - 5);
  context.stroke();
}

function drawHay(context: CanvasRenderingContext2D, obstacle: RunnerObstacle): void {
  context.fillStyle = "#e4b53f";
  context.strokeStyle = "#a87625";
  context.lineWidth = 3;
  roundRect(context, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 10);
  context.fill();
  context.stroke();
  context.strokeStyle = "rgba(133, 91, 26, 0.58)";
  context.lineWidth = 2;
  for (let y = obstacle.y + 8; y < obstacle.y + obstacle.height; y += 9) {
    context.beginPath();
    context.moveTo(obstacle.x + 5, y);
    context.lineTo(obstacle.x + obstacle.width - 5, y - 3);
    context.stroke();
  }
}

function drawPuddle(context: CanvasRenderingContext2D, obstacle: RunnerObstacle): void {
  const gradient = context.createRadialGradient(
    obstacle.x + obstacle.width * 0.45,
    obstacle.y + obstacle.height * 0.4,
    2,
    obstacle.x + obstacle.width * 0.5,
    obstacle.y + obstacle.height * 0.5,
    obstacle.width * 0.6
  );
  gradient.addColorStop(0, "#74c7d7");
  gradient.addColorStop(1, "#3a829a");
  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(
    obstacle.x + obstacle.width / 2,
    obstacle.y + obstacle.height / 2,
    obstacle.width / 2,
    obstacle.height / 2,
    0,
    0,
    Math.PI * 2
  );
  context.fill();
}

function drawCrow(
  context: CanvasRenderingContext2D,
  obstacle: RunnerObstacle,
  activeMs: number
): void {
  const wing = Math.sin(activeMs * 0.025) * 7;
  const centerX = obstacle.x + obstacle.width / 2;
  const centerY = obstacle.y + obstacle.height / 2;
  context.fillStyle = "#39403c";
  context.beginPath();
  context.ellipse(centerX, centerY, obstacle.width * 0.28, obstacle.height * 0.34, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#29312d";
  context.lineWidth = 7;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(centerX - 4, centerY);
  context.lineTo(centerX - 17, centerY - wing);
  context.moveTo(centerX + 4, centerY);
  context.lineTo(centerX + 17, centerY + wing);
  context.stroke();
  context.fillStyle = "#e5ad39";
  context.beginPath();
  context.moveTo(obstacle.x + obstacle.width - 5, centerY - 2);
  context.lineTo(obstacle.x + obstacle.width + 7, centerY + 2);
  context.lineTo(obstacle.x + obstacle.width - 5, centerY + 6);
  context.fill();
}

function drawPickups(
  context: CanvasRenderingContext2D,
  pickups: RunnerPickup[],
  activeMs: number
): void {
  for (const pickup of pickups) {
    const bob = Math.sin(activeMs * 0.006 + pickup.id) * 2.5;
    if (pickup.kind === "crop") drawCrop(context, pickup, bob);
    else if (pickup.kind === "shield") drawShieldPickup(context, pickup, bob);
    else drawMagnetPickup(context, pickup, bob);
  }
}

function drawCrop(context: CanvasRenderingContext2D, pickup: RunnerPickup, bob: number): void {
  const variant = pickup.id % 3;
  const x = pickup.x;
  const y = pickup.y + bob;
  context.save();
  context.translate(x, y);
  context.shadowColor = "rgba(91, 72, 25, 0.24)";
  context.shadowBlur = 6;
  if (variant === 0) {
    context.fillStyle = "#ef7c3a";
    context.beginPath();
    context.moveTo(-7, -4);
    context.quadraticCurveTo(8, -7, 2, 12);
    context.quadraticCurveTo(-1, 17, -4, 9);
    context.closePath();
    context.fill();
    context.strokeStyle = "#4c903b";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-2, -5);
    context.lineTo(-7, -12);
    context.moveTo(0, -5);
    context.lineTo(5, -12);
    context.stroke();
  } else if (variant === 1) {
    context.fillStyle = "#dd5350";
    context.beginPath();
    context.arc(0, 2, 10, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#4e8e3d";
    context.beginPath();
    context.ellipse(4, -9, 6, 3, -0.5, 0, Math.PI * 2);
    context.fill();
  } else {
    context.fillStyle = "#f4c640";
    for (let index = 0; index < 8; index += 1) {
      context.save();
      context.rotate(index * Math.PI / 4);
      context.beginPath();
      context.ellipse(0, -9, 4, 8, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    context.fillStyle = "#7c5723";
    context.beginPath();
    context.arc(0, 0, 6, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawShieldPickup(context: CanvasRenderingContext2D, pickup: RunnerPickup, bob: number): void {
  context.save();
  context.translate(pickup.x, pickup.y + bob);
  context.fillStyle = "rgba(223, 250, 255, 0.92)";
  context.strokeStyle = "#4ea9c1";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, pickup.radius + 3, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(0, -7);
  context.lineTo(7, -3);
  context.lineTo(5, 6);
  context.lineTo(0, 10);
  context.lineTo(-5, 6);
  context.lineTo(-7, -3);
  context.closePath();
  context.stroke();
  context.restore();
}

function drawMagnetPickup(context: CanvasRenderingContext2D, pickup: RunnerPickup, bob: number): void {
  context.save();
  context.translate(pickup.x, pickup.y + bob);
  context.strokeStyle = "#e65450";
  context.lineWidth = 7;
  context.lineCap = "round";
  context.beginPath();
  context.arc(0, 0, pickup.radius, 0.1 * Math.PI, 0.9 * Math.PI, true);
  context.stroke();
  context.strokeStyle = "#f2f0df";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-pickup.radius + 1, -2);
  context.lineTo(-pickup.radius - 3, 5);
  context.moveTo(pickup.radius - 1, -2);
  context.lineTo(pickup.radius + 3, 5);
  context.stroke();
  context.restore();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}
