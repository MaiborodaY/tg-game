export const SHOP_HERO_OFFSET_Y_MIN = -140;
export const SHOP_HERO_OFFSET_Y_MAX = 120;

const storageKey = "dust-arena-shop-hero-offset-y";
const offsetChangedEvent = "dust-arena-shop-hero-offset-y-change";

let cachedOffsetY: number | undefined;

export function getShopHeroOffsetY(): number {
  cachedOffsetY ??= loadShopHeroOffsetY();

  return cachedOffsetY;
}

export function setShopHeroOffsetY(offsetY: number): void {
  const nextOffsetY = clampShopHeroOffsetY(offsetY);

  if (cachedOffsetY === nextOffsetY) {
    return;
  }

  cachedOffsetY = nextOffsetY;
  saveShopHeroOffsetY(nextOffsetY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(offsetChangedEvent));
  }
}

export function subscribeShopHeroOffset(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(offsetChangedEvent, listener);

  return () => window.removeEventListener(offsetChangedEvent, listener);
}

function loadShopHeroOffsetY(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    return clampShopHeroOffsetY(Number(window.localStorage.getItem(storageKey) ?? 0));
  } catch {
    return 0;
  }
}

function saveShopHeroOffsetY(offsetY: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, String(offsetY));
}

function clampShopHeroOffsetY(offsetY: number): number {
  return Number.isFinite(offsetY) ? Math.max(SHOP_HERO_OFFSET_Y_MIN, Math.min(SHOP_HERO_OFFSET_Y_MAX, offsetY)) : 0;
}
