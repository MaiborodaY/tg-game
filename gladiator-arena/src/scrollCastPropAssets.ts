export const SCROLL_CAST_PROP_ASSET_KEYS = [
  "scroll-crack-armor-01",
  "scroll-fireball-01",
  "scroll-ward-01",
  "scroll-precise-strike-01",
  "scroll-double-strike-01",
  "scroll-poison-01",
] as const;

export type ScrollCastPropAssetKey = (typeof SCROLL_CAST_PROP_ASSET_KEYS)[number];

export const DEFAULT_SCROLL_CAST_PROP_ASSET_KEY: ScrollCastPropAssetKey = "scroll-crack-armor-01";
