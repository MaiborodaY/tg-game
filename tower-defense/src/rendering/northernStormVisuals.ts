export type NorthernStormVisualState = "calm" | "threatened" | "protected";

export type NorthernStormVisualProfile = Readonly<{
  route: number;
  routeAlpha: number;
  edge: number;
  edgeAlpha: number;
  badge: number;
  badgeAlpha: number;
  label: string;
}>;

const NORTHERN_STORM_VISUALS = Object.freeze({
  calm: Object.freeze({
    route: 0x7a9aa7,
    routeAlpha: 0.035,
    edge: 0xa9c2ca,
    edgeAlpha: 0.08,
    badge: 0x354b55,
    badgeAlpha: 0.5,
    label: "#b5cbd1",
  }),
  threatened: Object.freeze({
    route: 0xa4e7ff,
    routeAlpha: 0.25,
    edge: 0xe5fbff,
    edgeAlpha: 0.5,
    badge: 0x4d91ad,
    badgeAlpha: 0.94,
    label: "#effcff",
  }),
  protected: Object.freeze({
    route: 0xf3c86f,
    routeAlpha: 0.3,
    edge: 0x91efc7,
    edgeAlpha: 0.58,
    badge: 0x3d9277,
    badgeAlpha: 0.96,
    label: "#fff3b5",
  }),
}) satisfies Readonly<Record<NorthernStormVisualState, NorthernStormVisualProfile>>;

export function getNorthernStormVisualProfile(state: NorthernStormVisualState): NorthernStormVisualProfile {
  return NORTHERN_STORM_VISUALS[state];
}
