export type RunnerLang = "ru" | "uk" | "en";

const RU_TEXTS = {
  app_eyebrow: "Бегущие лапки",
  app_title: "Фермерский забег",
  back_to_games: "← К играм",
  preview_heading: "Лапки на старт!",
  preview_body: "Помоги питомцу собрать урожай и пробежать по ферме как можно дальше.",
  controls_heading: "Как играть",
  control_single_tap: "Один тап — прыжок",
  control_double_tap: "Ещё один тап в воздухе — второй прыжок",
  goals_heading: "Цель забега",
  goal_harvest: "Собирай урожай и удерживай комбо",
  goal_dodge: "Уклоняйся от ящиков, снопов, луж и ворон",
  start_run: "▶️ Начать забег",
  preview_best: "Лучший результат: {{score}}",
  tap_hint: "Тап — прыжок · ещё тап — двойной",
  leave_confirm: "Забег или сохранение ещё не закончены. Всё равно уйти?",
  hud_score: "Счёт",
  hud_record: "Рекорд",
  hud_crops: "Урожай",
  hud_combo: "Комбо",
  powerup_shield: "Щит",
  powerup_shield_hint: "Защитит от одного столкновения",
  powerup_magnet: "Магнит",
  powerup_magnet_hint: "Притянет урожай поблизости",
  pause: "⏸ Пауза",
  resume: "▶️ Продолжить",
  status_ready: "Приготовься…",
  status_watch: "Смотри вперёд!",
  countdown_go: "Вперёд!",
  game_over: "Забег окончен",
  new_record: "Новый рекорд: {{score}}!",
  result_heading: "Итоги забега",
  result_summary: "Счёт {{score}} · время {{time}} · урожай {{crops}} · комбо ×{{combo}}",
  result_score: "Счёт: {{score}}",
  result_time: "Время: {{time}}",
  result_crops: "Собрано урожая: {{crops}}",
  result_best_combo: "Лучшее комбо: ×{{combo}}",
  result_cause_obstacle: "Причина: столкновение с препятствием",
  reward_saving: "Сохраняем результат…",
  reward_saved: "Результат сохранён. Награда уже у питомца!",
  reward_already_saved: "Эта попытка уже была сохранена на сервере.",
  reward_local: "Тренировочный забег: награда не начисляется.",
  reward_failed: "Не удалось сохранить награду. Не закрывай игру и попробуй ещё раз.",
  reward_launch_invalid: "Ссылка на награду повреждена или неполная. Открой игру заново из бота.",
  reward_retry: "↻ Повторить сохранение",
  result_time_label: "Время",
  result_crops_label: "Урожай",
  result_combo_label: "Лучшее комбо",
  share_score: "Поделиться счётом",
  practice_note: "Награда доступна только за первый забег. Следующий забег — тренировочный.",
  close_hint: "Закрой мини-игру, чтобы вернуться в бот.",
  replay: "🔁 Ещё раз · новая попытка",
  practice_replay: "↻ Повторить тренировку",
  home: "🏠 В дом",
  a11y_game: "Игровое поле фермерского забега",
  a11y_jump: "Прыгнуть",
  a11y_pause: "Поставить забег на паузу",
  a11y_resume: "Продолжить забег",
  a11y_back_to_games: "Вернуться к списку игр",
  a11y_score: "Счёт: {{score}}",
  a11y_crops: "Собрано урожая: {{crops}}",
  a11y_combo: "Комбо: {{combo}}",
  a11y_powerups: "Активные бонусы",
  a11y_shield_active: "Щит активен",
  a11y_magnet_active: "Магнит активен",
  a11y_results: "Итоги фермерского забега"
} as const;

export type RunnerTextKey = keyof typeof RU_TEXTS;
export type RunnerTextVariable = "score" | "time" | "crops" | "combo";
export type RunnerTextVariables = Partial<Record<RunnerTextVariable, string | number>>;

export const RUNNER_TEXTS = {
  ru: RU_TEXTS,
  uk: {
    app_eyebrow: "Бігучі лапки",
    app_title: "Фермерський забіг",
    back_to_games: "← До ігор",
    preview_heading: "Лапки на старт!",
    preview_body: "Допоможи улюбленцю зібрати врожай і пробігти фермою якомога далі.",
    controls_heading: "Як грати",
    control_single_tap: "Один тап — стрибок",
    control_double_tap: "Ще один тап у повітрі — другий стрибок",
    goals_heading: "Мета забігу",
    goal_harvest: "Збирай урожай і втримуй комбо",
    goal_dodge: "Ухиляйся від ящиків, снопів, калюж і ворон",
    start_run: "▶️ Почати забіг",
    preview_best: "Найкращий результат: {{score}}",
    tap_hint: "Тап — стрибок · ще тап — подвійний",
    leave_confirm: "Забіг або збереження ще не завершені. Усе одно вийти?",
    hud_score: "Рахунок",
    hud_record: "Рекорд",
    hud_crops: "Урожай",
    hud_combo: "Комбо",
    powerup_shield: "Щит",
    powerup_shield_hint: "Захистить від одного зіткнення",
    powerup_magnet: "Магніт",
    powerup_magnet_hint: "Притягне врожай поблизу",
    pause: "⏸ Пауза",
    resume: "▶️ Продовжити",
    status_ready: "Приготуйся…",
    status_watch: "Дивись уперед!",
    countdown_go: "Уперед!",
    game_over: "Забіг завершено",
    new_record: "Новий рекорд: {{score}}!",
    result_heading: "Підсумки забігу",
    result_summary: "Рахунок {{score}} · час {{time}} · урожай {{crops}} · комбо ×{{combo}}",
    result_score: "Рахунок: {{score}}",
    result_time: "Час: {{time}}",
    result_crops: "Зібрано врожаю: {{crops}}",
    result_best_combo: "Найкраще комбо: ×{{combo}}",
    result_cause_obstacle: "Причина: зіткнення з перешкодою",
    reward_saving: "Зберігаємо результат…",
    reward_saved: "Результат збережено. Нагорода вже в улюбленця!",
    reward_already_saved: "Цю спробу вже було збережено на сервері.",
    reward_local: "Тренувальний забіг: нагорода не нараховується.",
    reward_failed: "Не вдалося зберегти нагороду. Не закривай гру та спробуй ще раз.",
    reward_launch_invalid: "Посилання на нагороду пошкоджене або неповне. Відкрий гру знову з бота.",
    reward_retry: "↻ Повторити збереження",
    result_time_label: "Час",
    result_crops_label: "Урожай",
    result_combo_label: "Найкраще комбо",
    share_score: "Поділитися рахунком",
    practice_note: "Нагорода доступна лише за перший забіг. Наступний забіг — тренувальний.",
    close_hint: "Закрий мінігру, щоб повернутися до бота.",
    replay: "🔁 Ще раз · нова спроба",
    practice_replay: "↻ Повторити тренування",
    home: "🏠 Додому",
    a11y_game: "Ігрове поле фермерського забігу",
    a11y_jump: "Стрибнути",
    a11y_pause: "Поставити забіг на паузу",
    a11y_resume: "Продовжити забіг",
    a11y_back_to_games: "Повернутися до списку ігор",
    a11y_score: "Рахунок: {{score}}",
    a11y_crops: "Зібрано врожаю: {{crops}}",
    a11y_combo: "Комбо: {{combo}}",
    a11y_powerups: "Активні бонуси",
    a11y_shield_active: "Щит активний",
    a11y_magnet_active: "Магніт активний",
    a11y_results: "Підсумки фермерського забігу"
  },
  en: {
    app_eyebrow: "Running Paws",
    app_title: "Farm Run",
    back_to_games: "← Games",
    preview_heading: "Paws at the ready!",
    preview_body: "Help your pet gather the harvest and run as far across the farm as possible.",
    controls_heading: "How to play",
    control_single_tap: "One tap — jump",
    control_double_tap: "Tap again in the air — second jump",
    goals_heading: "Run goals",
    goal_harvest: "Gather crops and keep the combo going",
    goal_dodge: "Dodge crates, hay bales, puddles and crows",
    start_run: "▶️ Start run",
    preview_best: "Best result: {{score}}",
    tap_hint: "Tap to jump · tap again for a double jump",
    leave_confirm: "The run or its save is not finished. Leave anyway?",
    hud_score: "Score",
    hud_record: "Record",
    hud_crops: "Crops",
    hud_combo: "Combo",
    powerup_shield: "Shield",
    powerup_shield_hint: "Protects you from one collision",
    powerup_magnet: "Magnet",
    powerup_magnet_hint: "Pulls in nearby crops",
    pause: "⏸ Pause",
    resume: "▶️ Resume",
    status_ready: "Get ready…",
    status_watch: "Watch the trail ahead!",
    countdown_go: "Go!",
    game_over: "Run ended",
    new_record: "New record: {{score}}!",
    result_heading: "Run results",
    result_summary: "Score {{score}} · time {{time}} · crops {{crops}} · combo ×{{combo}}",
    result_score: "Score: {{score}}",
    result_time: "Time: {{time}}",
    result_crops: "Crops gathered: {{crops}}",
    result_best_combo: "Best combo: ×{{combo}}",
    result_cause_obstacle: "Cause: collision with an obstacle",
    reward_saving: "Saving result…",
    reward_saved: "Result saved. Your pet has the reward!",
    reward_already_saved: "This attempt was already saved on the server.",
    reward_local: "Practice run: no reward is granted.",
    reward_failed: "The reward could not be saved. Keep the game open and try again.",
    reward_launch_invalid: "The reward link is incomplete or invalid. Open the game again from the bot.",
    reward_retry: "↻ Retry saving",
    result_time_label: "Time",
    result_crops_label: "Crops",
    result_combo_label: "Best combo",
    share_score: "Share score",
    practice_note: "A reward is available for the first run only. The next run is practice.",
    close_hint: "Close the mini-game to return to the bot.",
    replay: "🔁 Play again · new attempt",
    practice_replay: "↻ Practice again",
    home: "🏠 Home",
    a11y_game: "Farm Run game field",
    a11y_jump: "Jump",
    a11y_pause: "Pause the run",
    a11y_resume: "Resume the run",
    a11y_back_to_games: "Return to the game list",
    a11y_score: "Score: {{score}}",
    a11y_crops: "Crops gathered: {{crops}}",
    a11y_combo: "Combo: {{combo}}",
    a11y_powerups: "Active power-ups",
    a11y_shield_active: "Shield active",
    a11y_magnet_active: "Magnet active",
    a11y_results: "Farm Run results"
  }
} as const satisfies Record<RunnerLang, Record<RunnerTextKey, string>>;

export function normalizeRunnerLang(value: unknown): RunnerLang {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  const language = raw.split(/[-_]/, 1)[0];

  if (language === "ua") return "uk";
  if (language === "ru" || language === "uk" || language === "en") return language;
  return "ru";
}

type RunnerWindow = Window & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          language_code?: unknown;
        };
      };
    };
  };
};

export function initialRunnerLang(): RunnerLang {
  if (typeof window === "undefined") return "ru";

  try {
    const params = new URLSearchParams(window.location.search);
    const queryLanguage = params.get("lang") || params.get("language");
    if (queryLanguage) return normalizeRunnerLang(queryLanguage);

    const telegramLanguage = (window as RunnerWindow).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (telegramLanguage) return normalizeRunnerLang(telegramLanguage);

    const browserLanguage = navigator.languages?.[0] || navigator.language;
    if (browserLanguage) return normalizeRunnerLang(browserLanguage);

    return normalizeRunnerLang(document.documentElement.lang);
  } catch {
    return "ru";
  }
}

export function translate(
  lang: unknown,
  key: RunnerTextKey,
  variables: RunnerTextVariables = {}
): string {
  const language = normalizeRunnerLang(lang);
  const template = RUNNER_TEXTS[language][key] || RUNNER_TEXTS.ru[key] || key;

  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = variables[name as RunnerTextVariable];
    return value === undefined ? "" : String(value);
  });
}
