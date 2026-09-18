import { ST_KNIHOR_ASSETS, ST_KNIHOR_PORTRAIT_IMAGE_URL, ST_KNIHOR_EFFECTS_IMAGE_URL,
  ST_KNIHOR_GEOMETRY, ST_KNIHOR_EFFECTS } from '../st-knihor-art.mjs';
import { tinyStKnihorFrame, stKnihorDirection, stKnihorEffectFrame,
  stKnihorEffectActive, stKnihorImpactTime, ST_KNIHOR_ANIMATIONS } from '../tiny-st-knihor.mjs';

const $ = selector => document.querySelector(selector);
const actionNames = { idle: 'Покой', walk: 'Ходьба', attack: 'Атака', cast: 'Каст', hit: 'Урон', death: 'Гибель' };
const directionNames = { down: 'вниз', right: 'бок', left: 'бок, зеркало', up: 'спина' };
const durations = Object.fromEntries(Object.entries(ST_KNIHOR_ANIMATIONS).map(([name, animation]) => [name, animation.duration]));
const facings = { down: [0, 1], right: [1, 0], left: [-1, 0], up: [0, -1] };
const state = { action: 'idle', direction: 'down', speed: 1, paused: matchMedia('(prefers-reduced-motion: reduce)').matches,
  effects: true, ability: null, time: 0, ready: false };
const images = {};
const bodyScale = 40 / (ST_KNIHOR_GEOMETRY.frameHeight * ST_KNIHOR_GEOMETRY.bodyHeight);
let previousTime;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Не удалось загрузить ${new URL(url, location.href).pathname}`));
    image.src = url;
  });
}

function select(group, attribute, value) {
  document.querySelectorAll(group).forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset[attribute] === String(value)));
  });
}

function syncControls() {
  select('button[data-action]', 'action', state.action);
  select('button[data-direction]', 'direction', state.direction);
  select('[data-speed]', 'speed', state.speed);
  select('[data-ability]', 'ability', state.ability);
  $('#pause').setAttribute('aria-pressed', String(state.paused));
  $('#pause').textContent = state.paused ? 'Играть' : 'Пауза';
  $('#current-action').textContent = `${actionNames[state.action]} · ${directionNames[state.direction]}`;
  render();
}

$('#actions').addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  state.action = button.dataset.action;
  state.ability = null;
  state.time = 0;
  syncControls();
});
$('#directions').addEventListener('click', event => {
  const button = event.target.closest('[data-direction]');
  if (!button) return;
  state.direction = button.dataset.direction;
  syncControls();
});
$('#speeds').addEventListener('click', event => {
  const button = event.target.closest('[data-speed]');
  if (!button) return;
  state.speed = Number(button.dataset.speed);
  syncControls();
});
$('#pause').addEventListener('click', () => { state.paused = !state.paused; syncControls(); });
$('#restart').addEventListener('click', () => { state.time = 0; render(); });
$('#effects').addEventListener('change', event => { state.effects = event.target.checked; render(); });
$('#theme').addEventListener('click', () => {
  const dark = document.body.dataset.theme !== 'dark';
  document.body.dataset.theme = dark ? 'dark' : 'light';
  $('#theme').setAttribute('aria-pressed', String(dark));
  $('#theme').textContent = dark ? 'Тёмный фон' : 'Светлый фон';
  render();
});
document.querySelectorAll('[data-ability]').forEach(button => button.addEventListener('click', () => {
  state.ability = button.dataset.ability;
  state.action = 'cast';
  state.effects = true;
  state.time = 0;
  $('#effects').checked = true;
  syncControls();
}));

function surface(canvas) {
  const width = Math.round(canvas.clientWidth);
  const height = Math.round(canvas.clientHeight);
  const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

function ground(ctx, x, y, width) {
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--ground');
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y + .5);
  ctx.lineTo(x + width / 2, y + .5);
  ctx.stroke();
}

function actorAt(action, elapsed, direction = state.direction) {
  const [facingX, facingY] = facings[direction];
  return { action, walkTime: elapsed, actionTime: elapsed, actionDuration: durations[action],
    impactFraction: .5, facingX, facingY };
}

function drawActor(ctx, actor, elapsed, x, y, scale) {
  const frame = tinyStKnihorFrame(actor, elapsed);
  const { direction, flipX } = stKnihorDirection(actor);
  const rect = ST_KNIHOR_GEOMETRY.sourceRects[frame];
  const { anchor } = ST_KNIHOR_GEOMETRY;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(images[direction], rect.x, rect.y, rect.width, rect.height,
    -anchor.x * scale, -anchor.y * scale, rect.width * scale, rect.height * scale);
  ctx.restore();
  return { frame, direction, flipX };
}

function drawEffect(ctx, kind, elapsed, x, y, scale) {
  if (!state.effects || !stKnihorEffectActive(kind, elapsed)) return;
  const frame = stKnihorEffectFrame(kind, elapsed) % 4;
  const { rect, groundAnchor } = ST_KNIHOR_EFFECTS[kind].frames[frame];
  ctx.drawImage(images.effects, rect.x, rect.y, rect.width, rect.height,
    x - groundAnchor.x * scale, y - groundAnchor.y * scale, rect.width * scale, rect.height * scale);
}

function drawTarget(ctx, x, y, scale) {
  ctx.save();
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--muted');
  ctx.globalAlpha = .6;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(5, 9 * scale), Math.max(2, 3 * scale), 0, 0, Math.PI * 2);
  ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
  ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
  ctx.stroke();
  ctx.restore();
}

function hammerPositions(width, heroScale, effectScale, mirrored = false) {
  const hero = Math.max(128 * heroScale / 2 + 6, width * .28);
  const target = Math.min(width - 128 * effectScale / 2 - 6, width * .76);
  return mirrored ? { x: width - hero, targetX: width - target } : { x: hero, targetX: target };
}

function drawAbility(ctx, kind, elapsed, x, y, scale, targetX = x) {
  if (!kind || elapsed < 0) return;
  if (kind === 'hammer') {
    const fall = ST_KNIHOR_EFFECTS.hammer.duration;
    const progress = Math.min(1, elapsed / fall);
    // Keep the flight and impact separate; the impact stays at the marked target.
    if (elapsed < fall) drawEffect(ctx, 'hammer', elapsed, x + (targetX - x) * progress,
      y - scale * (10 + 44 * (1 - progress) + 58 * Math.sin(progress * Math.PI)), scale);
    else drawEffect(ctx, 'impact', elapsed - fall, targetX, y, scale);
  } else drawEffect(ctx, kind, elapsed, x, kind === 'armor' ? y : y - 20 * scale, scale);
}

function phase() {
  if (state.ability) return state.time % 2.2;
  const hold = ['idle', 'walk'].includes(state.action) ? 0 : .4;
  return state.time % (durations[state.action] + hold);
}

function renderStage(canvas, enlarged) {
  const { ctx, width, height } = surface(canvas);
  const hammer = state.ability === 'hammer';
  const scale = enlarged ? Math.min(bodyScale * 4, (width - 12) / (hammer ? 220 : 128), (height - 50) / 128) : bodyScale;
  const { x, targetX } = hammer ? hammerPositions(width, scale, scale, state.direction === 'left')
    : { x: width / 2, targetX: width / 2 };
  // Bursts extend below their anchor; leave room for the complete effect at every zoom.
  const y = height - Math.max(enlarged ? 22 : 45, state.ability ? 64 * scale + 3 : 0);
  const elapsed = phase();
  const actor = actorAt(state.action, elapsed);
  const effectElapsed = elapsed - stKnihorImpactTime(actorAt('cast', elapsed));
  ground(ctx, width / 2, y, Math.min(width - 30, 180));
  if (hammer) drawTarget(ctx, targetX, y, scale);
  if (state.ability === 'armor') drawAbility(ctx, state.ability, effectElapsed, x, y, scale);
  const rendered = drawActor(ctx, actor, elapsed, x, y, scale);
  if (state.ability !== 'armor') drawAbility(ctx, state.ability, effectElapsed, x, y, scale, targetX);
  canvas.dataset.frame = String(rendered.frame);
  canvas.dataset.direction = rendered.direction;
  canvas.dataset.mirrored = String(rendered.flipX);
  canvas.dataset.action = state.action;
  canvas.dataset.effects = String(state.effects);
  if (enlarged) $('#zoom-label').textContent = `×${(scale / bodyScale).toFixed(1).replace('.0', '')}`;
  else $('#frame-readout').textContent = `Кадр ${rendered.frame % 4 + 1} / 4`;
}

function renderAbility(kind) {
  const { ctx, width, height } = surface($(`#ability-${kind}`));
  const elapsed = state.time % 2.2;
  const actor = actorAt('cast', elapsed, kind === 'hammer' ? 'right' : 'down');
  const effectElapsed = elapsed - stKnihorImpactTime(actor);
  const effectScale = kind === 'hammer' ? Math.min(.62, (width - 12) / 196) : .62;
  const { x, targetX } = kind === 'hammer' ? hammerPositions(width, bodyScale, effectScale)
    : { x: width / 2, targetX: width / 2 };
  const lowerExtent = kind === 'armor' ? 24 : kind === 'heal' ? 44 : 64;
  const y = height - Math.max(22, lowerExtent * effectScale + 3);
  ground(ctx, width / 2, y, width - 30);
  if (kind === 'hammer') drawTarget(ctx, targetX, y, effectScale);
  if (kind === 'armor') drawAbility(ctx, kind, effectElapsed, x, y, .62);
  drawActor(ctx, actor, elapsed, x, y, bodyScale);
  if (kind !== 'armor') drawAbility(ctx, kind, effectElapsed, x, y, effectScale, targetX);
}

function render() {
  if (!state.ready) return;
  renderStage($('#actual'), false);
  renderStage($('#zoom'), true);
  for (const kind of ['heal', 'armor', 'hammer']) renderAbility(kind);
}

function animate(timestamp) {
  if (previousTime !== undefined && !state.paused && !document.hidden) {
    state.time += Math.min((timestamp - previousTime) / 1000, .1) * state.speed;
    render();
  }
  previousTime = timestamp;
  requestAnimationFrame(animate);
}

new ResizeObserver(render).observe($('main'));
$('#portrait').src = ST_KNIHOR_PORTRAIT_IMAGE_URL;
syncControls();
try {
  await Promise.all([...Object.entries(ST_KNIHOR_ASSETS), ['effects', ST_KNIHOR_EFFECTS_IMAGE_URL],
    ['portrait', ST_KNIHOR_PORTRAIT_IMAGE_URL]]
    .map(async ([key, url]) => { images[key] = await loadImage(url); }));
  state.ready = true;
  document.body.dataset.ready = 'true';
  $('#load-status').textContent = '';
  render();
  requestAnimationFrame(animate);
} catch (error) {
  $('#load-status').dataset.error = 'true';
  $('#load-status').textContent = error.message;
  document.body.dataset.ready = 'error';
  console.error(error);
}
