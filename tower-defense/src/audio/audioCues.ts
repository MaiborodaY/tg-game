import type { SimulationEvent } from "../game/simulation.ts";
import type { HeroId, TowerType } from "../game/types.ts";
import type { AudioCueId } from "./audioCatalog.ts";

const NO_CUES: readonly AudioCueId[] = Object.freeze([]);

const HERO_ATTACK_CUES: Readonly<Record<HeroId, AudioCueId>> = Object.freeze({
  eira: "hero_eira_attack",
  toren: "hero_toren_attack",
  grak: "hero_grak_attack",
  morna: "hero_morna_attack",
});

const HERO_ABILITY_CUES: Readonly<Record<HeroId, AudioCueId>> = Object.freeze({
  eira: "hero_eira_ability",
  toren: "hero_toren_ability",
  grak: "hero_grak_ability",
  morna: "hero_morna_ability",
});

const TOWER_HIT_CUES: Readonly<Record<TowerType, AudioCueId>> = Object.freeze({
  ranger: "tower_ranger_hit",
  frost: "tower_frost_hit",
  ember: "tower_ember_hit",
  storm: "tower_storm_hit",
});

export function audioCuesForSimulationEvent(event: SimulationEvent): readonly AudioCueId[] {
  switch (event.type) {
    case "boss_spawned": return one("boss_arrival");
    case "hero_attack": return one(HERO_ATTACK_CUES[event.heroId]);
    case "enemy_attacked_hero": return one("hero_hit");
    case "hero_knocked_out": return one("hero_knockout");
    case "hero_respawned": return one("hero_respawn");
    case "hero_upgraded": return one("hero_rank_up");
    case "hero_ability": return one(HERO_ABILITY_CUES[event.heroId]);
    case "hero_ability_recharged": return one("hero_recharge");
    case "hero_barrier_created":
    case "hero_barrier_blocked": return one("hero_barrier");
    case "gate_shield_absorbed": return one("gate_shield");
    case "projectile_hit": return one(TOWER_HIT_CUES[event.towerType]);
    case "lightning": return one("storm_chain");
    case "titan_summon": return one("boss_arrival");
    case "enemy_killed": return one(
      event.enemyType === "boss" || event.enemyType === "titan" ? "boss_defeat" : "enemy_defeat",
    );
    case "enemy_leaked": return event.damage > 0 ? one("gate_hit") : NO_CUES;
    case "wave_cleared": return one("wave_clear");
    case "northern_avalanche": return one("avalanche");
    case "terminal": return one(event.outcome === "victory" ? "victory" : "defeat");
    default: return NO_CUES;
  }
}

export function audioCuesForSimulationEvents(events: readonly SimulationEvent[]): readonly AudioCueId[] {
  const suppressWaveClear = events.some((event) => event.type === "terminal" && event.outcome === "victory");
  return events.flatMap((event) => (
    suppressWaveClear && event.type === "wave_cleared" ? NO_CUES : audioCuesForSimulationEvent(event)
  ));
}

function one(cue: AudioCueId): readonly AudioCueId[] {
  return [cue];
}
