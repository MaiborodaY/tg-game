export type FarmPawsLang = "ru" | "uk" | "en";

const RU_TEXTS = {
  start_eyebrow: "Прогулка питомца",
  app_title: "Фермерские лапки",
  start_lead: "Запомни маршрут питомца по грядкам и повтори его.",
  start_busy: "⏳ Стартуем",
  start_play: "▶️ Играть",
  best_result: "Лучший результат: {{score}}",
  run_finished: "Забег окончен",
  round_title: "Раунд {{round}}",
  score_unit: "урожай",
  stats_label: "Статистика забега",
  round_label: "Раунд",
  record_label: "Рекорд",
  lives_label: "Жизни",
  default_pet: "Питомец",
  grid_label: "Грядки",
  pet_guide_label: "Питомец помогает запомнить маршрут",
  result_title: "Урожай спасён: {{score}}",
  hearts_ended: "Сердечки закончились.",
  retry_button: "🔁 Ещё раз",
  home_button: "🏠 В дом",
  plot_label: "Грядка {{number}}",
  local_run_toast: "Игра запущена локально. Награда не начислится.",
  status_watch: "Смотри {{step}}/{{total}}",
  status_correct: "Верно",
  status_error: "Ошибка",
  status_minus_heart: "Минус сердце {{hp}}/{{maxHp}}",
  status_repeat: "Повтори {{step}}/{{total}}",
  reward_saving: "Сохраняем результат...",
  reward_ok: "Питомец получил +{{xp}} XP",
  reward_not_saved: "Результат не сохранён, награда не начислена",
  reward_local: "Локальный режим: награда не начисляется",
  close_hint: "Закрой мини-игру, чтобы вернуться домой.",
  blocked_daily_limit: "Лимит прогулок на сегодня исчерпан{{attempts}}. Новые попытки будут в 00:00 UTC.",
  blocked_no_pet: "Сначала нужен питомец. Открой меню питомца в боте.",
  blocked_pet_dead: "Питомец не может гулять. Открой меню питомца в боте.",
  blocked_pet_changed: "Питомец изменился. Закрой мини-игру и открой прогулку заново из бота.",
  blocked_not_enough_energy: "Не хватает энергии для прогулки.",
  blocked_default: "Сейчас прогулку начать нельзя. Открой меню питомца и попробуй позже."
} as const;

export type FarmPawsTextKey = keyof typeof RU_TEXTS;

const TEXTS: Record<FarmPawsLang, Record<FarmPawsTextKey, string>> = {
  ru: RU_TEXTS,
  uk: {
    start_eyebrow: "Прогулянка улюбленця",
    app_title: "Фермерські лапки",
    start_lead: "Запам'ятай маршрут улюбленця грядками й повтори його.",
    start_busy: "⏳ Стартуємо",
    start_play: "▶️ Грати",
    best_result: "Найкращий результат: {{score}}",
    run_finished: "Забіг завершено",
    round_title: "Раунд {{round}}",
    score_unit: "урожай",
    stats_label: "Статистика забігу",
    round_label: "Раунд",
    record_label: "Рекорд",
    lives_label: "Життя",
    default_pet: "Улюбленець",
    grid_label: "Грядки",
    pet_guide_label: "Улюбленець допомагає запам'ятати маршрут",
    result_title: "Урожай врятовано: {{score}}",
    hearts_ended: "Сердечка закінчилися.",
    retry_button: "🔁 Ще раз",
    home_button: "🏠 Додому",
    plot_label: "Грядка {{number}}",
    local_run_toast: "Гру запущено локально. Нагороду не буде нараховано.",
    status_watch: "Дивись {{step}}/{{total}}",
    status_correct: "Вірно",
    status_error: "Помилка",
    status_minus_heart: "Мінус серце {{hp}}/{{maxHp}}",
    status_repeat: "Повтори {{step}}/{{total}}",
    reward_saving: "Зберігаємо результат...",
    reward_ok: "Улюбленець отримав +{{xp}} XP",
    reward_not_saved: "Результат не збережено, нагороду не нараховано",
    reward_local: "Локальний режим: нагороду не нараховано",
    close_hint: "Закрий міні-гру, щоб повернутися додому.",
    blocked_daily_limit: "Ліміт прогулянок на сьогодні вичерпано{{attempts}}. Нові спроби будуть о 00:00 UTC.",
    blocked_no_pet: "Спочатку потрібен улюбленець. Відкрий меню улюбленця в боті.",
    blocked_pet_dead: "Улюбленець не може гуляти. Відкрий меню улюбленця в боті.",
    blocked_pet_changed: "Улюбленець змінився. Закрий міні-гру й відкрий прогулянку заново з бота.",
    blocked_not_enough_energy: "Не вистачає енергії для прогулянки.",
    blocked_default: "Зараз прогулянку почати не можна. Відкрий меню улюбленця і спробуй пізніше."
  },
  en: {
    start_eyebrow: "Pet walk",
    app_title: "Farm Paws",
    start_lead: "Remember your pet's route across the garden beds and repeat it.",
    start_busy: "⏳ Starting",
    start_play: "▶️ Play",
    best_result: "Best result: {{score}}",
    run_finished: "Run finished",
    round_title: "Round {{round}}",
    score_unit: "harvest",
    stats_label: "Run stats",
    round_label: "Round",
    record_label: "Record",
    lives_label: "Lives",
    default_pet: "Pet",
    grid_label: "Garden beds",
    pet_guide_label: "Your pet helps you remember the route",
    result_title: "Harvest saved: {{score}}",
    hearts_ended: "No hearts left.",
    retry_button: "🔁 Again",
    home_button: "🏠 Home",
    plot_label: "Garden bed {{number}}",
    local_run_toast: "Game started locally. No reward will be granted.",
    status_watch: "Watch {{step}}/{{total}}",
    status_correct: "Correct",
    status_error: "Mistake",
    status_minus_heart: "Heart lost {{hp}}/{{maxHp}}",
    status_repeat: "Repeat {{step}}/{{total}}",
    reward_saving: "Saving result...",
    reward_ok: "Pet received +{{xp}} XP",
    reward_not_saved: "Result was not saved, reward was not granted",
    reward_local: "Local mode: no reward is granted",
    close_hint: "Close the mini-game to return home.",
    blocked_daily_limit: "Today's walk limit is used up{{attempts}}. New attempts unlock at 00:00 UTC.",
    blocked_no_pet: "You need a pet first. Open the pet menu in the bot.",
    blocked_pet_dead: "Your pet cannot walk. Open the pet menu in the bot.",
    blocked_pet_changed: "Your pet changed. Close the mini-game and open the walk again from the bot.",
    blocked_not_enough_energy: "Not enough energy for a walk.",
    blocked_default: "The walk cannot be started now. Open the pet menu and try again later."
  }
};

export function normalizeFarmPawsLang(value: unknown): FarmPawsLang {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "ua") return "uk";
  if (raw === "ru" || raw === "uk" || raw === "en") return raw;
  return "ru";
}

export function initialFarmPawsLang(): FarmPawsLang {
  try {
    return normalizeFarmPawsLang(new URLSearchParams(window.location.search).get("lang"));
  } catch {
    return "ru";
  }
}

export function tfp(
  lang: FarmPawsLang,
  key: FarmPawsTextKey,
  vars: Record<string, string | number> = {}
): string {
  const template = TEXTS[normalizeFarmPawsLang(lang)]?.[key] || TEXTS.ru[key] || key;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name) => String(vars[name] ?? ""));
}
