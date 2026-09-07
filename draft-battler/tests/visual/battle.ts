import { mountBattlefield, type BattleAbilityCalloutLabels } from "../../src/rendering/phaserBattleScene";
import { getUiCopy } from "../../src/i18n";
import { createVisualBattleFixture, holdVisualBattleFormation } from "./battleFixture";

// This entry point lives under tests and is never imported by the production app.
const copy = getUiCopy("ru");
const abilityCalloutLabels: BattleAbilityCalloutLabels = {
  battle_banner: copy.battleCalloutBanner,
  thorn_guard: copy.battleCalloutThorns,
  pack_hunter: copy.battleCalloutPack,
  frost_hex: copy.battleCalloutFrost,
  shield_wall: copy.battleCalloutArmor,
  stone_skin: copy.battleCalloutArmor,
  riposte: copy.battleCalloutArmor,
  synergy_undead_4: copy.battleCalloutUndeadMastery,
  bone_pact: copy.battleCalloutBonePact,
  poison_bite: copy.battleCalloutPoison,
  poison_tick: copy.battleCalloutPoisonTick,
  armor_corrosion: copy.battleCalloutCorrosion,
  bodyguard: copy.battleCalloutBodyguard,
  phantom_parry: copy.battleCalloutParry,
  counter: copy.battleCalloutCounter,
  piercing_bolt: copy.battleCalloutPierce,
  frost_delay: copy.battleCalloutDelay,
  moon_chorus: copy.battleCalloutMoon,
  threat_sight: copy.battleCalloutThreat,
};

const battlefield = mountBattlefield(element("battlefield"));
const status = element("status");
const motionButton = element("motion");
const speedButton = element("speed");
let reducedMotion = false;
let speed: 1 | 2 = 1;

function replay(holdFormation = false): void {
  const fixture = createVisualBattleFixture();
  const timeline = holdFormation ? holdVisualBattleFormation(fixture.timeline) : fixture.timeline;
  status.textContent = `${holdFormation ? "Расстановка 6×6 · пауза 15 с при ×1" : "Бой 6×6"} · ×${speed}${reducedMotion ? " · меньше движения" : ""}`;
  battlefield.setBattleSpeed(speed);
  battlefield.playBattle({
    timeline,
    abilityCalloutLabels,
    blockLabel: copy.blockFeedback,
    reducedMotion,
    onFinished: () => {
      status.textContent = `Бой завершён · ${timeline.winner} · можно повторить 6×6`;
    },
    onError: (error) => {
      console.error("Visual battle fixture failed", error);
      status.textContent = `Ошибка отрисовки: ${String(error)}`;
    },
  });
}

element("replay").addEventListener("click", () => replay());
element("formation").addEventListener("click", () => replay(true));
motionButton.addEventListener("click", () => {
  reducedMotion = !reducedMotion;
  motionButton.setAttribute("aria-pressed", String(reducedMotion));
  replay();
});
speedButton.addEventListener("click", () => {
  speed = speed === 1 ? 2 : 1;
  speedButton.textContent = `Скорость ×${speed}`;
  speedButton.setAttribute("aria-pressed", String(speed === 2));
  battlefield.setBattleSpeed(speed);
  status.textContent = `Скорость ×${speed}${reducedMotion ? " · меньше движения" : ""}`;
});
element("skip").addEventListener("click", () => {
  if (!battlefield.skipBattle()) status.textContent = "Нет активного боя. Нажмите «Повторить 6×6».";
});
for (const backdrop of ["game", "menu"] as const) {
  element(backdrop).addEventListener("click", () => {
    battlefield.showDraft({ playerCastleHp: 20, enemyCastleHp: 20, backdrop });
    status.textContent = backdrop === "game" ? "Игровой фон · пустое поле" : "Фон меню · пустое поле";
  });
}

window.addEventListener("pagehide", () => battlefield.destroy(), { once: true });
replay();

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing visual fixture element: ${id}`);
  return found;
}
