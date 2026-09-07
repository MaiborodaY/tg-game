import "../../src/styles.css";
import "../../src/gameplay-theme.css";
import "../../src/draft-card-theme.css";
import { getCardArchetypeIconPath } from "../../src/cardAssetContract";
import { createDraftCardSilhouette } from "../../src/draftCardArt";
import { CARD_DEFINITIONS, CARD_BY_ID } from "../../src/game/cards";
import type { CardDefinition, CardId } from "../../src/game/types";
import { getLocalizedCard, getRarityLabel, getTagLabel, getUiCopy, SUPPORTED_LOCALES, type SupportedLocale } from "../../src/i18n";
import { getUnitCardAssetPath } from "../../src/unitAssets";

// Dev-only entry: use the real art renderer and production CSS, but no game state,
// Phaser, network API or persistence. The fixtures cannot change a player's run.
const SCREENSHOT_CARDS: readonly CardId[] = ["forest_skirmisher", "sneakblade", "plague_rat"];
const grid = element("cards");
const status = element("fixture-status");
let selectedIds = SCREENSHOT_CARDS;
let locale: SupportedLocale = "ru";
let stress = false;
let page = 0;
let running = false;
const imageBounds = new Map<string, Promise<PixelBounds>>();

interface PixelBounds {
  width: number;
  height: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing fixture element: ${id}`);
  return found;
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  result.className = className;
  if (text) result.textContent = text;
  return result;
}

function createCard(card: CardDefinition, slot: number): HTMLButtonElement {
  const translated = getLocalizedCard(locale, card);
  const copy = getUiCopy(locale);
  const archetype = card.role === "tank" ? "tank" : card.role === "support" ? "support" : "damage";
  const rarity = card.tier === 1 ? "common" : card.tier === 2 ? "uncommon" : "rare";
  const button = node("button", `unit-card unit-card--${archetype} unit-card--${rarity}`);
  button.type = "button";
  button.dataset.cardId = card.id;
  button.title = translated.summary;
  const badge = node("div", `unit-card__archetype unit-card__archetype--${archetype}`);
  const icon = node("img", "unit-card__archetype-icon");
  icon.alt = "";
  // The production contract is app-root relative; this fixture is nested under tests.
  icon.src = new URL(getCardArchetypeIconPath(archetype), `${location.origin}/`).href;
  badge.append(icon);
  const body = node("div", "unit-card__body");
  const header = node("div", "unit-card__header");
  header.append(node("strong", "unit-card__name", translated.name), node("span", `unit-card__rarity unit-card__rarity--${rarity}`, getRarityLabel(locale, rarity)));
  const tags = node("div", "unit-card__tag-row");
  tags.append(...card.tags.map((tag) => node("span", "", getTagLabel(locale, tag))));
  const art = node("div", `unit-card__art unit-card__art--${archetype} unit-card__art--${rarity}`);
  const path = getUnitCardAssetPath(card.id);
  if (!path) throw new Error(`Missing card illustration: ${card.id}`);
  art.append(createDraftCardSilhouette(card.id, translated.name, path));
  const stats = node("div", "unit-card__stats");
  for (const [label, value] of [[copy.attack, card.stats.attack], [copy.hp, card.stats.hp], [copy.speed, card.stats.speed], [copy.range, card.stats.range]] as const) {
    const stat = node("span", "unit-card__stat");
    stat.append(node("span", "unit-card__stat-label", label), node("strong", "unit-card__stat-value", String(value)));
    stats.append(stat);
  }
  const ability = node("p", "unit-card__ability");
  ability.append(node("span", "unit-card__ability-text", translated.text));
  const footer = node("div", "unit-card__footer");
  footer.append(stats, ability);
  body.append(header, tags);
  // Leave one card without each badge to catch unequal row reservations.
  if (stress && slot !== 1) {
    body.append(node("span", "unit-card__board-status unit-card__board-status--upgrade", `↑ ${copy.draftUpgradeAvailable}`));
  }
  body.append(art);
  if (stress && slot !== 2) {
    const forecast = node("div", "unit-card__synergy-forecast");
    const descriptions = locale === "en"
      ? ["✓ Warriors: +1 attack", "★ Guardians: +2 starting armor"]
      : locale === "uk" ? ["✓ Воїни: +1 до атаки", "★ Вартові: +2 початкової броні"]
        : ["✓ Воины: +1 к атаке", "★ Стражи: +2 стартовой брони"];
    forecast.append(...descriptions.map((text) => node("span", "unit-card__synergy-forecast-line unit-card__synergy-forecast-line--activates", text)));
    body.append(forecast);
  }
  body.append(footer);
  const handle = node("span", "unit-card__drag-handle", "⠿");
  handle.setAttribute("aria-hidden", "true");
  button.append(node("span", "unit-card__frame"), badge, body, handle);
  return button;
}

async function showCards(ids: readonly CardId[] = selectedIds): Promise<void> {
  grid.classList.toggle("draft-grid--with-status", stress);
  grid.classList.toggle("draft-grid--with-forecast", stress);
  grid.replaceChildren(...ids.map((id, slot) => createCard(CARD_BY_ID[id], slot)));
  await document.fonts.ready;
  await Promise.all(Array.from(grid.querySelectorAll("svg image"), (image) => loadPixelBounds((image as SVGImageElement).href.baseVal)));
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

function loadPixelBounds(path: string): Promise<PixelBounds> {
  const cached = imageBounds.get(path);
  if (cached) return cached;
  const pending = (async () => {
    const image = new Image();
    image.src = path;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas unavailable for visible alpha bounds check");
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width;
    let top = canvas.height;
    let right = 0;
    let bottom = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 0) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x + 1);
          bottom = Math.max(bottom, y + 1);
        }
      }
    }
    if (right <= left || bottom <= top) throw new Error(`Empty illustration: ${path}`);
    return { width: canvas.width, height: canvas.height, left, top, right, bottom };
  })();
  imageBounds.set(path, pending);
  return pending;
}

function contains(outer: DOMRectReadOnly, inner: DOMRectReadOnly, tolerance = 1): boolean {
  return inner.left >= outer.left - tolerance && inner.right <= outer.right + tolerance
    && inner.top >= outer.top - tolerance && inner.bottom <= outer.bottom + tolerance;
}

function intersects(a: DOMRectReadOnly, b: DOMRectReadOnly): boolean {
  return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
    && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
}

async function inspectCards(): Promise<string[]> {
  const errors: string[] = [];
  const viewport = new DOMRect(0, 0, innerWidth, innerHeight);
  for (const card of grid.querySelectorAll<HTMLElement>(".unit-card")) {
    const label = `${locale}/${stress ? "badges" : "plain"}/${card.dataset.cardId}`;
    const body = card.querySelector<HTMLElement>(".unit-card__body")!;
    const art = body.querySelector<HTMLElement>(".unit-card__art")!;
    const svg = art.querySelector("svg")!;
    const image = svg.querySelector("image")!;
    const artBounds = art.getBoundingClientRect();
    const bounds = await loadPixelBounds(image.href.baseVal);
    if (!contains(viewport, card.getBoundingClientRect())) errors.push(`${label}: card outside viewport`);
    if (!contains(body.getBoundingClientRect(), artBounds)) errors.push(`${label}: art outside body`);
    if (!contains(artBounds, svg.getBoundingClientRect())) errors.push(`${label}: SVG outside art`);
    if (artBounds.width < 24 || artBounds.height < 48) errors.push(`${label}: art region too small (${artBounds.width.toFixed(1)}×${artBounds.height.toFixed(1)})`);
    for (const zone of body.querySelectorAll<HTMLElement>(".unit-card__header, .unit-card__tag-row, .unit-card__board-status, .unit-card__synergy-forecast, .unit-card__footer")) {
      if (intersects(artBounds, zone.getBoundingClientRect())) errors.push(`${label}: art overlaps ${zone.className}`);
      if (!contains(body.getBoundingClientRect(), zone.getBoundingClientRect())) errors.push(`${label}: ${zone.className} outside body`);
    }
    // The SVG <image> includes transparent padding outside the cropped viewBox.
    // Transform actual non-transparent pixel corners, not its raw DOM rectangle.
    const matrix = image.getScreenCTM();
    if (!matrix) {
      errors.push(`${label}: SVG transformation unavailable`);
      continue;
    }
    const points = [[bounds.left, bounds.top], [bounds.right, bounds.bottom]].map(([x, y]) => new DOMPoint(
      image.x.baseVal.value + x / bounds.width * image.width.baseVal.value,
      image.y.baseVal.value + y / bounds.height * image.height.baseVal.value,
    ).matrixTransform(matrix));
    const painted = new DOMRect(points[0].x, points[0].y, points[1].x - points[0].x, points[1].y - points[0].y);
    if (!contains(artBounds, painted)) errors.push(`${label}: visible silhouette clipped`);
    if (!contains(body.getBoundingClientRect(), painted)) errors.push(`${label}: visible silhouette outside body`);
    if (painted.width < 12 || painted.height < 12) errors.push(`${label}: empty rendered silhouette`);
  }
  return errors;
}

function report(errors: string[], checked: number): void {
  status.dataset.result = errors.length ? "fail" : "pass";
  status.textContent = `${errors.length ? "FAIL" : "PASS"} · ${checked} карточек · ${innerWidth}×${innerHeight}\n${errors.length ? errors.join("\n") : "Силуэты целиком; зоны не пересекаются; все три карты в экране."}`;
}

async function preview(): Promise<void> {
  await showCards();
  report(await inspectCards(), selectedIds.length);
}

async function auditAll(): Promise<void> {
  if (running) return;
  running = true;
  const savedLocale = locale;
  const savedStress = stress;
  const errors: string[] = [];
  let checked = 0;
  status.textContent = "Проверка всех силуэтов и зон на текущем размере экрана…";
  try {
    for (const nextLocale of SUPPORTED_LOCALES) {
      locale = nextLocale;
      for (const withBadges of [false, true]) {
        stress = withBadges;
        for (let index = 0; index < CARD_DEFINITIONS.length; index += 3) {
          const ids = CARD_DEFINITIONS.slice(index, index + 3).map((card) => card.id);
          await showCards(ids);
          errors.push(...await inspectCards());
          checked += ids.length;
        }
      }
    }
  } catch (error) {
    errors.push(String(error));
  } finally {
    locale = savedLocale;
    stress = savedStress;
    await showCards();
    report(errors, checked);
    running = false;
  }
}

element("screenshot-triple").addEventListener("click", () => {
  if (running) return;
  selectedIds = SCREENSHOT_CARDS;
  void preview();
});
element("next-triple").addEventListener("click", () => {
  if (running) return;
  selectedIds = CARD_DEFINITIONS.slice(page * 3, page * 3 + 3).map((card) => card.id);
  page = (page + 1) % Math.ceil(CARD_DEFINITIONS.length / 3);
  void preview();
});
element("stress").addEventListener("click", () => {
  if (running) return;
  stress = !stress;
  element("stress").setAttribute("aria-pressed", String(stress));
  void preview();
});
element("locale").addEventListener("change", (event) => {
  if (running) return;
  locale = (event.target as HTMLSelectElement).value as SupportedLocale;
  void preview();
});
element("audit-all").addEventListener("click", () => void auditAll());
void preview().catch((error) => report([String(error)], 0));
