export { SIGNAL_FIRE_RADIUS } from "../game/northernPassMechanics.ts";

export type SignalFireState = "idle" | "available" | "active" | "protected" | "threatened";

export type SignalFireVisualProfile = Readonly<{
  zone: number;
  zoneAlpha: number;
  zoneStrokeAlpha: number;
  halo: number;
  haloAlpha: number;
  flame: number;
  flameAlpha: number;
  core: number;
  coreAlpha: number;
  rune: number;
  runeAlpha: number;
  choice: number;
  choiceAlpha: number;
  pointerAlpha: number;
}>;

const SIGNAL_FIRE_VISUALS = Object.freeze({
  idle: Object.freeze({
    zone: 0x79939a,
    zoneAlpha: 0.012,
    zoneStrokeAlpha: 0.1,
    halo: 0x6e858b,
    haloAlpha: 0.08,
    flame: 0x6e858b,
    flameAlpha: 0.2,
    core: 0xb2c6c8,
    coreAlpha: 0.12,
    rune: 0x829aa0,
    runeAlpha: 0.24,
    choice: 0x829aa0,
    choiceAlpha: 0,
    pointerAlpha: 0,
  }),
  available: Object.freeze({
    zone: 0xf2bd68,
    zoneAlpha: 0.026,
    zoneStrokeAlpha: 0.24,
    halo: 0xf0ad51,
    haloAlpha: 0.17,
    flame: 0xe99a3f,
    flameAlpha: 0.68,
    core: 0xffe8a5,
    coreAlpha: 0.62,
    rune: 0xe9bd70,
    runeAlpha: 0.64,
    choice: 0xffd780,
    choiceAlpha: 0.78,
    pointerAlpha: 0.94,
  }),
  active: Object.freeze({
    zone: 0xffc45e,
    zoneAlpha: 0.07,
    zoneStrokeAlpha: 0.46,
    halo: 0xff9d3d,
    haloAlpha: 0.31,
    flame: 0xff7b35,
    flameAlpha: 0.98,
    core: 0xfff0a8,
    coreAlpha: 0.92,
    rune: 0xffd780,
    runeAlpha: 0.9,
    choice: 0xffe3a0,
    choiceAlpha: 0.92,
    pointerAlpha: 0.32,
  }),
  protected: Object.freeze({
    zone: 0x7de6bd,
    zoneAlpha: 0.074,
    zoneStrokeAlpha: 0.52,
    halo: 0xffbd59,
    haloAlpha: 0.34,
    flame: 0xff8a3d,
    flameAlpha: 1,
    core: 0xfff3b2,
    coreAlpha: 0.96,
    rune: 0x9cf2ce,
    runeAlpha: 0.94,
    choice: 0x9cf2ce,
    choiceAlpha: 0.36,
    pointerAlpha: 0,
  }),
  threatened: Object.freeze({
    zone: 0x83dfff,
    zoneAlpha: 0.022,
    zoneStrokeAlpha: 0.34,
    halo: 0x6ebbd8,
    haloAlpha: 0.17,
    flame: 0x78a9b8,
    flameAlpha: 0.34,
    core: 0xc8f5ff,
    coreAlpha: 0.3,
    rune: 0x8fdef4,
    runeAlpha: 0.72,
    choice: 0x8fdef4,
    choiceAlpha: 0.42,
    pointerAlpha: 0,
  }),
}) satisfies Readonly<Record<SignalFireState, SignalFireVisualProfile>>;

export function getSignalFireVisualProfile(state: SignalFireState): SignalFireVisualProfile {
  return SIGNAL_FIRE_VISUALS[state];
}
