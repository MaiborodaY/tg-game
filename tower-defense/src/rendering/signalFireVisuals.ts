export { SIGNAL_FIRE_RADIUS } from "../game/northernPassMechanics.ts";

export type SignalFireState = "idle" | "available" | "active";

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
  }),
}) satisfies Readonly<Record<SignalFireState, SignalFireVisualProfile>>;

export function getSignalFireVisualProfile(state: SignalFireState): SignalFireVisualProfile {
  return SIGNAL_FIRE_VISUALS[state];
}
