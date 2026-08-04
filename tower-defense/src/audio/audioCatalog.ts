export type MusicContext = "forest" | "northern" | "boss" | null;

export type MusicPlayback = Readonly<{
  id: Exclude<MusicContext, null>;
  introUrl?: string;
  loopUrl: string;
  volume: number;
  crossfadeMs: number;
}>;

export const AUDIO_SAMPLE_IDS = Object.freeze([
  "avalanche", "bossArrival", "bossDefeat", "build", "defeat",
  "emberHit1", "emberHit2", "enemyDefeat1", "enemyDefeat2",
  "frostHit1", "frostHit2", "gateHit", "gateShield", "heroBarrier",
  "heroEiraAbility", "heroEiraAttack", "heroGrakAbility", "heroGrakAttack",
  "heroHit", "heroKnockout", "heroRecharge", "heroRespawn",
  "heroTorenAbility", "heroTorenAttack", "rangerHit1", "rangerHit2", "sell",
  "stormHit1", "stormHit2", "uiConfirm", "uiError", "uiSelect", "uiToggle",
  "upgrade", "victory", "waveClear", "waveStart",
] as const);

export type AudioSampleId = (typeof AUDIO_SAMPLE_IDS)[number];

export type AudioLibrary = Readonly<{
  sampleUrls: Readonly<Record<AudioSampleId, string>>;
  effectUrls: readonly string[];
  music: Readonly<Record<Exclude<MusicContext, null>, MusicPlayback>>;
}>;

export type AudioCueId =
  | "ui_select"
  | "ui_toggle"
  | "ui_confirm"
  | "ui_error"
  | "build"
  | "upgrade"
  | "sell"
  | "wave_start"
  | "wave_clear"
  | "boss_arrival"
  | "tower_ranger_hit"
  | "tower_frost_hit"
  | "tower_ember_hit"
  | "tower_storm_hit"
  | "storm_chain"
  | "hero_eira_attack"
  | "hero_toren_attack"
  | "hero_grak_attack"
  | "hero_morna_attack"
  | "hero_eira_ability"
  | "hero_toren_ability"
  | "hero_grak_ability"
  | "hero_morna_ability"
  | "hero_hit"
  | "hero_knockout"
  | "hero_respawn"
  | "hero_rank_up"
  | "hero_barrier"
  | "hero_recharge"
  | "gate_hit"
  | "gate_shield"
  | "avalanche"
  | "enemy_defeat"
  | "boss_defeat"
  | "victory"
  | "defeat";

export type AudioCueConfig = Readonly<{
  samples: readonly AudioSampleId[];
  volume: number;
  cooldownMs: number;
  pitchSpread: number;
  priority: 1 | 2 | 3;
}>;

function cue(
  samples: readonly AudioSampleId[],
  volume: number,
  cooldownMs: number,
  pitchSpread = 0,
  priority: 1 | 2 | 3 = 1,
): AudioCueConfig {
  return Object.freeze({ samples: Object.freeze([...samples]), volume, cooldownMs, pitchSpread, priority });
}

export const AUDIO_CUES: Readonly<Record<AudioCueId, AudioCueConfig>> = Object.freeze({
  ui_select: cue(["uiSelect"], 0.3, 45, 0.015, 2),
  ui_toggle: cue(["uiToggle"], 0.38, 45, 0, 2),
  ui_confirm: cue(["uiConfirm"], 0.42, 90, 0, 2),
  ui_error: cue(["uiError"], 0.42, 150, 0, 2),
  build: cue(["build"], 0.48, 90, 0.025, 2),
  upgrade: cue(["upgrade"], 0.5, 110, 0.015, 2),
  sell: cue(["sell"], 0.42, 100, 0.02, 2),
  wave_start: cue(["waveStart"], 0.48, 350, 0, 2),
  wave_clear: cue(["waveClear"], 0.48, 500, 0, 2),
  boss_arrival: cue(["bossArrival"], 0.68, 900, 0, 3),
  tower_ranger_hit: cue(["rangerHit1", "rangerHit2"], 0.2, 105, 0.035),
  tower_frost_hit: cue(["frostHit1", "frostHit2"], 0.18, 120, 0.025),
  tower_ember_hit: cue(["emberHit1", "emberHit2"], 0.22, 125, 0.025),
  tower_storm_hit: cue(["stormHit1", "stormHit2"], 0.19, 115, 0.02),
  storm_chain: cue(["stormHit1", "stormHit2"], 0.16, 150, 0.025),
  hero_eira_attack: cue(["heroEiraAttack"], 0.34, 160, 0.025, 2),
  hero_toren_attack: cue(["heroTorenAttack"], 0.38, 180, 0.02, 2),
  hero_grak_attack: cue(["heroGrakAttack"], 0.4, 170, 0.02, 2),
  hero_morna_attack: cue(["frostHit1", "frostHit2"], 0.24, 165, 0.018, 2),
  hero_eira_ability: cue(["heroEiraAbility"], 0.48, 280, 0, 3),
  hero_toren_ability: cue(["heroTorenAbility"], 0.56, 280, 0, 3),
  hero_grak_ability: cue(["heroGrakAbility"], 0.58, 280, 0, 3),
  hero_morna_ability: cue(["heroBarrier"], 0.52, 320, 0.01, 3),
  hero_hit: cue(["heroHit"], 0.29, 145, 0.03, 2),
  hero_knockout: cue(["heroKnockout"], 0.58, 500, 0, 3),
  hero_respawn: cue(["heroRespawn"], 0.46, 450, 0, 2),
  hero_rank_up: cue(["uiConfirm", "heroRespawn"], 0.5, 450, 0, 3),
  hero_barrier: cue(["heroBarrier"], 0.34, 150, 0.02, 2),
  hero_recharge: cue(["heroRecharge"], 0.3, 300, 0.02, 2),
  gate_hit: cue(["gateHit"], 0.64, 220, 0.015, 3),
  gate_shield: cue(["gateShield"], 0.5, 180, 0.02, 3),
  avalanche: cue(["avalanche"], 0.66, 600, 0, 3),
  enemy_defeat: cue(["enemyDefeat1", "enemyDefeat2"], 0.12, 125, 0.045),
  boss_defeat: cue(["bossDefeat"], 0.64, 700, 0, 3),
  victory: cue(["victory"], 0.58, 900, 0, 3),
  defeat: cue(["defeat"], 0.58, 900, 0, 3),
});
