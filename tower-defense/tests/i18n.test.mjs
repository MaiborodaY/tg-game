import assert from "node:assert/strict";
import test from "node:test";

import {
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  detectLocale,
  normalizeLocale,
  readStoredLocale,
  tr,
  writeStoredLocale,
} from "../src/i18n.ts";

test("locale normalization supports Telegram language variants and Russian fallback", () => {
  assert.equal(normalizeLocale("uk-UA"), "uk");
  assert.equal(normalizeLocale("UA"), "uk");
  assert.equal(normalizeLocale("en_US"), "en");
  assert.equal(normalizeLocale("pl"), null);
  assert.equal(tr("pl", "result_waves", { count: 4 }), "Отбито волн: 4");
  assert.equal(tr("en", "intro_waves", { count: 24 }), "24 waves");
  assert.equal(
    tr("ru", "result_summary", { waves: 13, total: 24, score: 31 }),
    "Волны: 13 / 24 · Очки рейтинга: 31",
  );
  assert.equal(tr("uk", "tower_guide_button"), "Довідка про вежі");
  assert.equal(tr("ru", "fullscreen_enter"), "Развернуть на весь экран");
  assert.equal(tr("uk", "fullscreen_exit"), "Вийти з повноекранного режиму");
  assert.equal(tr("en", "fullscreen_exit"), "Exit fullscreen");
  assert.equal(tr("ru", "tower_storm"), "Грозовой шпиль");
  assert.equal(tr("uk", "enemy_titan"), "Титан розлому");
  assert.equal(tr("ru", "run_resumed", { wave: 3 }), "Продолжаем защиту: следующая волна — 3");
  assert.match(tr("uk", "run_resume_unavailable"), /локальне збереження/);
  assert.match(tr("en", "local_save_unavailable"), /Closing the game/);
  assert.equal(tr("ru", "run_replaced"), "Этот забег уже закрыт. Можно начать новый.");
  assert.equal(tr("ru", "profile_sync_pending"), "Результат сохранён, профиль обновится позже");
  assert.equal(tr("en", "profile_sync_retry"), "Update profile");
  assert.equal(tr("uk", "profile_sync_retry_failed"), "Нагороду збережено, профіль поки не оновлено");
  assert.equal(tr("ru", "game_loading"), "Загружаем поле…");
  assert.match(tr("uk", "game_load_failed"), /перезавантаж гру/);
  assert.equal(tr("en", "game_load_retry"), "Reload game");
  assert.equal(tr("ru", "hero_eira_ability"), "Метка охотницы");
  assert.equal(tr("uk", "hero_toren_role"), "Вартовий проти натовпу");
  assert.equal(tr("ru", "hero_grak_ability"), "Знамя ярости");
  assert.equal(tr("en", "hero_picker_title"), "Choose a hero");
  assert.equal(tr("en", "hero_ability_ready", { ability: "Hunter's Mark" }), "Ability ready: Hunter's Mark");
  assert.equal(tr("ru", "hero_ability_no_target"), "Нет врагов в радиусе героя");
  assert.equal(detectLocale("uk-UA"), "uk");
});

test("the unified menu and restart confirmation are localized in Russian, Ukrainian, and English", () => {
  const keys = [
    "game_menu",
    "game_menu_continue",
    "game_menu_restart",
    "game_menu_restart_confirm",
    "game_menu_restart_confirm_copy",
    "game_menu_restart_unavailable",
    "game_menu_hero_details",
    "game_menu_session",
    "game_menu_language",
    "game_menu_fullscreen",
    "game_menu_tower_guide",
    "hero_detail_rank",
    "hero_detail_attack",
    "hero_detail_passive",
    "hero_detail_ability",
    "hero_detail_awakening",
    "hero_awakening_requirement",
    "hero_awakening_unlocked",
    "hero_detail_next_upgrade",
    "hero_placement_hint",
    "hero_aura_unlock",
    "hero_eira_aura_status",
    "hero_toren_aura_status",
    "hero_grak_aura_status",
    "hero_grak_unlock_requirement",
    "hero_grak_locked",
    "hero_grak_unlocked",
    "hero_ability_ready_charges",
    "hero_ability_recharge",
    "hero_ability_target_road",
    "hero_ability_target_cancel",
    "hero_gate_shield",
    "daily_attempt_limit_title",
    "daily_attempt_limit_body",
    "daily_attempt_limit_action",
    "daily_attempt_reset_action",
    "daily_attempt_admin_reset_action",
    "daily_attempt_resetting",
    "daily_attempt_reset_failed",
    "daily_attempt_purchase_body",
    "daily_attempt_purchase_action",
    "daily_attempt_purchase_source",
    "daily_attempt_purchase_balance",
    "daily_attempt_purchase_eyebrow",
    "daily_attempt_purchase_title",
    "daily_attempt_purchase_confirm_copy",
    "daily_attempt_purchase_cancel",
    "daily_attempt_purchase_confirm",
    "daily_attempt_purchase_loading",
    "daily_attempt_purchase_loading_detail",
    "daily_attempt_purchase_success",
    "daily_attempt_purchase_insufficient",
    "daily_attempt_purchase_retry",
    "daily_attempt_purchase_pending",
    "daily_attempt_purchase_available",
    "daily_attempt_purchase_retry_action",
  ];
  const params = {
    rank: 2,
    count: 2,
    wave: 4,
    cost: 150,
    hero: "Eira",
    ability: "Hunter's Mark",
    damage: 10,
    range: 120,
    percent: 8,
    bonus: 8,
    global: 8,
    local: 20,
    slow: 14,
    shield: 2,
    current: 1,
    max: 2,
    total: 25,
    duration: 6,
    effect: "aura +8%",
    balance: 17,
  };

  for (const locale of ["ru", "uk", "en"]) {
    for (const key of keys) {
      const value = tr(locale, key, params);
      assert.ok(value.trim().length >= 2, `${locale}.${key} must not be empty`);
      assert.doesNotMatch(value, /\{[a-zA-Z0-9_]+\}/, `${locale}.${key} has an unresolved placeholder`);
    }
  }

  assert.match(tr("ru", "game_menu_restart_confirm_copy"), /прогресс|забег/ui);
  assert.match(tr("uk", "game_menu_restart_confirm_copy"), /прогрес|забіг/ui);
  assert.match(tr("en", "game_menu_restart_confirm_copy"), /progress|run/i);
  assert.equal(tr("en", "daily_attempt_limit_body"), "You have used all 5 attempts. Come back tomorrow.");
  assert.equal(tr("en", "daily_attempt_reset_action"), "Reset attempts");
  assert.match(tr("ru", "daily_attempt_purchase_action"), /5.*5/u);
  assert.match(tr("uk", "daily_attempt_purchase_insufficient", { balance: 3 }), /5.*3/u);
  assert.match(tr("en", "daily_attempt_purchase_retry"), /not be charged twice/i);
});

test("both campaigns and the Northern Pass mechanic have complete localized mission copy", () => {
  const keys = [
    "mission_preview_label",
    "mission_difficulty_label",
    "mission_starting_gold_label",
    "mission_starting_lives_label",
    "mission_trait_label",
    "mission_forest_eyebrow",
    "mission_forest_title",
    "mission_forest_body",
    "mission_forest_difficulty",
    "mission_forest_trait",
    "mission_forest_trait_body",
    "mission_forest_cta",
    "mission_northern_eyebrow",
    "mission_northern_title",
    "mission_northern_body",
    "mission_northern_difficulty",
    "mission_northern_trait",
    "mission_northern_trait_body",
    "mission_northern_cta",
    "northern_act_1",
    "northern_act_2",
    "northern_act_3",
    "northern_boss_act_1",
    "northern_boss_act_2",
    "northern_boss_act_3",
    "frost_armor",
    "frost_armor_description",
    "frost_armor_broken",
    "wave_trait_frost",
    "wave_intel_trait_frost_armor",
    "warm_beacon",
    "warm_beacon_active",
    "warm_beacon_hint",
    "northern_onboarding_title",
    "northern_onboarding_body",
    "northern_onboarding_armor_title",
    "northern_onboarding_armor_body",
  ];

  for (const locale of ["ru", "uk", "en"]) {
    for (const key of keys) {
      assert.ok(tr(locale, key).trim().length >= 3, `${locale}.${key} must not be empty`);
    }
    assert.match(tr(locale, "mission_northern_eyebrow"), /II/i);
    assert.match(tr(locale, "northern_onboarding_body"), /3|тр[её]х|трьох|three/ui);
    assert.ok(tr(locale, "frost_armor_description").length >= 55);
    assert.match(tr(locale, "hero_awakening_requirement", { wave: 14 }), /14/);
  }

  assert.match(tr("ru", "mission_northern_trait_body"), /героя.*огн/ui);
  assert.match(tr("uk", "frost_armor_description"), /Іскромант/ui);
  assert.match(tr("en", "warm_beacon_hint"), /hero.*fire/i);
});

test("all heroes explain attack, rank-two passive, and ability in every locale", () => {
  for (const locale of ["ru", "uk", "en"]) {
    for (const hero of ["eira", "toren", "grak"]) {
      const attack = tr(locale, `hero_${hero}_attack_text`);
      const passive = tr(locale, `hero_${hero}_passive_text`);
      const ability = tr(locale, `hero_${hero}_ability_text`);
      assert.ok(attack.trim().length >= 12, `${locale}.${hero} attack needs explanatory copy`);
      assert.ok(passive.trim().length >= 12, `${locale}.${hero} passive needs explanatory copy`);
      assert.ok(ability.trim().length >= 12, `${locale}.${hero} ability needs explanatory copy`);
      assert.match(passive, /2/u, `${locale}.${hero} passive must state its rank-two unlock`);
    }
  }

  assert.match(tr("ru", "hero_eira_passive_text"), /с ранга 2/ui);
  assert.match(tr("ru", "hero_toren_passive_text"), /с ранга 2/ui);
  assert.match(tr("ru", "hero_grak_passive_text"), /с ранга 2/ui);
  assert.match(tr("uk", "hero_eira_passive_text"), /ранг/ui);
  assert.match(tr("uk", "hero_toren_passive_text"), /ранг/ui);
  assert.match(tr("uk", "hero_grak_passive_text"), /ранг/ui);
  assert.match(tr("en", "hero_eira_passive_text"), /rank\s*2/i);
  assert.match(tr("en", "hero_toren_passive_text"), /rank\s*2/i);
  assert.match(tr("en", "hero_grak_passive_text"), /rank\s*2/i);
  for (const locale of ["ru", "uk", "en"]) {
    assert.match(tr(locale, "hero_grak_ability_text"), /18%/);
    assert.match(tr(locale, "hero_grak_ability_text"), /15%/);
  }
  assert.notEqual(tr("en", "hero_eira_attack_text"), tr("en", "hero_toren_attack_text"));
  assert.notEqual(tr("en", "hero_eira_ability_text"), tr("en", "hero_toren_ability_text"));
});

test("hero awakenings and compact tower roles are explicit in every locale", () => {
  for (const locale of ["ru", "uk", "en"]) {
    for (const hero of ["eira", "toren", "grak"]) {
      const awakening = tr(locale, `hero_${hero}_awakening_text`);
      assert.match(awakening, /25/);
      assert.ok(awakening.length >= 80, `${locale}.${hero} awakening needs full mechanics`);
    }
    for (const tower of ["ranger", "frost", "ember", "storm"]) {
      assert.ok(tr(locale, `tower_role_${tower}`).length >= 18, `${locale}.${tower} role needs actionable copy`);
    }
  }

  assert.match(tr("ru", "tower_role_ranger"), /IV.*босс/ui);
  assert.match(tr("ru", "tower_role_frost"), /1–2/u);
  assert.match(tr("ru", "tower_role_ember"), /не складывается/ui);
  assert.match(tr("ru", "tower_role_storm"), /игнорирует защиту/ui);
});

test("manual locale storage is persistent and fails closed", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.deepEqual(LOCALE_LABELS, { ru: "RU", uk: "UA", en: "EN" });
  assert.equal(readStoredLocale(storage), null);
  assert.equal(writeStoredLocale(storage, "en"), true);
  assert.equal(values.get(LOCALE_STORAGE_KEY), "en");
  assert.equal(readStoredLocale(storage), "en");

  const blockedStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  assert.equal(readStoredLocale(blockedStorage), null);
  assert.equal(writeStoredLocale(blockedStorage, "uk"), false);
});
