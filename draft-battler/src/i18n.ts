import type { CardDefinition, CardId, UnitTag } from "./game/types";

export const SUPPORTED_LOCALES = ["ru", "uk", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type CardArchetype = "tank" | "damage" | "support";
export type CardRarity = "common" | "uncommon" | "rare";
export type LocalizedCombatEvent =
  | "unit_attacked"
  | "unit_blocked"
  | "unit_damaged"
  | "unit_healed"
  | "unit_died"
  | "synergy_applied";

export const LOCALE_STORAGE_KEY = "draft-battler:locale";
export const HOW_TO_SEEN_STORAGE_KEY = "draft-battler:how-to-seen:v1";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface UiCopy {
  language: string;
  localeName: string;
  menuSubtitle: string;
  startRun: string;
  howToPlay: string;
  howToTitle: string;
  howToIntro: string;
  howToDraftTitle: string;
  howToDraftBody: string;
  howToPlaceTitle: string;
  howToPlaceBody: string;
  howToUpgradeTitle: string;
  howToUpgradeBody: string;
  howToWinTitle: string;
  howToWinBody: string;
  howToSessionNotice: string;
  gotIt: string;
  hp: string;
  round: string;
  seed: string;
  runFinished: string;
  victory: string;
  defeat: string;
  roundVictory: string;
  roundDefeat: string;
  roundDraw: string;
  victoryDetail: string;
  defeatDetail: string;
  drawDetail: string;
  rounds: string;
  again: string;
  menu: string;
  logs: string;
  closeLogs: string;
  roundNumber: string;
  synergies: string;
  synergyActive: string;
  synergyProgress: string;
  synergyWillActivate: string;
  synergyMayActivate: string;
  enemyArmy: string;
  enemyArmyHint: string;
  onboarding: string;
  chooseCard: string;
  slots: string;
  closeCardInfo: string;
  reroll: string;
  rerollUsed: string;
  selectedCard: string;
  upgradeHint: string;
  placeHint: string;
  replacementHint: string;
  makeRoomHint: string;
  cardInfo: string;
  cancel: string;
  attack: string;
  speed: string;
  range: string;
  upgradeCard: string;
  placeCard: string;
  replaceCard: string;
  invalidPlacement: string;
  placeTarget: string;
  upgradeTarget: string;
  replaceTarget: string;
  replacementTitle: string;
  replacementBody: string;
  confirmReplacement: string;
  upgradedCard: string;
  boardPosition: string;
  fieldPosition: string;
  frontRow: string;
  backRow: string;
  leftColumn: string;
  centerColumn: string;
  rightColumn: string;
  upgradedStats: string;
  emptySlot: string;
  moveUnit: string;
  moveUnitHint: string;
  chooseMoveTarget: string;
  fight: string;
  nextRound: string;
  battleSpeed: string;
  skipBattle: string;
  battleInProgress: string;
  roundResultDetail: string;
  sceneLoading: string;
  battleResultReady: string;
  battlefieldUnavailable: string;
  rendererForced: string;
  rendererUnavailable: string;
  rendererInterrupted: string;
  rendererTimeout: string;
  draw: string;
  yourHp: string;
  enemyHp: string;
  actions: string;
  hpLoss: string;
  you: string;
  bot: string;
  skipPickConfirm: string;
}

export interface LocalizedCardText {
  name: string;
  text: string;
  summary: string;
}

const UI_COPY: Record<SupportedLocale, UiCopy> = {
  ru: {
    language: "Язык",
    localeName: "Русский",
    menuSubtitle: "Соберите отряд и разрушьте крепость соперника за 15 раундов.",
    startRun: "Начать дуэль",
    howToPlay: "Как играть",
    howToTitle: "Как играть",
    howToIntro: "Симметричная дуэль: обе крепости начинают с 20 HP, а каждый соперник получает по одной карте за раунд.",
    howToDraftTitle: "1. Выберите карту",
    howToDraftBody: "В каждом раунде вы и соперник получаете по одной карте. Вы выбираете одну из трёх и можете один раз бесплатно обновить выбор.",
    howToPlaceTitle: "2. Поставьте бойца",
    howToPlaceBody: "Коснитесь карты, затем позиции на поле — или перетащите карту. Передний ряд прикрывает задний: ДАЛ 1 сначала пробивает передний ряд, ДАЛ 2 может бить открытую заднюю позицию, а ДАЛ 3 достаёт оба ряда. Некоторые способности обходят ряды; Щитоносец ставится только спереди. Бойцы с одинаковым временем хода действуют одновременно.",
    howToUpgradeTitle: "3. Собирайте дубликаты",
    howToUpgradeBody: "Повторная карта улучшает бойца. Перед боем можно менять бойцов местами; замена на полном поле требует подтверждения.",
    howToWinTitle: "4. Разрушьте крепость",
    howToWinBody: "После боя выжившие победители наносят урон крепости соперника. HP обеих крепостей сохраняется. Дуэль заканчивается при 0 HP или после 15-го раунда: побеждает крепость с большим HP, при равенстве — ничья.",
    howToSessionNotice: "Дуэль сохраняется на этом устройстве и продолжится после перезагрузки.",
    gotIt: "Понятно",
    hp: "HP",
    round: "Раунд",
    seed: "Код",
    runFinished: "Дуэль завершена",
    victory: "Победа!",
    defeat: "Поражение",
    roundVictory: "Бой выигран",
    roundDefeat: "Бой проигран",
    roundDraw: "Ничья в бою",
    victoryDetail: "Вы победили на раунде {round}: {playerHp} HP против {enemyHp} HP.",
    defeatDetail: "Вы проиграли на раунде {round}: {playerHp} HP против {enemyHp} HP.",
    drawDetail: "После раунда {round} у крепостей равное HP: {playerHp}:{enemyHp}.",
    rounds: "Раунды",
    again: "Ещё раз",
    menu: "В меню",
    logs: "Итоги",
    closeLogs: "Закрыть итоги",
    roundNumber: "Раунд {round}",
    synergies: "Синергии",
    synergyActive: "{tag}: {count}/{threshold}, активно, {effect}",
    synergyProgress: "{tag}: {count}/{threshold}, до активации {remaining}, {effect}",
    synergyWillActivate: "Активирует: {tag} {before}→{after}",
    synergyMayActivate: "Может активировать: {tag} {before}→{after}",
    enemyArmy: "Известная армия врага",
    enemyArmyHint: "+1 новая карта пока скрыта",
    onboarding: "Коснитесь карты и позиции на поле — или перетащите карту.",
    chooseCard: "Выберите одну карту",
    slots: "Места {filled}/{capacity}",
    closeCardInfo: "Закрыть описание карты",
    reroll: "Обновить",
    rerollUsed: "Обновлено",
    selectedCard: "Выбран: {card}",
    upgradeHint: "Коснитесь поля — существующий боец улучшится.",
    placeHint: "Коснитесь подходящей пустой позиции на поле.",
    replacementHint: "Поле заполнено. Выберите бойца, которого хотите заменить.",
    makeRoomHint: "Сначала освободите подходящую позицию, переместив бойца.",
    cardInfo: "О карте",
    cancel: "Отмена",
    attack: "АТК",
    speed: "СКР",
    range: "ДАЛ",
    upgradeCard: "Улучшить {card}",
    placeCard: "Поставить {card} на позицию {slot}",
    replaceCard: "Заменить {old} на {card} в позиции {slot}",
    invalidPlacement: "{card} нельзя поставить на позицию {slot}",
    placeTarget: "Сюда",
    upgradeTarget: "Улучшение",
    replaceTarget: "Замена",
    replacementTitle: "Заменить бойца?",
    replacementBody: "{old} исчезнет, а его место займёт {card}.",
    confirmReplacement: "Заменить",
    upgradedCard: "{card}, улучшен",
    boardPosition: "Позиция {slot}",
    fieldPosition: "{row}, {column}",
    frontRow: "передний ряд",
    backRow: "задний ряд",
    leftColumn: "слева",
    centerColumn: "центр",
    rightColumn: "справа",
    upgradedStats: "Улучшенные характеристики",
    emptySlot: "Пустая позиция {slot}",
    moveUnit: "Переместить",
    moveUnitHint: "Перемещение: {card}",
    chooseMoveTarget: "Выберите новую позицию на поле.",
    fight: "В бой",
    nextRound: "Следующий раунд",
    battleSpeed: "Скорость боя",
    skipBattle: "Пропустить бой",
    battleInProgress: "Идёт бой, раунд {round} из {maxRounds}.",
    roundResultDetail: "{yourHp}: {playerHp} (−{playerLoss}) · {enemyHp}: {enemyHpValue} (−{enemyLoss})",
    sceneLoading: "Загрузка поля…",
    battleResultReady: "Результат боя готов.",
    battlefieldUnavailable: "Поле боя недоступно. Драфт продолжает работать.",
    rendererForced: "Анимация боя отключена для проверки. Результат рассчитан, можно продолжить.",
    rendererUnavailable: "Анимация боя недоступна. Результат рассчитан, можно продолжить.",
    rendererInterrupted: "Анимация боя прервалась. Результат рассчитан, можно продолжить.",
    rendererTimeout: "Анимация заняла слишком много времени. Результат рассчитан, можно продолжить.",
    draw: "Ничья",
    yourHp: "Ваше HP",
    enemyHp: "HP врага",
    actions: "действий",
    hpLoss: "Потеря HP",
    you: "Вы",
    bot: "Бот",
    skipPickConfirm: "Вы ещё можете выбрать одну карту в этом раунде. Всё равно начать бой?",
  },
  uk: {
    language: "Мова",
    localeName: "Українська",
    menuSubtitle: "Зберіть загін і зруйнуйте фортецю суперника за 15 раундів.",
    startRun: "Почати дуель",
    howToPlay: "Як грати",
    howToTitle: "Як грати",
    howToIntro: "Симетрична дуель: обидві фортеці починають із 20 HP, а кожен суперник отримує по одній карті щораунду.",
    howToDraftTitle: "1. Виберіть карту",
    howToDraftBody: "У кожному раунді ви та суперник отримуєте по одній карті. Ви обираєте одну з трьох і можете один раз безкоштовно оновити вибір.",
    howToPlaceTitle: "2. Поставте бійця",
    howToPlaceBody: "Торкніться карти, потім позиції на полі — або перетягніть карту. Передній ряд прикриває задній: ДАЛ 1 спершу долає передній ряд, ДАЛ 2 може бити відкриту задню позицію, а ДАЛ 3 дістає обидва ряди. Деякі здібності обходять ряди; Щитоносець стає лише попереду. Бійці з однаковим часом ходу діють одночасно.",
    howToUpgradeTitle: "3. Збирайте дублікати",
    howToUpgradeBody: "Повторна карта покращує бійця. Перед боєм можна міняти бійців місцями; заміна на повному полі потребує підтвердження.",
    howToWinTitle: "4. Зруйнуйте фортецю",
    howToWinBody: "Після бою бійці команди-переможця, що вижили, завдають шкоди фортеці суперника. HP обох фортець зберігається. Дуель завершується при 0 HP або після 15-го раунду: перемагає фортеця з більшим HP, за рівності — нічия.",
    howToSessionNotice: "Дуель зберігається на цьому пристрої та продовжиться після перезавантаження.",
    gotIt: "Зрозуміло",
    hp: "HP",
    round: "Раунд",
    seed: "Код",
    runFinished: "Дуель завершено",
    victory: "Перемога!",
    defeat: "Поразка",
    roundVictory: "Бій виграно",
    roundDefeat: "Бій програно",
    roundDraw: "Нічия в бою",
    victoryDetail: "Ви перемогли в раунді {round}: {playerHp} HP проти {enemyHp} HP.",
    defeatDetail: "Ви програли в раунді {round}: {playerHp} HP проти {enemyHp} HP.",
    drawDetail: "Після раунду {round} фортеці мають однакове HP: {playerHp}:{enemyHp}.",
    rounds: "Раунди",
    again: "Ще раз",
    menu: "До меню",
    logs: "Підсумки",
    closeLogs: "Закрити підсумки",
    roundNumber: "Раунд {round}",
    synergies: "Синергії",
    synergyActive: "{tag}: {count}/{threshold}, активно, {effect}",
    synergyProgress: "{tag}: {count}/{threshold}, до активації {remaining}, {effect}",
    synergyWillActivate: "Активує: {tag} {before}→{after}",
    synergyMayActivate: "Може активувати: {tag} {before}→{after}",
    enemyArmy: "Відома армія ворога",
    enemyArmyHint: "+1 нова карта поки прихована",
    onboarding: "Торкніться карти й позиції на полі — або перетягніть карту.",
    chooseCard: "Виберіть одну карту",
    slots: "Місця {filled}/{capacity}",
    closeCardInfo: "Закрити опис карти",
    reroll: "Оновити",
    rerollUsed: "Оновлено",
    selectedCard: "Обрано: {card}",
    upgradeHint: "Торкніться поля — наявний боєць покращиться.",
    placeHint: "Торкніться відповідної порожньої позиції на полі.",
    replacementHint: "Поле заповнене. Виберіть бійця, якого хочете замінити.",
    makeRoomHint: "Спочатку звільніть відповідну позицію, перемістивши бійця.",
    cardInfo: "Про карту",
    cancel: "Скасувати",
    attack: "АТК",
    speed: "ШВК",
    range: "ДАЛ",
    upgradeCard: "Покращити {card}",
    placeCard: "Поставити {card} на позицію {slot}",
    replaceCard: "Замінити {old} на {card} у позиції {slot}",
    invalidPlacement: "{card} не можна поставити на позицію {slot}",
    placeTarget: "Сюди",
    upgradeTarget: "Покращення",
    replaceTarget: "Заміна",
    replacementTitle: "Замінити бійця?",
    replacementBody: "{old} зникне, а його місце займе {card}.",
    confirmReplacement: "Замінити",
    upgradedCard: "{card}, покращено",
    boardPosition: "Позиція {slot}",
    fieldPosition: "{row}, {column}",
    frontRow: "передній ряд",
    backRow: "задній ряд",
    leftColumn: "ліворуч",
    centerColumn: "центр",
    rightColumn: "праворуч",
    upgradedStats: "Покращені характеристики",
    emptySlot: "Порожня позиція {slot}",
    moveUnit: "Перемістити",
    moveUnitHint: "Переміщення: {card}",
    chooseMoveTarget: "Виберіть нову позицію на полі.",
    fight: "У бій",
    nextRound: "Наступний раунд",
    battleSpeed: "Швидкість бою",
    skipBattle: "Пропустити бій",
    battleInProgress: "Триває бій, раунд {round} із {maxRounds}.",
    roundResultDetail: "{yourHp}: {playerHp} (−{playerLoss}) · {enemyHp}: {enemyHpValue} (−{enemyLoss})",
    sceneLoading: "Завантаження поля…",
    battleResultReady: "Результат бою готовий.",
    battlefieldUnavailable: "Поле бою недоступне. Драфт продовжує працювати.",
    rendererForced: "Анімацію бою вимкнено для перевірки. Результат розраховано, можна продовжити.",
    rendererUnavailable: "Анімація бою недоступна. Результат розраховано, можна продовжити.",
    rendererInterrupted: "Анімація бою перервалася. Результат розраховано, можна продовжити.",
    rendererTimeout: "Анімація тривала надто довго. Результат розраховано, можна продовжити.",
    draw: "Нічия",
    yourHp: "Ваше HP",
    enemyHp: "HP ворога",
    actions: "дій",
    hpLoss: "Втрата HP",
    you: "Ви",
    bot: "Бот",
    skipPickConfirm: "Ви ще можете вибрати одну карту в цьому раунді. Усе одно почати бій?",
  },
  en: {
    language: "Language",
    localeName: "English",
    menuSubtitle: "Build a squad and destroy the rival keep within 15 rounds.",
    startRun: "Start duel",
    howToPlay: "How to play",
    howToTitle: "How to play",
    howToIntro: "A symmetric duel: both keeps start at 20 HP, and each rival receives one card per round.",
    howToDraftTitle: "1. Choose a card",
    howToDraftBody: "You and your rival each receive one card per round. Choose one of three cards and refresh the offer once for free.",
    howToPlaceTitle: "2. Place the fighter",
    howToPlaceBody: "Tap a card, then a field slot—or drag it. The front row protects the back: RNG 1 clears the front row first, RNG 2 can hit an exposed back slot, and RNG 3 reaches both rows. Some abilities bypass rows; Shieldbearer is front-only. Fighters with the same action time act simultaneously.",
    howToUpgradeTitle: "3. Collect duplicates",
    howToUpgradeBody: "A duplicate upgrades a fighter. You may rearrange fighters before battle; full-field replacement requires confirmation.",
    howToWinTitle: "4. Destroy the rival keep",
    howToWinBody: "After battle, the winning survivors damage the rival keep. Both keeps retain their HP. The duel ends when a keep reaches 0 HP or after round 15: higher HP wins, and equal HP is a draw.",
    howToSessionNotice: "Your duel is saved on this device and resumes after reloading.",
    gotIt: "Got it",
    hp: "HP",
    round: "Round",
    seed: "Code",
    runFinished: "Duel complete",
    victory: "Victory!",
    defeat: "Defeat",
    roundVictory: "Battle won",
    roundDefeat: "Battle lost",
    roundDraw: "Battle draw",
    victoryDetail: "You won in round {round}: {playerHp} HP to {enemyHp} HP.",
    defeatDetail: "You lost in round {round}: {playerHp} HP to {enemyHp} HP.",
    drawDetail: "After round {round}, both keeps have equal HP: {playerHp}:{enemyHp}.",
    rounds: "Rounds",
    again: "Play again",
    menu: "Menu",
    logs: "Results",
    closeLogs: "Close results",
    roundNumber: "Round {round}",
    synergies: "Synergies",
    synergyActive: "{tag}: {count}/{threshold}, active, {effect}",
    synergyProgress: "{tag}: {count}/{threshold}, {remaining} more to activate, {effect}",
    synergyWillActivate: "Activates: {tag} {before}→{after}",
    synergyMayActivate: "Can activate: {tag} {before}→{after}",
    enemyArmy: "Known enemy army",
    enemyArmyHint: "+1 new card is still hidden",
    onboarding: "Tap a card and a field slot—or drag the card.",
    chooseCard: "Choose one card",
    slots: "Slots {filled}/{capacity}",
    closeCardInfo: "Close card details",
    reroll: "Refresh",
    rerollUsed: "Refreshed",
    selectedCard: "Selected: {card}",
    upgradeHint: "Tap the field to upgrade your existing fighter.",
    placeHint: "Tap a valid empty position on the field.",
    replacementHint: "The field is full. Choose the fighter you want to replace.",
    makeRoomHint: "Move a fighter first to free a valid position.",
    cardInfo: "Card details",
    cancel: "Cancel",
    attack: "ATK",
    speed: "SPD",
    range: "RNG",
    upgradeCard: "Upgrade {card}",
    placeCard: "Place {card} in position {slot}",
    replaceCard: "Replace {old} with {card} in position {slot}",
    invalidPlacement: "{card} cannot use position {slot}",
    placeTarget: "Place here",
    upgradeTarget: "Upgrade",
    replaceTarget: "Replace",
    replacementTitle: "Replace fighter?",
    replacementBody: "{old} will be removed and {card} will take its place.",
    confirmReplacement: "Replace",
    upgradedCard: "{card}, upgraded",
    boardPosition: "Position {slot}",
    fieldPosition: "{row}, {column}",
    frontRow: "front row",
    backRow: "back row",
    leftColumn: "left",
    centerColumn: "center",
    rightColumn: "right",
    upgradedStats: "Upgraded stats",
    emptySlot: "Empty position {slot}",
    moveUnit: "Move",
    moveUnitHint: "Moving: {card}",
    chooseMoveTarget: "Choose a new field position.",
    fight: "Fight",
    nextRound: "Next round",
    battleSpeed: "Battle speed",
    skipBattle: "Skip battle",
    battleInProgress: "Battle in progress, round {round} of {maxRounds}.",
    roundResultDetail: "{yourHp}: {playerHp} (−{playerLoss}) · {enemyHp}: {enemyHpValue} (−{enemyLoss})",
    sceneLoading: "Loading field…",
    battleResultReady: "Battle result ready.",
    battlefieldUnavailable: "Battlefield unavailable. Drafting still works.",
    rendererForced: "Battle animation disabled for testing. The result is ready; you can continue.",
    rendererUnavailable: "Battle animation unavailable. The result is ready; you can continue.",
    rendererInterrupted: "Battle animation stopped. The result is ready; you can continue.",
    rendererTimeout: "Battle animation took too long. The result is ready; you can continue.",
    draw: "Draw",
    yourHp: "Your HP",
    enemyHp: "Enemy HP",
    actions: "actions",
    hpLoss: "HP loss",
    you: "You",
    bot: "Bot",
    skipPickConfirm: "You can still choose one card this round. Fight anyway?",
  },
};

const CARD_TEXT: Record<"ru" | "uk", Record<CardId, LocalizedCardText>> = {
  ru: {
    iron_guard: {
      name: "Железный страж",
      text: "Начинает бой со щитом.",
      summary: "Начинает бой с небольшим запасом щита.",
    },
    shieldbearer: {
      name: "Щитоносец",
      text: "Провоцирует врагов и блокирует удары.",
      summary: "Только первый ряд. Провоцирует врагов и может полностью блокировать удары.",
    },
    boar_rider: {
      name: "Наездник на вепре",
      text: "Первый удар усилен.",
      summary: "Первый удар наносит дополнительный урон.",
    },
    sneakblade: {
      name: "Теневой клинок",
      text: "Атакует самого слабого врага.",
      summary: "Выбирает врага с наименьшим запасом HP.",
    },
    spear_recruit: {
      name: "Копейщик-рекрут",
      text: "Простой и надёжный боец.",
      summary: "Простой и надёжный боец передовой.",
    },
    longbow_hunter: {
      name: "Лучник-охотник",
      text: "Стреляет по врагу с наименьшим HP.",
      summary: "Атакует врага с наименьшим запасом HP.",
    },
    ember_mage: {
      name: "Маг углей",
      text: "Задевает соседние позиции.",
      summary: "Огненный шар наносит урон цели и бойцам на соседних позициях.",
    },
    frost_acolyte: {
      name: "Послушник мороза",
      text: "Первый удар снижает АТК.",
      summary: "Первый удар уменьшает атаку цели.",
    },
    grave_binder: {
      name: "Заклинатель могил",
      text: "Возвращается в виде скелета.",
      summary: "После гибели один раз возвращается слабым скелетом.",
    },
    bone_soldier: {
      name: "Костяной солдат",
      text: "Надёжный боец передовой.",
      summary: "Надёжный боец-нежить для ближнего боя.",
    },
    witch_doctor: {
      name: "Знахарь",
      text: "Лечит, затем атакует.",
      summary: "Перед атакой лечит самого раненого союзника.",
    },
    field_cleric: {
      name: "Полевой клирик",
      text: "Лечит вместо атаки.",
      summary: "Вместо атаки лечит союзника.",
    },
    wolfhound: {
      name: "Волкодав",
      text: "Становится сильнее рядом со зверями.",
      summary: "Получает усиление, если в отряде есть другой зверь.",
    },
    thorn_druid: {
      name: "Друид шипов",
      text: "В начале боя даёт союзникам щит.",
      summary: "В начале боя накладывает щит на союзников.",
    },
    stone_golem: {
      name: "Каменный голем",
      text: "Медленный и очень живучий.",
      summary: "Очень медленный, но его крайне трудно уничтожить.",
    },
    pyromancer: {
      name: "Пиромант",
      text: "Мощное заклинание по области.",
      summary: "Наносит усиленный урон цели и соседним позициям.",
    },
    duelist: {
      name: "Дуэлянт",
      text: "Начинает бой со щитом.",
      summary: "Начинает бой со щитом и наносит большой урон.",
    },
    banner_knight: {
      name: "Рыцарь-знаменосец",
      text: "Усиливает атаку союзников.",
      summary: "В начале боя повышает атаку союзников.",
    },
  },
  uk: {
    iron_guard: {
      name: "Залізний вартовий",
      text: "Починає бій зі щитом.",
      summary: "Починає бій із невеликим запасом щита.",
    },
    shieldbearer: {
      name: "Щитоносець",
      text: "Провокує ворогів і блокує удари.",
      summary: "Лише перший ряд. Провокує ворогів і може повністю блокувати удари.",
    },
    boar_rider: {
      name: "Вершник на вепрі",
      text: "Перший удар посилено.",
      summary: "Перший удар завдає додаткової шкоди.",
    },
    sneakblade: {
      name: "Тіньовий клинок",
      text: "Атакує найслабшого ворога.",
      summary: "Обирає ворога з найменшим запасом HP.",
    },
    spear_recruit: {
      name: "Списник-рекрут",
      text: "Простий і надійний боєць.",
      summary: "Простий і надійний боєць передової.",
    },
    longbow_hunter: {
      name: "Довголукий мисливець",
      text: "Стріляє у ворога з найменшим HP.",
      summary: "Атакує ворога з найменшим запасом HP.",
    },
    ember_mage: {
      name: "Маг жарин",
      text: "Зачіпає сусідні позиції.",
      summary: "Вогняна куля завдає шкоди цілі та бійцям на сусідніх позиціях.",
    },
    frost_acolyte: {
      name: "Послушник морозу",
      text: "Перший удар знижує АТК.",
      summary: "Перший удар зменшує атаку цілі.",
    },
    grave_binder: {
      name: "Заклинач могил",
      text: "Повертається у вигляді скелета.",
      summary: "Після загибелі один раз повертається слабким скелетом.",
    },
    bone_soldier: {
      name: "Кістяний воїн",
      text: "Надійний боєць передової.",
      summary: "Надійний боєць-нежить для ближнього бою.",
    },
    witch_doctor: {
      name: "Знахар",
      text: "Лікує, а потім атакує.",
      summary: "Перед атакою лікує найбільш пораненого союзника.",
    },
    field_cleric: {
      name: "Польовий клірик",
      text: "Лікує замість атаки.",
      summary: "Замість атаки лікує союзника.",
    },
    wolfhound: {
      name: "Вовкодав",
      text: "Стає сильнішим поруч зі звірами.",
      summary: "Отримує посилення, якщо в загоні є інший звір.",
    },
    thorn_druid: {
      name: "Терновий друїд",
      text: "На початку бою дає союзникам щит.",
      summary: "На початку бою накладає щит на союзників.",
    },
    stone_golem: {
      name: "Кам'яний голем",
      text: "Повільний і дуже витривалий.",
      summary: "Дуже повільний, але його вкрай важко знищити.",
    },
    pyromancer: {
      name: "Піромант",
      text: "Потужне закляття по області.",
      summary: "Завдає посиленої шкоди цілі та сусіднім позиціям.",
    },
    duelist: {
      name: "Дуелянт",
      text: "Починає бій зі щитом.",
      summary: "Починає бій зі щитом і завдає великої шкоди.",
    },
    banner_knight: {
      name: "Лицар-прапороносець",
      text: "Посилює атаку союзників.",
      summary: "На початку бою підвищує атаку союзників.",
    },
  },
};

const ARCHETYPE_LABELS: Record<SupportedLocale, Record<CardArchetype, string>> = {
  ru: { tank: "Танк", damage: "Урон", support: "Поддержка" },
  uk: { tank: "Танк", damage: "Шкода", support: "Підтримка" },
  en: { tank: "Tank", damage: "Damage", support: "Support" },
};

const RARITY_LABELS: Record<SupportedLocale, Record<CardRarity, string>> = {
  ru: { common: "Обычная", uncommon: "Необычная", rare: "Редкая" },
  uk: { common: "Звичайна", uncommon: "Незвичайна", rare: "Рідкісна" },
  en: { common: "Common", uncommon: "Uncommon", rare: "Rare" },
};

const TAG_LABELS: Record<SupportedLocale, Record<UnitTag, string>> = {
  ru: { warrior: "Воин", beast: "Зверь", mage: "Маг", undead: "Нежить", rogue: "Разбойник", guardian: "Страж" },
  uk: { warrior: "Воїн", beast: "Звір", mage: "Маг", undead: "Нежить", rogue: "Розбійник", guardian: "Вартовий" },
  en: { warrior: "Warrior", beast: "Beast", mage: "Mage", undead: "Undead", rogue: "Rogue", guardian: "Guardian" },
};

const COMBAT_EVENT_LABELS: Record<SupportedLocale, Record<LocalizedCombatEvent, string>> = {
  ru: {
    unit_attacked: "Атаки",
    unit_blocked: "Блоки",
    unit_damaged: "Попадания",
    unit_healed: "Лечение",
    unit_died: "Потери",
    synergy_applied: "Синергии",
  },
  uk: {
    unit_attacked: "Атаки",
    unit_blocked: "Блоки",
    unit_damaged: "Влучання",
    unit_healed: "Лікування",
    unit_died: "Втрати",
    synergy_applied: "Синергії",
  },
  en: {
    unit_attacked: "Attacks",
    unit_blocked: "Blocks",
    unit_damaged: "Hits",
    unit_healed: "Heals",
    unit_died: "Losses",
    synergy_applied: "Synergies",
  },
};

export function normalizeLocale(value: string | null | undefined): SupportedLocale | undefined {
  if (!value) {
    return undefined;
  }

  const language = value.trim().toLowerCase().split(/[-_]/, 1)[0];
  return SUPPORTED_LOCALES.find((locale) => locale === language);
}

export function resolveInitialLocale(savedLocale: string | null | undefined, navigatorLanguage: string | undefined): SupportedLocale {
  return normalizeLocale(savedLocale) ?? normalizeLocale(navigatorLanguage) ?? "en";
}

export function readStoredLocale(storage: KeyValueStorage | undefined): string | undefined {
  try {
    return storage?.getItem(LOCALE_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveLocale(storage: KeyValueStorage | undefined, locale: SupportedLocale): void {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // The selected language still applies to the current page when storage is unavailable.
  }
}

export function hasSeenHowTo(storage: KeyValueStorage | undefined): boolean {
  try {
    return storage?.getItem(HOW_TO_SEEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markHowToSeen(storage: KeyValueStorage | undefined): void {
  try {
    storage?.setItem(HOW_TO_SEEN_STORAGE_KEY, "1");
  } catch {
    // Showing the tutorial once per page session is still possible without storage.
  }
}

export function getUiCopy(locale: SupportedLocale): UiCopy {
  return UI_COPY[locale];
}

export function getLocalizedCard(locale: SupportedLocale, card: CardDefinition): LocalizedCardText {
  if (locale === "en") {
    return {
      name: card.name,
      text: card.cardText ?? card.summary,
      summary: card.summary,
    };
  }

  return CARD_TEXT[locale][card.id];
}

export function getArchetypeLabel(locale: SupportedLocale, archetype: CardArchetype): string {
  return ARCHETYPE_LABELS[locale][archetype];
}

export function getRarityLabel(locale: SupportedLocale, rarity: CardRarity): string {
  return RARITY_LABELS[locale][rarity];
}

export function getTagLabel(locale: SupportedLocale, tag: UnitTag): string {
  return TAG_LABELS[locale][tag];
}

export function getCombatEventLabel(locale: SupportedLocale, event: LocalizedCombatEvent): string {
  return COMBAT_EVENT_LABELS[locale][event];
}

export function formatMessage(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{([a-z]+)\}/gi, (placeholder, key: string) => {
    const value = values[key];
    return value === undefined ? placeholder : String(value);
  });
}
