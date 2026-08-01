import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { translations } from "../src/i18n.ts";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const tutorial = readFileSync(new URL("../src/game/tutorial.ts", import.meta.url), "utf8");
const scene = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("first-run guidance stays contextual, skippable, and outside run persistence", () => {
  assert.match(html, /id="tutorial-coach"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);
  assert.match(html, /id="tutorial-skip"[^>]*type="button"/);
  assert.doesNotMatch(html.match(/<aside id="tutorial-coach"[\s\S]*?<\/aside>/)?.[0] ?? "", /aria-modal/);
  assert.match(main, /initialBuildType: tutorialState\.step === "choose_tower" \? null : undefined/);
  assert.match(scene, /initialBuildType === undefined \? "ranger" : initialBuildType/);
  assert.match(main, /reduceTutorial\(tutorialState, \{ type: "tower_selected" \}\)/);
  assert.match(main, /writeFlag\(storage, TUTORIAL_COMPLETION_STORAGE_KEY\)/);
  assert.match(css, /\.tutorial-coach button \{[^}]*min-height:\s*44px;/s);
  assert.match(css, /\.tutorial-focus \{[^}]*tutorial-focus-pulse/s);
  assert.doesNotMatch(tutorial, /localStorage|sessionStorage|getItem\(|setItem\(/);
});

test("wave preview opens a keyboard-friendly scout report based on actual WavePlan stats", () => {
  assert.match(html, /id="wave-intel-button"[^>]*aria-controls="wave-intel-overlay"[^>]*aria-expanded="false"/);
  assert.match(html, /id="wave-intel-overlay"[^>]*hidden[\s\S]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="wave-intel-tabs"[^>]*role="tablist"/);
  assert.match(main, /aggregateWaveEnemies\(plan\)/);
  assert.match(main, /formatEnemyStat\(enemy, \(\{ maxHp \}\) => maxHp\)/);
  assert.match(main, /setPaused\(true\)[\s\S]*resumeAfterWaveIntel[\s\S]*setPaused\(false\)/);
  assert.match(main, /\["ArrowLeft", "ArrowRight", "Home", "End"\]/);
  assert.match(css, /\.wave-intel-tab \{[^}]*min-height:\s*48px;/s);
});

test("result screen keeps server score internal and gives durable run stats plus actionable advice", () => {
  for (const id of ["result-waves", "result-duration", "result-kills", "result-run-summary", "result-advice-body"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(main, /savePendingResult\([\s\S]*completedWaves,[\s\S]*summary,[\s\S]*currentRunRevision\(\)/);
  assert.match(main, /elements\.resultDuration\.textContent = formatLeaderboardDuration\(result\.durationMs\)/);
  assert.match(main, /deriveResultAdvice\(resolveResultWavePlan\(adviceWave\)/);
  assert.match(main, /pending\.summary/);
  assert.doesNotMatch(main, /elements\.resultScore\.textContent = text\(selectedSession\.mode\.resultSummaryKey/);
  assert.match(html, /class="modal-card result-card"[^>]*role="dialog"[^>]*tabindex="-1"/);
  assert.match(main, /elements\.resultCard\.focus\(\{ preventScroll: true \}\)/);
  assert.match(css, /\.result-stats \{[^}]*repeat\(3,/s);

  for (const locale of Object.keys(translations)) {
    assert.ok(translations[locale].result_advice_boss_body.includes("{wave}"));
    assert.ok(translations[locale].wave_intel_enemy_shaman.length >= 20);
    assert.ok(translations[locale].tutorial_start_wave_body.length >= 15);
  }
});
