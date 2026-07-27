export const SUPPORTED_LOCALES = ["ru", "uk", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_STORAGE_KEY = "wol.tower-defense.locale.v1";
export const LOCALE_LABELS: Readonly<Record<Locale, string>> = Object.freeze({
  ru: "RU",
  uk: "UA",
  en: "EN",
});

const ru = {
  app_title: "Стражи тропы",
  app_subtitle: "Тактическая защита Сердца леса",
  language: "Язык игры",
  intro_title: "Защити Сердце леса",
  intro_body: "Строй башни, сочетай их силы и останови врагов, прежде чем они доберутся до Сердца.",
  intro_start: "Встать на защиту",
  intro_waves: "{count} волн",
  intro_towers: "{count} башни",
  intro_bosses: "Боссы",
  defense_status: "Состояние защиты",
  game_field: "Игровое поле",
  close: "Закрыть",
  result_eyebrow: "Итог защиты",
  launch_error_title: "Не удалось начать игру",
  launch_error_body: "Ссылка запуска повреждена или устарела. Закрой игру и запусти её снова из Telegram.",
  launch_error_action: "Запусти снова из Telegram",
  miniapp_launch_error_body: "Telegram подтвердил вход, но сервер не создал защищённую попытку. Проверь соединение и попробуй снова.",
  miniapp_launch_retry: "Повторить",
  gold: "Золото",
  lives: "Жизни",
  wave: "Волна",
  wave_of: "Волна {current} из {total}",
  completed: "Пройдено",
  start_wave: "Начать волну",
  boss_wave: "Волна с боссом",
  preparing: "Подготовка",
  fighting: "Бой",
  paused: "Пауза",
  pause: "Пауза",
  resume: "Продолжить",
  speed: "Скорость",
  pulse: "Импульс",
  pulse_ready: "Импульс готов",
  pulse_used: "Импульс уже использован в этой волне",
  tower_ranger: "Следопыт",
  tower_frost: "Ледяной страж",
  tower_ember: "Искромант",
  tower_storm: "Грозовой шпиль",
  tower_ranger_desc: "Быстро атакует одну цель с большой дистанции.",
  tower_frost_desc: "Замедляет врагов и помогает сдержать прорыв.",
  tower_ember_desc: "Поджигает группы врагов взрывными снарядами.",
  tower_storm_desc: "Проводит цепную молнию через плотную группу врагов.",
  tower_guide_button: "Справка по башням",
  fullscreen_enter: "Развернуть на весь экран",
  fullscreen_exit: "Выйти из полноэкранного режима",
  guide_eyebrow: "Справочник защитника",
  guide_title: "Какая башня лучше?",
  guide_intro: "Смотри на состав следующей волны и сочетай разные типы урона.",
  guide_strong: "Сильна против",
  guide_weak: "Учти",
  guide_ranger_strong: "Ловкачей, Теней; на IV уровне — боссов.",
  guide_ranger_weak: "Броня Панцирников и Бастионов снижает физический урон.",
  guide_frost_strong: "Ловкачей и плотных волн; даёт другим башням больше времени.",
  guide_frost_weak: "Тени и Титаны сильно сопротивляются замедлению.",
  guide_ember_strong: "Плотных групп, Панцирников и Бастионов.",
  guide_ember_weak: "Хранители и Шаманы снижают огненный урон.",
  guide_storm_strong: "Скоплений и врагов с физической или магической защитой.",
  guide_storm_weak: "На одиночной цели не раскрывает цепную молнию.",
  guide_combo: "Связка: Ледяной страж удерживает врагов внутри огня и цепной молнии.",
  guide_done: "Понятно",
  build_hint: "Выбери свободную площадку и построй подходящую башню.",
  select_pad: "Выбери площадку",
  upgrade: "Улучшить",
  sell: "Продать",
  level: "Уровень",
  damage: "Урон",
  range: "Дальность",
  max_level: "Максимальный уровень",
  mastery_locked: "Мастерство откроется после 12-й волны",
  arsenal: "Арсенал",
  next_wave: "Следующая волна",
  enemy_raider: "Налётчик",
  enemy_swift: "Ловкач",
  enemy_brute: "Панцирник",
  enemy_warden: "Хранитель",
  enemy_shade: "Тень",
  enemy_bulwark: "Бастион",
  enemy_shaman: "Шаман",
  enemy_boss: "Босс",
  enemy_titan: "Титан разлома",
  act: "Акт {count}",
  threat: "Угроза: {count} из 5",
  boss_act_1: "Владыка чащи",
  boss_act_2: "Кристальный князь",
  boss_act_3: "Багровый король",
  boss_state: "Вожак орды",
  boss_enraged: "Ярость",
  boss_repair: "Сердце восстановлено",
  insufficient_gold: "Не хватает золота",
  build_locked: "Строить можно только между волнами",
  wave_clear: "Волна отбита!",
  clear_bonus: "Бонус за защиту: +{amount}",
  boss_warning: "Осторожно: приближается босс!",
  game_over: "Защита пала",
  victory: "Лес спасён!",
  result_waves: "Отбито волн: {count}",
  result_summary: "Волны: {waves} / {total} · Очки рейтинга: {score}",
  reward_saving: "Сохраняем результат…",
  reward_saved: "Результат сохранён",
  reward_duplicate: "Этот результат уже был учтён",
  reward_failed: "Не удалось сохранить результат",
  reward_retry: "Повторить отправку",
  restart: "Начать заново",
  practice: "Тренировочный режим",
  close_hint: "Можно закрыть игру и вернуться в Telegram",
  finish_pending_hint: "Не закрывай игру, пока результат сохраняется.",
  finish_failed_hint: "Не закрывай игру: повтори отправку результата.",
} as const;

export type TranslationKey = keyof typeof ru;
export type TranslationParams = Readonly<Record<string, string | number>>;

const uk = {
  app_title: "Вартові стежки",
  app_subtitle: "Тактичний захист Серця лісу",
  language: "Мова гри",
  intro_title: "Захисти Серце лісу",
  intro_body: "Будуй вежі, поєднуй їхні сили й зупини ворогів, перш ніж вони дістануться Серця.",
  intro_start: "Стати на захист",
  intro_waves: "{count} хвиль",
  intro_towers: "{count} вежі",
  intro_bosses: "Боси",
  defense_status: "Стан захисту",
  game_field: "Ігрове поле",
  close: "Закрити",
  result_eyebrow: "Підсумок захисту",
  launch_error_title: "Не вдалося почати гру",
  launch_error_body: "Посилання запуску пошкоджене або застаріле. Закрий гру й запусти її знову з Telegram.",
  launch_error_action: "Запусти знову з Telegram",
  miniapp_launch_error_body: "Telegram підтвердив вхід, але сервер не створив захищену спробу. Перевір з'єднання та спробуй ще раз.",
  miniapp_launch_retry: "Спробувати знову",
  gold: "Золото",
  lives: "Життя",
  wave: "Хвиля",
  wave_of: "Хвиля {current} з {total}",
  completed: "Пройдено",
  start_wave: "Почати хвилю",
  boss_wave: "Хвиля з босом",
  preparing: "Підготовка",
  fighting: "Бій",
  paused: "Пауза",
  pause: "Пауза",
  resume: "Продовжити",
  speed: "Швидкість",
  pulse: "Імпульс",
  pulse_ready: "Імпульс готовий",
  pulse_used: "Імпульс уже використано в цій хвилі",
  tower_ranger: "Слідопит",
  tower_frost: "Крижаний вартовий",
  tower_ember: "Іскромант",
  tower_storm: "Грозовий шпиль",
  tower_ranger_desc: "Швидко атакує одну ціль із великої відстані.",
  tower_frost_desc: "Уповільнює ворогів і допомагає стримати прорив.",
  tower_ember_desc: "Підпалює групи ворогів вибуховими снарядами.",
  tower_storm_desc: "Проводить ланцюгову блискавку крізь щільну групу ворогів.",
  tower_guide_button: "Довідка про вежі",
  fullscreen_enter: "Розгорнути на весь екран",
  fullscreen_exit: "Вийти з повноекранного режиму",
  guide_eyebrow: "Довідник захисника",
  guide_title: "Яка вежа краща?",
  guide_intro: "Дивись на склад наступної хвилі та поєднуй різні типи шкоди.",
  guide_strong: "Сильна проти",
  guide_weak: "Врахуй",
  guide_ranger_strong: "Спритників, Тіней; на IV рівні — босів.",
  guide_ranger_weak: "Броня Панцирників і Бастіонів зменшує фізичну шкоду.",
  guide_frost_strong: "Спритників і щільних хвиль; дає іншим вежам більше часу.",
  guide_frost_weak: "Тіні й Титани сильно опираються уповільненню.",
  guide_ember_strong: "Щільних груп, Панцирників і Бастіонів.",
  guide_ember_weak: "Вартові та Шамани зменшують вогняну шкоду.",
  guide_storm_strong: "Скупчень і ворогів із фізичним або магічним захистом.",
  guide_storm_weak: "На одиночній цілі не розкриває ланцюгову блискавку.",
  guide_combo: "Зв'язка: Крижаний вартовий утримує ворогів усередині вогню та ланцюгової блискавки.",
  guide_done: "Зрозуміло",
  build_hint: "Обери вільний майданчик і збудуй відповідну вежу.",
  select_pad: "Обери майданчик",
  upgrade: "Поліпшити",
  sell: "Продати",
  level: "Рівень",
  damage: "Шкода",
  range: "Дальність",
  max_level: "Максимальний рівень",
  mastery_locked: "Майстерність відкриється після 12-ї хвилі",
  arsenal: "Арсенал",
  next_wave: "Наступна хвиля",
  enemy_raider: "Нападник",
  enemy_swift: "Спритник",
  enemy_brute: "Панцирник",
  enemy_warden: "Вартовий",
  enemy_shade: "Тінь",
  enemy_bulwark: "Бастіон",
  enemy_shaman: "Шаман",
  enemy_boss: "Бос",
  enemy_titan: "Титан розлому",
  act: "Акт {count}",
  threat: "Загроза: {count} із 5",
  boss_act_1: "Володар хащі",
  boss_act_2: "Кришталевий князь",
  boss_act_3: "Багряний король",
  boss_state: "Ватажок орди",
  boss_enraged: "Лють",
  boss_repair: "Серце відновлено",
  insufficient_gold: "Не вистачає золота",
  build_locked: "Будувати можна лише між хвилями",
  wave_clear: "Хвилю відбито!",
  clear_bonus: "Бонус за захист: +{amount}",
  boss_warning: "Обережно: наближається бос!",
  game_over: "Оборону зламано",
  victory: "Ліс урятовано!",
  result_waves: "Відбито хвиль: {count}",
  result_summary: "Хвилі: {waves} / {total} · Рейтингові бали: {score}",
  reward_saving: "Зберігаємо результат…",
  reward_saved: "Результат збережено",
  reward_duplicate: "Цей результат уже враховано",
  reward_failed: "Не вдалося зберегти результат",
  reward_retry: "Надіслати ще раз",
  restart: "Почати заново",
  practice: "Тренувальний режим",
  close_hint: "Можна закрити гру й повернутися до Telegram",
  finish_pending_hint: "Не закривай гру, доки результат зберігається.",
  finish_failed_hint: "Не закривай гру: надішли результат ще раз.",
} satisfies Record<TranslationKey, string>;

const en = {
  app_title: "Path Guardians",
  app_subtitle: "A tactical defense of the Heart of the Forest",
  language: "Game language",
  intro_title: "Defend the Heart of the Forest",
  intro_body: "Build towers, combine their strengths, and stop the enemies before they reach the Heart.",
  intro_start: "Stand guard",
  intro_waves: "{count} waves",
  intro_towers: "{count} towers",
  intro_bosses: "Bosses",
  defense_status: "Defense status",
  game_field: "Game field",
  close: "Close",
  result_eyebrow: "Defense result",
  launch_error_title: "Could not start the game",
  launch_error_body: "This launch link is incomplete or expired. Close the game and open it again from Telegram.",
  launch_error_action: "Open again from Telegram",
  miniapp_launch_error_body: "Telegram confirmed your sign-in, but the server could not create a protected run. Check your connection and try again.",
  miniapp_launch_retry: "Try again",
  gold: "Gold",
  lives: "Lives",
  wave: "Wave",
  wave_of: "Wave {current} of {total}",
  completed: "Completed",
  start_wave: "Start wave",
  boss_wave: "Boss wave",
  preparing: "Preparing",
  fighting: "Battle",
  paused: "Paused",
  pause: "Pause",
  resume: "Resume",
  speed: "Speed",
  pulse: "Pulse",
  pulse_ready: "Pulse ready",
  pulse_used: "Pulse has already been used this wave",
  tower_ranger: "Ranger",
  tower_frost: "Frost Warden",
  tower_ember: "Embermage",
  tower_storm: "Storm Spire",
  tower_ranger_desc: "Quickly attacks a single target from long range.",
  tower_frost_desc: "Slows enemies and helps contain a breakthrough.",
  tower_ember_desc: "Ignites groups of enemies with explosive projectiles.",
  tower_storm_desc: "Chains lightning through tightly packed enemies.",
  tower_guide_button: "Tower guide",
  fullscreen_enter: "Enter fullscreen",
  fullscreen_exit: "Exit fullscreen",
  guide_eyebrow: "Defender's guide",
  guide_title: "Which tower works best?",
  guide_intro: "Check the next wave and combine different damage types.",
  guide_strong: "Strong against",
  guide_weak: "Watch out",
  guide_ranger_strong: "Swifts, Shades, and bosses at level IV.",
  guide_ranger_weak: "Brute and Bulwark armor reduces physical damage.",
  guide_frost_strong: "Swifts and packed waves; buys more time for other towers.",
  guide_frost_weak: "Shades and Titans strongly resist slowing effects.",
  guide_ember_strong: "Packed groups, Brutes, and Bulwarks.",
  guide_ember_weak: "Wardens and Shamans reduce fire damage.",
  guide_storm_strong: "Clusters and enemies with physical or magical defenses.",
  guide_storm_weak: "Chain lightning loses value against a lone target.",
  guide_combo: "Combo: Frost Wardens hold enemies inside fire and chain lightning.",
  guide_done: "Got it",
  build_hint: "Choose an empty pad and build the right tower.",
  select_pad: "Select a pad",
  upgrade: "Upgrade",
  sell: "Sell",
  level: "Level",
  damage: "Damage",
  range: "Range",
  max_level: "Maximum level",
  mastery_locked: "Mastery unlocks after wave 12",
  arsenal: "Arsenal",
  next_wave: "Next wave",
  enemy_raider: "Raider",
  enemy_swift: "Swift",
  enemy_brute: "Brute",
  enemy_warden: "Warden",
  enemy_shade: "Shade",
  enemy_bulwark: "Bulwark",
  enemy_shaman: "Shaman",
  enemy_boss: "Boss",
  enemy_titan: "Rift Titan",
  act: "Act {count}",
  threat: "Threat: {count} of 5",
  boss_act_1: "Lord of the Thicket",
  boss_act_2: "Crystal Prince",
  boss_act_3: "Crimson King",
  boss_state: "Horde leader",
  boss_enraged: "Enraged",
  boss_repair: "Heart restored",
  insufficient_gold: "Not enough gold",
  build_locked: "You can only build between waves",
  wave_clear: "Wave cleared!",
  clear_bonus: "Defense bonus: +{amount}",
  boss_warning: "Warning: a boss is approaching!",
  game_over: "The defense has fallen",
  victory: "The forest is safe!",
  result_waves: "Waves cleared: {count}",
  result_summary: "Waves: {waves} / {total} · Rating points: {score}",
  reward_saving: "Saving result…",
  reward_saved: "Result saved",
  reward_duplicate: "This result has already been recorded",
  reward_failed: "Could not save the result",
  reward_retry: "Try again",
  restart: "Start over",
  practice: "Practice mode",
  close_hint: "You can close the game and return to Telegram",
  finish_pending_hint: "Keep the game open while the result is being saved.",
  finish_failed_hint: "Keep the game open and try sending the result again.",
} satisfies Record<TranslationKey, string>;

export const translations: Readonly<Record<Locale, Readonly<Record<TranslationKey, string>>>> = {
  ru,
  uk,
  en,
};

type BrowserGlobals = {
  location?: { search?: string };
  navigator?: { language?: string; languages?: readonly string[] };
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: { language_code?: string };
      };
    };
  };
};

export function normalizeLocale(value: unknown): Locale | null {
  if (typeof value !== "string") return null;
  const language = value.trim().toLowerCase().replaceAll("_", "-").split("-", 1)[0];
  if (language === "ru") return "ru";
  if (language === "uk" || language === "ua") return "uk";
  if (language === "en") return "en";
  return null;
}

type LocaleStorage = Readonly<{
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}>;

export function readStoredLocale(storage: LocaleStorage | null | undefined): Locale | null {
  if (!storage) return null;
  try {
    return normalizeLocale(storage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredLocale(storage: LocaleStorage | null | undefined, locale: Locale): boolean {
  if (!storage) return false;
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}

export function detectLocale(...launchLanguages: readonly unknown[]): Locale {
  const browser = globalThis as unknown as BrowserGlobals;
  const candidates = [
    ...readQueryLanguages(browser.location?.search),
    ...launchLanguages,
    browser.Telegram?.WebApp?.initDataUnsafe?.user?.language_code,
    ...(browser.navigator?.languages ?? []),
    browser.navigator?.language,
  ];

  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return "ru";
}

export function tr(
  locale: Locale | string | null | undefined,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  const selectedLocale = normalizeLocale(locale) ?? "ru";
  return translations[selectedLocale][key].replace(/\{([a-zA-Z0-9_]+)\}/g, (placeholder, name: string) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder
  ));
}

function readQueryLanguages(search: string | undefined): Array<string | null> {
  if (!search || typeof URLSearchParams === "undefined") return [];
  try {
    const params = new URLSearchParams(search);
    return [params.get("lang"), params.get("language")];
  } catch {
    return [];
  }
}
