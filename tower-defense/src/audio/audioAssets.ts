import forestGateAmbienceUrl from "../assets/audio/music/forest-gate-ambience.mp3";
import northernPassAmbienceUrl from "../assets/audio/music/northern-pass-ambience.mp3";
import bossIntroUrl from "../assets/audio/music/boss-intro.mp3";
import bossBattleUrl from "../assets/audio/music/boss-battle.mp3";
import avalancheUrl from "../assets/audio/sfx/avalanche.mp3";
import bossArrivalUrl from "../assets/audio/sfx/boss-arrival.mp3";
import bossDefeatUrl from "../assets/audio/sfx/boss-defeat.mp3";
import buildUrl from "../assets/audio/sfx/build.mp3";
import defeatUrl from "../assets/audio/sfx/defeat.mp3";
import emberHit1Url from "../assets/audio/sfx/ember-hit-1.mp3";
import emberHit2Url from "../assets/audio/sfx/ember-hit-2.mp3";
import enemyDefeat1Url from "../assets/audio/sfx/enemy-defeat-1.mp3";
import enemyDefeat2Url from "../assets/audio/sfx/enemy-defeat-2.mp3";
import frostHit1Url from "../assets/audio/sfx/frost-hit-1.mp3";
import frostHit2Url from "../assets/audio/sfx/frost-hit-2.mp3";
import gateHitUrl from "../assets/audio/sfx/gate-hit.mp3";
import gateShieldUrl from "../assets/audio/sfx/gate-shield.mp3";
import heroBarrierUrl from "../assets/audio/sfx/hero-barrier.mp3";
import heroEiraAbilityUrl from "../assets/audio/sfx/hero-eira-ability.mp3";
import heroEiraAttackUrl from "../assets/audio/sfx/hero-eira-attack.mp3";
import heroGrakAbilityUrl from "../assets/audio/sfx/hero-grak-ability.mp3";
import heroGrakAttackUrl from "../assets/audio/sfx/hero-grak-attack.mp3";
import heroHitUrl from "../assets/audio/sfx/hero-hit.mp3";
import heroKnockoutUrl from "../assets/audio/sfx/hero-knockout.mp3";
import heroRechargeUrl from "../assets/audio/sfx/hero-recharge.mp3";
import heroRespawnUrl from "../assets/audio/sfx/hero-respawn.mp3";
import heroTorenAbilityUrl from "../assets/audio/sfx/hero-toren-ability.mp3";
import heroTorenAttackUrl from "../assets/audio/sfx/hero-toren-attack.mp3";
import rangerHit1Url from "../assets/audio/sfx/ranger-hit-1.mp3";
import rangerHit2Url from "../assets/audio/sfx/ranger-hit-2.mp3";
import sellUrl from "../assets/audio/sfx/sell.mp3";
import stormHit1Url from "../assets/audio/sfx/storm-hit-1.mp3";
import stormHit2Url from "../assets/audio/sfx/storm-hit-2.mp3";
import uiConfirmUrl from "../assets/audio/sfx/ui-confirm.mp3";
import uiErrorUrl from "../assets/audio/sfx/ui-error.mp3";
import uiSelectUrl from "../assets/audio/sfx/ui-select.mp3";
import uiToggleUrl from "../assets/audio/sfx/ui-toggle.mp3";
import upgradeUrl from "../assets/audio/sfx/upgrade.mp3";
import victoryUrl from "../assets/audio/sfx/victory.mp3";
import waveClearUrl from "../assets/audio/sfx/wave-clear.mp3";
import waveStartUrl from "../assets/audio/sfx/wave-start.mp3";
import type { AudioLibrary, AudioSampleId, MusicPlayback } from "./audioCatalog.ts";

const sampleUrls = Object.freeze({
  avalanche: avalancheUrl,
  bossArrival: bossArrivalUrl,
  bossDefeat: bossDefeatUrl,
  build: buildUrl,
  defeat: defeatUrl,
  emberHit1: emberHit1Url,
  emberHit2: emberHit2Url,
  enemyDefeat1: enemyDefeat1Url,
  enemyDefeat2: enemyDefeat2Url,
  frostHit1: frostHit1Url,
  frostHit2: frostHit2Url,
  gateHit: gateHitUrl,
  gateShield: gateShieldUrl,
  heroBarrier: heroBarrierUrl,
  heroEiraAbility: heroEiraAbilityUrl,
  heroEiraAttack: heroEiraAttackUrl,
  heroGrakAbility: heroGrakAbilityUrl,
  heroGrakAttack: heroGrakAttackUrl,
  heroHit: heroHitUrl,
  heroKnockout: heroKnockoutUrl,
  heroRecharge: heroRechargeUrl,
  heroRespawn: heroRespawnUrl,
  heroTorenAbility: heroTorenAbilityUrl,
  heroTorenAttack: heroTorenAttackUrl,
  rangerHit1: rangerHit1Url,
  rangerHit2: rangerHit2Url,
  sell: sellUrl,
  stormHit1: stormHit1Url,
  stormHit2: stormHit2Url,
  uiConfirm: uiConfirmUrl,
  uiError: uiErrorUrl,
  uiSelect: uiSelectUrl,
  uiToggle: uiToggleUrl,
  upgrade: upgradeUrl,
  victory: victoryUrl,
  waveClear: waveClearUrl,
  waveStart: waveStartUrl,
} satisfies Record<AudioSampleId, string>);

const music = Object.freeze({
  forest: Object.freeze({ id: "forest", loopUrl: forestGateAmbienceUrl, volume: 0.27, crossfadeMs: 900 }),
  northern: Object.freeze({ id: "northern", loopUrl: northernPassAmbienceUrl, volume: 0.25, crossfadeMs: 900 }),
  boss: Object.freeze({ id: "boss", introUrl: bossIntroUrl, loopUrl: bossBattleUrl, volume: 0.34, crossfadeMs: 650 }),
} satisfies Record<"forest" | "northern" | "boss", MusicPlayback>);

export const AUDIO_LIBRARY: AudioLibrary = Object.freeze({
  sampleUrls,
  effectUrls: Object.freeze([...new Set(Object.values(sampleUrls))]),
  music,
});
