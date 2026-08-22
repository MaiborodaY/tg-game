import type { SynergyEffect } from "./game/synergies";
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
  dailyChallengeTitle: string;
  dailyChallengeHint: string;
  dailyChallengePlay: string;
  runHistoryButton: string;
  runHistoryTitle: string;
  runHistoryIntro: string;
  runHistoryEmpty: string;
  runHistoryReplay: string;
  runHistoryReplayCurrentRules: string;
  runHistorySaveFailed: string;
  runHistoryDiscardConfirm: string;
  closeRunHistory: string;
  runSourceStandard: string;
  runSourceDaily: string;
  newLayout: string;
  sameLayout: string;
  shareResult: string;
  shareCopied: string;
  shareFailed: string;
  shareResultText: string;
  botDifficulty: string;
  botDifficultyStandard: string;
  botDifficultyStrong: string;
  botDifficultyStandardHint: string;
  botDifficultyStrongHint: string;
  onlineMode: string;
  pvpLobbyTitle: string;
  pvpLobbySubtitle: string;
  pvpCreateRoom: string;
  pvpJoinRoom: string;
  pvpRoomCode: string;
  pvpRoomCodePlaceholder: string;
  pvpCopyCode: string;
  pvpCodeCopied: string;
  pvpInviteHint: string;
  pvpReady: string;
  pvpCancelReady: string;
  pvpWaitingForOpponent: string;
  pvpWaitingForOpponentReady: string;
  pvpReconnect: string;
  pvpReconnecting: string;
  pvpLeaveRoom: string;
  pvpLeaveRoomConfirm: string;
  pvpForfeit: string;
  pvpForfeitConfirm: string;
  pvpReadyForNextRound: string;
  pvpWaitingForNextRound: string;
  pvpRematch: string;
  pvpRematchRequested: string;
  pvpWaitingForRematch: string;
  pvpPlayer: string;
  pvpOpponent: string;
  pvpSpectator: string;
  pvpStatusIdle: string;
  pvpStatusConnecting: string;
  pvpStatusConnected: string;
  pvpStatusError: string;
  pvpSlotOpen: string;
  pvpSlotJoined: string;
  pvpSlotReady: string;
  pvpCloseLobby: string;
  pvpErrorInvalidCode: string;
  pvpErrorConnectionClosed: string;
  pvpErrorConnectionFailed: string;
  pvpErrorBadMessage: string;
  pvpErrorRoom: string;
  pvpErrorRoomFull: string;
  pvpErrorRoomNotFound: string;
  pvpErrorStaleMatch: string;
  pvpErrorActionRejected: string;
  pvpErrorReconnectFailed: string;
  pvpErrorCopyFailed: string;
  pvpErrorInvalidToken: string;
  pvpErrorRateLimited: string;
  pvpErrorDisabled: string;
  pvpErrorOriginForbidden: string;
  pvpErrorInternal: string;
  pvpErrorBadRequest: string;
  howToPlay: string;
  compendium: string;
  compendiumTitle: string;
  compendiumIntro: string;
  compendiumCards: string;
  compendiumSynergies: string;
  compendiumUpgradeNote: string;
  compendiumTier: string;
  compendiumSynergyRule: string;
  compendiumSynergyTier: string;
  compendiumSynergyCards: string;
  closeCompendium: string;
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
  synergyCount: string;
  synergyActive: string;
  synergyProgress: string;
  synergyWillActivate: string;
  synergyMayActivate: string;
  synergyTierActive: string;
  synergyTierProgress: string;
  synergyForecastPlace: string;
  synergyForecastReplace: string;
  synergyForecastPossible: string;
  synergyForecastActivates: string;
  synergyForecastProgress: string;
  synergyForecastLoses: string;
  synergyForecastLosesTag: string;
  enemyArmy: string;
  enemyArmyHint: string;
  onboarding: string;
  chooseCard: string;
  slots: string;
  closeCardInfo: string;
  reroll: string;
  rerollUsed: string;
  rerollCounter: string;
  collapseDraftChoices: string;
  expandDraftChoices: string;
  selectedCard: string;
  draftUpgradeAvailable: string;
  draftAlreadyOnField: string;
  draftUpgradeAvailableDescription: string;
  draftAlreadyOnFieldDescription: string;
  upgradeHint: string;
  placeHint: string;
  replacementHint: string;
  makeRoomHint: string;
  cardInfo: string;
  cancel: string;
  cancelSelection: string;
  cancelMove: string;
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
  frontRowShort: string;
  backRowShort: string;
  leftColumn: string;
  centerColumn: string;
  rightColumn: string;
  upgradedStats: string;
  emptySlot: string;
  moveUnit: string;
  moveUnitHint: string;
  chooseMoveTarget: string;
  fight: string;
  skipPickAndFight: string;
  nextRound: string;
  battleSpeed: string;
  skipBattle: string;
  abandonRun: string;
  abandonRunConfirm: string;
  battleInProgress: string;
  roundResultDetail: string;
  roundInsightsTitle: string;
  roundInsightCastleDamage: string;
  roundInsightSurvivors: string;
  roundInsightHealing: string;
  roundInsightBlocking: string;
  roundInsightSummons: string;
  roundInsightSynergies: string;
  battleCalloutArmor: string;
  battleCalloutBanner: string;
  battleCalloutThorns: string;
  battleCalloutPack: string;
  battleCalloutFrost: string;
  battleCalloutUndeadMastery: string;
  battleCalloutBonePact: string;
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
  blockFeedback: string;
  skipPickConfirm: string;
}

export interface LocalizedCardText {
  name: string;
  text: string;
  summary: string;
}

type SynergyEffectCopyKey =
  | "warriorAttack"
  | "warriorArmor"
  | "beastAttack"
  | "beastSpeed"
  | "mageAttack"
  | "openingDamage"
  | "undeadHp"
  | "undeadDeathAttack"
  | "rogueAttack"
  | "rogueFirstAttack"
  | "guardianHp"
  | "guardianArmor";

const SYNERGY_EFFECT_COPY: Record<SupportedLocale, Record<SynergyEffectCopyKey, string>> = {
  ru: {
    warriorAttack: "+{value} АТК воинам",
    warriorArmor: "+{value} брони воинам",
    beastAttack: "+{value} АТК зверям",
    beastSpeed: "+{value} скорости зверям",
    mageAttack: "+{value} АТК магам-заклинателям и поддержке",
    openingDamage: "В начале боя: {value} урона каждому врагу",
    undeadHp: "+{value} HP нежити",
    undeadDeathAttack: "После первой гибели союзной нежити: +{value} АТК выжившей нежити",
    rogueAttack: "+{value} АТК разбойникам",
    rogueFirstAttack: "+{value} к первой атаке каждого разбойника",
    guardianHp: "+{value} HP стражам",
    guardianArmor: "+{value} брони всем союзникам",
  },
  uk: {
    warriorAttack: "+{value} АТК воїнам",
    warriorArmor: "+{value} броні воїнам",
    beastAttack: "+{value} АТК звірам",
    beastSpeed: "+{value} швидкості звірам",
    mageAttack: "+{value} АТК магам-заклиначам і підтримці",
    openingDamage: "На початку бою: {value} шкоди кожному ворогу",
    undeadHp: "+{value} HP нежиті",
    undeadDeathAttack: "Після першої загибелі союзної нежиті: +{value} АТК нежиті, що вижила",
    rogueAttack: "+{value} АТК розбійникам",
    rogueFirstAttack: "+{value} до першої атаки кожного розбійника",
    guardianHp: "+{value} HP вартовим",
    guardianArmor: "+{value} броні всім союзникам",
  },
  en: {
    warriorAttack: "+{value} ATK to Warriors",
    warriorArmor: "+{value} armor to Warriors",
    beastAttack: "+{value} ATK to Beasts",
    beastSpeed: "+{value} speed to Beasts",
    mageAttack: "+{value} ATK to Mage casters and supports",
    openingDamage: "Battle start: {value} damage to every enemy",
    undeadHp: "+{value} HP to Undead",
    undeadDeathAttack: "After the first allied Undead death: +{value} ATK to surviving Undead",
    rogueAttack: "+{value} ATK to Rogues",
    rogueFirstAttack: "+{value} to every Rogue's first attack",
    guardianHp: "+{value} HP to Guardians",
    guardianArmor: "+{value} armor to all allies",
  },
};

const SYNERGY_EFFECT_COMPACT_COPY: Record<SupportedLocale, Record<SynergyEffectCopyKey, string>> = {
  ru: {
    warriorAttack: "+{value} АТК воинам",
    warriorArmor: "+{value} броня воинам",
    beastAttack: "+{value} АТК зверям",
    beastSpeed: "+{value} скорость зверям",
    mageAttack: "+{value} АТК магам",
    openingDamage: "В начале: {value} урон всем",
    undeadHp: "+{value} HP нежити",
    undeadDeathAttack: "1-я гибель: +{value} АТК",
    rogueAttack: "+{value} АТК разбойникам",
    rogueFirstAttack: "Первая атака: +{value}",
    guardianHp: "+{value} HP стражам",
    guardianArmor: "+{value} броня всем",
  },
  uk: {
    warriorAttack: "+{value} АТК воїнам",
    warriorArmor: "+{value} броня воїнам",
    beastAttack: "+{value} АТК звірам",
    beastSpeed: "+{value} швидкість звірам",
    mageAttack: "+{value} АТК магам",
    openingDamage: "На початку: {value} шкоди всім",
    undeadHp: "+{value} HP нежиті",
    undeadDeathAttack: "1-ша загибель: +{value} АТК",
    rogueAttack: "+{value} АТК розбійникам",
    rogueFirstAttack: "Перша атака: +{value}",
    guardianHp: "+{value} HP вартовим",
    guardianArmor: "+{value} броня всім",
  },
  en: {
    warriorAttack: "+{value} ATK to Warriors",
    warriorArmor: "+{value} armor to Warriors",
    beastAttack: "+{value} ATK to Beasts",
    beastSpeed: "+{value} speed to Beasts",
    mageAttack: "+{value} ATK to Mages",
    openingDamage: "Battle start: {value} to all",
    undeadHp: "+{value} HP to Undead",
    undeadDeathAttack: "First death: +{value} ATK",
    rogueAttack: "+{value} ATK to Rogues",
    rogueFirstAttack: "First attack: +{value}",
    guardianHp: "+{value} HP to Guardians",
    guardianArmor: "+{value} armor to all",
  },
};

const UI_COPY: Record<SupportedLocale, UiCopy> = {
  ru: {
    language: "Язык",
    localeName: "Русский",
    menuSubtitle: "Соберите отряд и разрушьте крепость соперника за 15 раундов.",
    startRun: "Начать дуэль",
    dailyChallengeTitle: "Испытание дня",
    dailyChallengeHint: "Один расклад на сегодня · сильный бот · обновление в 00:00 UTC.",
    dailyChallengePlay: "Играть",
    runHistoryButton: "История · {count}/{limit}",
    runHistoryTitle: "Последние матчи",
    runHistoryIntro: "Хранятся локально на этом устройстве, до {limit} матчей.",
    runHistoryEmpty: "Здесь появятся завершённые матчи на этом устройстве.",
    runHistoryReplay: "Играть этот расклад",
    runHistoryReplayCurrentRules: "Играть этот расклад по текущим правилам",
    runHistorySaveFailed: "Не удалось сохранить результат. Освободите место в хранилище и попробуйте снова.",
    runHistoryDiscardConfirm: "Не удалось сохранить результат в историю. Продолжить без сохранения этого результата?",
    closeRunHistory: "Закрыть историю матчей",
    runSourceStandard: "Обычный матч",
    runSourceDaily: "Испытание дня",
    newLayout: "Новый расклад",
    sameLayout: "Тот же расклад",
    shareResult: "Поделиться",
    shareCopied: "Результат скопирован",
    shareFailed: "Не удалось поделиться — скопируйте результат вручную.",
    shareResultText: "⚔️ Bro Battler\n{outcome} · {difficulty}\nРаунды: {round}/{maxRounds} · HP: {playerHp}:{enemyHp}",
    botDifficulty: "Сложность бота",
    botDifficultyStandard: "Обычный",
    botDifficultyStrong: "Сильный",
    botDifficultyStandardHint: "Выбирает один из доступных вариантов и разумно размещает его.",
    botDifficultyStrongHint: "Сравнивает все три карты и выбирает сильнейшее усиление армии.",
    onlineMode: "Онлайн",
    pvpLobbyTitle: "Дуэль с игроком",
    pvpLobbySubtitle: "Создайте комнату и отправьте код сопернику или войдите по его коду.",
    pvpCreateRoom: "Создать комнату",
    pvpJoinRoom: "Войти",
    pvpRoomCode: "Код комнаты",
    pvpRoomCodePlaceholder: "Введите код",
    pvpCopyCode: "Копировать код",
    pvpCodeCopied: "Код скопирован",
    pvpInviteHint: "Отправьте этот код сопернику.",
    pvpReady: "Готов к бою",
    pvpCancelReady: "Отменить готовность",
    pvpWaitingForOpponent: "Ждём соперника…",
    pvpWaitingForOpponentReady: "Ждём готовности соперника…",
    pvpReconnect: "Переподключиться",
    pvpReconnecting: "Восстанавливаем соединение…",
    pvpLeaveRoom: "Выйти из комнаты",
    pvpLeaveRoomConfirm: "Выйти из комнаты? Текущий матч будет покинут.",
    pvpForfeit: "Сдаться",
    pvpForfeitConfirm: "Сдаться и завершить матч поражением?",
    pvpReadyForNextRound: "Готов к следующему раунду",
    pvpWaitingForNextRound: "Ждём готовности соперника к следующему раунду…",
    pvpRematch: "Реванш",
    pvpRematchRequested: "Запрос на реванш отправлен.",
    pvpWaitingForRematch: "Ждём ответа соперника…",
    pvpPlayer: "Вы",
    pvpOpponent: "Соперник",
    pvpSpectator: "Наблюдатель",
    pvpStatusIdle: "Не подключено",
    pvpStatusConnecting: "Подключение…",
    pvpStatusConnected: "В комнате",
    pvpStatusError: "Ошибка",
    pvpSlotOpen: "Свободно",
    pvpSlotJoined: "Подключён",
    pvpSlotReady: "Готов",
    pvpCloseLobby: "Закрыть PvP",
    pvpErrorInvalidCode: "Введите код из 3–48 букв или цифр.",
    pvpErrorConnectionClosed: "Соединение закрыто.",
    pvpErrorConnectionFailed: "Не удалось подключиться.",
    pvpErrorBadMessage: "Сервер прислал некорректный ответ.",
    pvpErrorRoom: "Ошибка комнаты.",
    pvpErrorRoomFull: "В комнате уже два игрока.",
    pvpErrorRoomNotFound: "Комната не найдена.",
    pvpErrorStaleMatch: "Матч уже изменился. Состояние обновлено.",
    pvpErrorActionRejected: "Действие недоступно в текущем состоянии матча.",
    pvpErrorReconnectFailed: "Не удалось вернуться в комнату.",
    pvpErrorCopyFailed: "Не удалось скопировать код.",
    pvpErrorInvalidToken: "Сессия комнаты устарела. Войдите заново.",
    pvpErrorRateLimited: "Слишком много действий. Подождите немного.",
    pvpErrorDisabled: "Онлайн-режим временно недоступен.",
    pvpErrorOriginForbidden: "Подключение с этого адреса запрещено.",
    pvpErrorInternal: "Ошибка сервера. Попробуйте ещё раз.",
    pvpErrorBadRequest: "Сервер не принял запрос.",
    howToPlay: "Как играть",
    compendium: "Карты и синергии",
    compendiumTitle: "Карты и синергии",
    compendiumIntro: "Изучите весь набор бойцов и точные бонусы синергий до начала дуэли.",
    compendiumCards: "Карты",
    compendiumSynergies: "Синергии",
    compendiumUpgradeNote: "При улучшении АТК и HP удваиваются. Скорость и дальность не меняются.",
    compendiumTier: "Тир {tier}",
    compendiumSynergyRule: "Бонусы открываются на 2 и 4 бойцах.",
    compendiumSynergyTier: "{threshold}/4 бойца: {effect}",
    compendiumSynergyCards: "Карты синергии: {cards}",
    closeCompendium: "Закрыть справочник",
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
    synergyCount: "Бойцов: {count}",
    synergyActive: "{tag}: {count}/{threshold}, активно, {effect}",
    synergyProgress: "{tag}: {count}/{threshold}, до активации {remaining}, {effect}",
    synergyWillActivate: "Активирует: {tag} {before}→{after}",
    synergyMayActivate: "Может активировать: {tag} {before}→{after}",
    synergyTierActive: "{threshold}/4 активно: {effect}",
    synergyTierProgress: "{threshold}/4 — осталось {remaining}: {effect}",
    synergyForecastPlace: "Размещение",
    synergyForecastReplace: "Замена",
    synergyForecastPossible: "зависит от позиции",
    synergyForecastActivates: "{tag} {before}→{after}: открывает {threshold}/4 — {effect}",
    synergyForecastProgress: "{tag} {before}→{after}: далее {threshold}/4 — {effect}",
    synergyForecastLoses: "{tag} {before}→{after}: теряет {threshold}/4 — {effect}",
    synergyForecastLosesTag: "{tag} {before}→{after}: бойцов этого типа станет меньше",
    enemyArmy: "Известная армия врага",
    enemyArmyHint: "+1 новая карта пока скрыта",
    onboarding: "Коснитесь карты и позиции на поле — или перетащите карту.",
    chooseCard: "Выберите одну карту",
    slots: "Места {filled}/{capacity}",
    closeCardInfo: "Закрыть описание карты",
    reroll: "Обновить",
    rerollUsed: "Обновлено",
    rerollCounter: "Обновление {remaining}/1",
    collapseDraftChoices: "Свернуть выбор карт",
    expandDraftChoices: "Развернуть выбор карт",
    selectedCard: "Выбран: {card}",
    draftUpgradeAvailable: "Улучшить",
    draftAlreadyOnField: "На поле",
    draftUpgradeAvailableDescription: "{card} уже на поле. Выбор этой карты улучшит бойца.",
    draftAlreadyOnFieldDescription: "{card} уже на поле на максимальном уровне. Эта карта не улучшит существующего бойца.",
    upgradeHint: "Коснитесь поля — существующий боец улучшится.",
    placeHint: "Коснитесь подходящей пустой позиции на поле.",
    replacementHint: "Поле заполнено. Выберите бойца, которого хотите заменить.",
    makeRoomHint: "Сначала освободите подходящую позицию, переместив бойца.",
    cardInfo: "О карте",
    cancel: "Отмена",
    cancelSelection: "Отменить выбор",
    cancelMove: "Отменить перемещение",
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
    frontRowShort: "Перед",
    backRowShort: "Тыл",
    leftColumn: "слева",
    centerColumn: "центр",
    rightColumn: "справа",
    upgradedStats: "Улучшенные характеристики",
    emptySlot: "Пустая позиция {slot}",
    moveUnit: "Переместить",
    moveUnitHint: "Перемещение: {card}",
    chooseMoveTarget: "Выберите новую позицию на поле.",
    fight: "В бой",
    skipPickAndFight: "Без карты — в бой",
    nextRound: "Следующий раунд",
    battleSpeed: "Скорость боя",
    skipBattle: "Пропустить бой",
    abandonRun: "Завершить",
    abandonRunConfirm: "Завершить текущую партию? Сохранённый прогресс будет удалён.",
    battleInProgress: "Идёт бой, раунд {round} из {maxRounds}.",
    roundResultDetail: "{yourHp}: {playerHp} (−{playerLoss}) · {enemyHp}: {enemyHpValue} (−{enemyLoss})",
    roundInsightsTitle: "Ключевые итоги",
    roundInsightCastleDamage: "Урон крепости: вы {player} · соперник {enemy}",
    roundInsightSurvivors: "Выжившие: вы {player} · соперник {enemy}",
    roundInsightHealing: "Лечение: вы {player} · соперник {enemy}",
    roundInsightBlocking: "Предотвращено урона: вы {player} · соперник {enemy}",
    roundInsightSummons: "Призывы: вы {player} · соперник {enemy}",
    roundInsightSynergies: "Синергии: вы {player} · соперник {enemy}",
    battleCalloutArmor: "БРОНЯ +{amount}",
    battleCalloutBanner: "ЗНАМЯ: +{amount} АТК",
    battleCalloutThorns: "ШИПЫ: +{amount} БРОНИ",
    battleCalloutPack: "СТАЯ: +{amount} АТК",
    battleCalloutFrost: "МОРОЗ: −{amount} АТК",
    battleCalloutUndeadMastery: "НЕЖИТЬ 4/4: +{amount} АТК",
    battleCalloutBonePact: "КОСТЯНОЙ ДОГОВОР",
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
    blockFeedback: "БЛОК",
    skipPickConfirm: "Вы ещё можете выбрать одну карту в этом раунде. Всё равно начать бой?",
  },
  uk: {
    language: "Мова",
    localeName: "Українська",
    menuSubtitle: "Зберіть загін і зруйнуйте фортецю суперника за 15 раундів.",
    startRun: "Почати дуель",
    dailyChallengeTitle: "Випробування дня",
    dailyChallengeHint: "Один розклад на сьогодні · сильний бот · оновлення о 00:00 UTC.",
    dailyChallengePlay: "Грати",
    runHistoryButton: "Історія · {count}/{limit}",
    runHistoryTitle: "Останні матчі",
    runHistoryIntro: "Зберігаються локально на цьому пристрої, до {limit} матчів.",
    runHistoryEmpty: "Тут з’являться завершені матчі на цьому пристрої.",
    runHistoryReplay: "Грати цей розклад",
    runHistoryReplayCurrentRules: "Грати цей розклад за поточними правилами",
    runHistorySaveFailed: "Не вдалося зберегти результат. Звільніть місце у сховищі та спробуйте ще раз.",
    runHistoryDiscardConfirm: "Не вдалося зберегти результат в історії. Продовжити без збереження цього результату?",
    closeRunHistory: "Закрити історію матчів",
    runSourceStandard: "Звичайний матч",
    runSourceDaily: "Випробування дня",
    newLayout: "Новий розклад",
    sameLayout: "Той самий розклад",
    shareResult: "Поділитися",
    shareCopied: "Результат скопійовано",
    shareFailed: "Не вдалося поділитися — скопіюйте результат вручну.",
    shareResultText: "⚔️ Bro Battler\n{outcome} · {difficulty}\nРаунди: {round}/{maxRounds} · HP: {playerHp}:{enemyHp}",
    botDifficulty: "Складність бота",
    botDifficultyStandard: "Звичайний",
    botDifficultyStrong: "Сильний",
    botDifficultyStandardHint: "Обирає один із доступних варіантів і розумно розміщує його.",
    botDifficultyStrongHint: "Порівнює всі три карти й обирає найсильніше посилення армії.",
    onlineMode: "Онлайн",
    pvpLobbyTitle: "Дуель із гравцем",
    pvpLobbySubtitle: "Створіть кімнату й надішліть код супернику або увійдіть за його кодом.",
    pvpCreateRoom: "Створити кімнату",
    pvpJoinRoom: "Увійти",
    pvpRoomCode: "Код кімнати",
    pvpRoomCodePlaceholder: "Введіть код",
    pvpCopyCode: "Копіювати код",
    pvpCodeCopied: "Код скопійовано",
    pvpInviteHint: "Надішліть цей код супернику.",
    pvpReady: "Готовий до бою",
    pvpCancelReady: "Скасувати готовність",
    pvpWaitingForOpponent: "Чекаємо на суперника…",
    pvpWaitingForOpponentReady: "Чекаємо на готовність суперника…",
    pvpReconnect: "Підключитися знову",
    pvpReconnecting: "Відновлюємо з’єднання…",
    pvpLeaveRoom: "Вийти з кімнати",
    pvpLeaveRoomConfirm: "Вийти з кімнати? Поточний матч буде залишено.",
    pvpForfeit: "Здатися",
    pvpForfeitConfirm: "Здатися й завершити матч поразкою?",
    pvpReadyForNextRound: "Готовий до наступного раунду",
    pvpWaitingForNextRound: "Чекаємо на готовність суперника до наступного раунду…",
    pvpRematch: "Реванш",
    pvpRematchRequested: "Запит на реванш надіслано.",
    pvpWaitingForRematch: "Чекаємо на відповідь суперника…",
    pvpPlayer: "Ви",
    pvpOpponent: "Суперник",
    pvpSpectator: "Спостерігач",
    pvpStatusIdle: "Не підключено",
    pvpStatusConnecting: "Підключення…",
    pvpStatusConnected: "У кімнаті",
    pvpStatusError: "Помилка",
    pvpSlotOpen: "Вільно",
    pvpSlotJoined: "Підключено",
    pvpSlotReady: "Готовий",
    pvpCloseLobby: "Закрити PvP",
    pvpErrorInvalidCode: "Введіть код із 3–48 літер або цифр.",
    pvpErrorConnectionClosed: "З’єднання закрито.",
    pvpErrorConnectionFailed: "Не вдалося підключитися.",
    pvpErrorBadMessage: "Сервер надіслав некоректну відповідь.",
    pvpErrorRoom: "Помилка кімнати.",
    pvpErrorRoomFull: "У кімнаті вже два гравці.",
    pvpErrorRoomNotFound: "Кімнату не знайдено.",
    pvpErrorStaleMatch: "Матч уже змінився. Стан оновлено.",
    pvpErrorActionRejected: "Дія недоступна в поточному стані матчу.",
    pvpErrorReconnectFailed: "Не вдалося повернутися до кімнати.",
    pvpErrorCopyFailed: "Не вдалося скопіювати код.",
    pvpErrorInvalidToken: "Сесія кімнати застаріла. Увійдіть знову.",
    pvpErrorRateLimited: "Забагато дій. Трохи зачекайте.",
    pvpErrorDisabled: "Онлайн-режим тимчасово недоступний.",
    pvpErrorOriginForbidden: "Підключення з цієї адреси заборонено.",
    pvpErrorInternal: "Помилка сервера. Спробуйте ще раз.",
    pvpErrorBadRequest: "Сервер не прийняв запит.",
    howToPlay: "Як грати",
    compendium: "Карти й синергії",
    compendiumTitle: "Карти й синергії",
    compendiumIntro: "Перегляньте весь набір бійців і точні бонуси синергій до початку дуелі.",
    compendiumCards: "Карти",
    compendiumSynergies: "Синергії",
    compendiumUpgradeNote: "Після покращення АТК і HP подвоюються. Швидкість і дальність не змінюються.",
    compendiumTier: "Тир {tier}",
    compendiumSynergyRule: "Бонуси відкриваються на 2 і 4 бійцях.",
    compendiumSynergyTier: "{threshold}/4 бійці: {effect}",
    compendiumSynergyCards: "Карти синергії: {cards}",
    closeCompendium: "Закрити довідник",
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
    synergyCount: "Бійців: {count}",
    synergyActive: "{tag}: {count}/{threshold}, активно, {effect}",
    synergyProgress: "{tag}: {count}/{threshold}, до активації {remaining}, {effect}",
    synergyWillActivate: "Активує: {tag} {before}→{after}",
    synergyMayActivate: "Може активувати: {tag} {before}→{after}",
    synergyTierActive: "{threshold}/4 активно: {effect}",
    synergyTierProgress: "{threshold}/4 — залишилося {remaining}: {effect}",
    synergyForecastPlace: "Розміщення",
    synergyForecastReplace: "Заміна",
    synergyForecastPossible: "залежить від позиції",
    synergyForecastActivates: "{tag} {before}→{after}: відкриває {threshold}/4 — {effect}",
    synergyForecastProgress: "{tag} {before}→{after}: далі {threshold}/4 — {effect}",
    synergyForecastLoses: "{tag} {before}→{after}: втрачає {threshold}/4 — {effect}",
    synergyForecastLosesTag: "{tag} {before}→{after}: бійців цього типу стане менше",
    enemyArmy: "Відома армія ворога",
    enemyArmyHint: "+1 нова карта поки прихована",
    onboarding: "Торкніться карти й позиції на полі — або перетягніть карту.",
    chooseCard: "Виберіть одну карту",
    slots: "Місця {filled}/{capacity}",
    closeCardInfo: "Закрити опис карти",
    reroll: "Оновити",
    rerollUsed: "Оновлено",
    rerollCounter: "Оновлення {remaining}/1",
    collapseDraftChoices: "Згорнути вибір карт",
    expandDraftChoices: "Розгорнути вибір карт",
    selectedCard: "Обрано: {card}",
    draftUpgradeAvailable: "Покращити",
    draftAlreadyOnField: "На полі",
    draftUpgradeAvailableDescription: "{card} вже на полі. Вибір цієї карти покращить бійця.",
    draftAlreadyOnFieldDescription: "{card} вже на полі на максимальному рівні. Ця карта не покращить наявного бійця.",
    upgradeHint: "Торкніться поля — наявний боєць покращиться.",
    placeHint: "Торкніться відповідної порожньої позиції на полі.",
    replacementHint: "Поле заповнене. Виберіть бійця, якого хочете замінити.",
    makeRoomHint: "Спочатку звільніть відповідну позицію, перемістивши бійця.",
    cardInfo: "Про карту",
    cancel: "Скасувати",
    cancelSelection: "Скасувати вибір",
    cancelMove: "Скасувати переміщення",
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
    frontRowShort: "Перед",
    backRowShort: "Тил",
    leftColumn: "ліворуч",
    centerColumn: "центр",
    rightColumn: "праворуч",
    upgradedStats: "Покращені характеристики",
    emptySlot: "Порожня позиція {slot}",
    moveUnit: "Перемістити",
    moveUnitHint: "Переміщення: {card}",
    chooseMoveTarget: "Виберіть нову позицію на полі.",
    fight: "У бій",
    skipPickAndFight: "Без карти — у бій",
    nextRound: "Наступний раунд",
    battleSpeed: "Швидкість бою",
    skipBattle: "Пропустити бій",
    abandonRun: "Завершити",
    abandonRunConfirm: "Завершити поточну партію? Збережений прогрес буде видалено.",
    battleInProgress: "Триває бій, раунд {round} із {maxRounds}.",
    roundResultDetail: "{yourHp}: {playerHp} (−{playerLoss}) · {enemyHp}: {enemyHpValue} (−{enemyLoss})",
    roundInsightsTitle: "Ключові підсумки",
    roundInsightCastleDamage: "Шкода фортеці: ви {player} · суперник {enemy}",
    roundInsightSurvivors: "Вижили: ви {player} · суперник {enemy}",
    roundInsightHealing: "Лікування: ви {player} · суперник {enemy}",
    roundInsightBlocking: "Відвернено шкоди: ви {player} · суперник {enemy}",
    roundInsightSummons: "Заклики: ви {player} · суперник {enemy}",
    roundInsightSynergies: "Синергії: ви {player} · суперник {enemy}",
    battleCalloutArmor: "БРОНЯ +{amount}",
    battleCalloutBanner: "ПРАПОР: +{amount} АТК",
    battleCalloutThorns: "ШИПИ: +{amount} БРОНІ",
    battleCalloutPack: "ЗГРАЯ: +{amount} АТК",
    battleCalloutFrost: "МОРОЗ: −{amount} АТК",
    battleCalloutUndeadMastery: "НЕЖИТЬ 4/4: +{amount} АТК",
    battleCalloutBonePact: "КІСТЯНИЙ ДОГОВІР",
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
    blockFeedback: "БЛОК",
    skipPickConfirm: "Ви ще можете вибрати одну карту в цьому раунді. Усе одно почати бій?",
  },
  en: {
    language: "Language",
    localeName: "English",
    menuSubtitle: "Build a squad and destroy the rival keep within 15 rounds.",
    startRun: "Start duel",
    dailyChallengeTitle: "Daily challenge",
    dailyChallengeHint: "One layout today · strong bot · resets at 00:00 UTC.",
    dailyChallengePlay: "Play",
    runHistoryButton: "History · {count}/{limit}",
    runHistoryTitle: "Recent matches",
    runHistoryIntro: "Stored locally on this device, up to {limit} matches.",
    runHistoryEmpty: "Completed matches on this device will appear here.",
    runHistoryReplay: "Play this layout",
    runHistoryReplayCurrentRules: "Play this layout with current rules",
    runHistorySaveFailed: "Could not save the result. Free storage space and try again.",
    runHistoryDiscardConfirm: "Could not save the result to history. Continue without saving this result?",
    closeRunHistory: "Close match history",
    runSourceStandard: "Standard match",
    runSourceDaily: "Daily challenge",
    newLayout: "New layout",
    sameLayout: "Same layout",
    shareResult: "Share",
    shareCopied: "Result copied",
    shareFailed: "Could not share — copy the result manually.",
    shareResultText: "⚔️ Bro Battler\n{outcome} · {difficulty}\nRounds: {round}/{maxRounds} · HP: {playerHp}:{enemyHp}",
    botDifficulty: "Bot difficulty",
    botDifficultyStandard: "Normal",
    botDifficultyStrong: "Strong",
    botDifficultyStandardHint: "Chooses one available option and places it sensibly.",
    botDifficultyStrongHint: "Compares all three cards and chooses the strongest army upgrade.",
    onlineMode: "Online",
    pvpLobbyTitle: "Player duel",
    pvpLobbySubtitle: "Create a room and send its code to your opponent, or join with their code.",
    pvpCreateRoom: "Create room",
    pvpJoinRoom: "Join",
    pvpRoomCode: "Room code",
    pvpRoomCodePlaceholder: "Enter code",
    pvpCopyCode: "Copy code",
    pvpCodeCopied: "Code copied",
    pvpInviteHint: "Send this code to your opponent.",
    pvpReady: "Ready to fight",
    pvpCancelReady: "Cancel ready",
    pvpWaitingForOpponent: "Waiting for opponent…",
    pvpWaitingForOpponentReady: "Waiting for opponent to be ready…",
    pvpReconnect: "Reconnect",
    pvpReconnecting: "Restoring connection…",
    pvpLeaveRoom: "Leave room",
    pvpLeaveRoomConfirm: "Leave the room? You will exit the current match.",
    pvpForfeit: "Forfeit",
    pvpForfeitConfirm: "Forfeit and end the match with a loss?",
    pvpReadyForNextRound: "Ready for next round",
    pvpWaitingForNextRound: "Waiting for opponent to be ready for the next round…",
    pvpRematch: "Rematch",
    pvpRematchRequested: "Rematch request sent.",
    pvpWaitingForRematch: "Waiting for opponent’s answer…",
    pvpPlayer: "You",
    pvpOpponent: "Opponent",
    pvpSpectator: "Spectator",
    pvpStatusIdle: "Not connected",
    pvpStatusConnecting: "Connecting…",
    pvpStatusConnected: "In room",
    pvpStatusError: "Error",
    pvpSlotOpen: "Open",
    pvpSlotJoined: "Joined",
    pvpSlotReady: "Ready",
    pvpCloseLobby: "Close PvP",
    pvpErrorInvalidCode: "Enter a code with 3–48 letters or numbers.",
    pvpErrorConnectionClosed: "Connection closed.",
    pvpErrorConnectionFailed: "Could not connect.",
    pvpErrorBadMessage: "The server sent an invalid response.",
    pvpErrorRoom: "Room error.",
    pvpErrorRoomFull: "The room already has two players.",
    pvpErrorRoomNotFound: "Room not found.",
    pvpErrorStaleMatch: "The match has changed. Its state was refreshed.",
    pvpErrorActionRejected: "That action is unavailable in the current match state.",
    pvpErrorReconnectFailed: "Could not return to the room.",
    pvpErrorCopyFailed: "Could not copy the code.",
    pvpErrorInvalidToken: "The room session expired. Join again.",
    pvpErrorRateLimited: "Too many actions. Wait a moment.",
    pvpErrorDisabled: "Online mode is temporarily unavailable.",
    pvpErrorOriginForbidden: "Connections from this address are not allowed.",
    pvpErrorInternal: "Server error. Try again.",
    pvpErrorBadRequest: "The server rejected the request.",
    howToPlay: "How to play",
    compendium: "Cards & synergies",
    compendiumTitle: "Cards & synergies",
    compendiumIntro: "Review every fighter and the exact synergy bonuses before starting a duel.",
    compendiumCards: "Cards",
    compendiumSynergies: "Synergies",
    compendiumUpgradeNote: "Upgrades double ATK and HP. Speed and range do not change.",
    compendiumTier: "Tier {tier}",
    compendiumSynergyRule: "Bonuses unlock at 2 and 4 fighters.",
    compendiumSynergyTier: "{threshold}/4 fighters: {effect}",
    compendiumSynergyCards: "Synergy cards: {cards}",
    closeCompendium: "Close compendium",
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
    synergyCount: "Fighters: {count}",
    synergyActive: "{tag}: {count}/{threshold}, active, {effect}",
    synergyProgress: "{tag}: {count}/{threshold}, {remaining} more to activate, {effect}",
    synergyWillActivate: "Activates: {tag} {before}→{after}",
    synergyMayActivate: "Can activate: {tag} {before}→{after}",
    synergyTierActive: "{threshold}/4 active: {effect}",
    synergyTierProgress: "{threshold}/4 — {remaining} more: {effect}",
    synergyForecastPlace: "Placement",
    synergyForecastReplace: "Replacement",
    synergyForecastPossible: "depends on position",
    synergyForecastActivates: "{tag} {before}→{after}: unlocks {threshold}/4 — {effect}",
    synergyForecastProgress: "{tag} {before}→{after}: next {threshold}/4 — {effect}",
    synergyForecastLoses: "{tag} {before}→{after}: loses {threshold}/4 — {effect}",
    synergyForecastLosesTag: "{tag} {before}→{after}: fewer fighters with this tag",
    enemyArmy: "Known enemy army",
    enemyArmyHint: "+1 new card is still hidden",
    onboarding: "Tap a card and a field slot—or drag the card.",
    chooseCard: "Choose one card",
    slots: "Slots {filled}/{capacity}",
    closeCardInfo: "Close card details",
    reroll: "Refresh",
    rerollUsed: "Refreshed",
    rerollCounter: "Refresh {remaining}/1",
    collapseDraftChoices: "Collapse card choices",
    expandDraftChoices: "Expand card choices",
    selectedCard: "Selected: {card}",
    draftUpgradeAvailable: "Upgrade",
    draftAlreadyOnField: "On field",
    draftUpgradeAvailableDescription: "{card} is already on the field. Choosing this card upgrades that fighter.",
    draftAlreadyOnFieldDescription: "{card} is already on the field at max level. This card will not upgrade the existing fighter.",
    upgradeHint: "Tap the field to upgrade your existing fighter.",
    placeHint: "Tap a valid empty position on the field.",
    replacementHint: "The field is full. Choose the fighter you want to replace.",
    makeRoomHint: "Move a fighter first to free a valid position.",
    cardInfo: "Card details",
    cancel: "Cancel",
    cancelSelection: "Cancel selection",
    cancelMove: "Cancel move",
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
    frontRowShort: "Front",
    backRowShort: "Back",
    leftColumn: "left",
    centerColumn: "center",
    rightColumn: "right",
    upgradedStats: "Upgraded stats",
    emptySlot: "Empty position {slot}",
    moveUnit: "Move",
    moveUnitHint: "Moving: {card}",
    chooseMoveTarget: "Choose a new field position.",
    fight: "Fight",
    skipPickAndFight: "Skip card & fight",
    nextRound: "Next round",
    battleSpeed: "Battle speed",
    skipBattle: "Skip battle",
    abandonRun: "End run",
    abandonRunConfirm: "End the current run? Saved progress will be deleted.",
    battleInProgress: "Battle in progress, round {round} of {maxRounds}.",
    roundResultDetail: "{yourHp}: {playerHp} (−{playerLoss}) · {enemyHp}: {enemyHpValue} (−{enemyLoss})",
    roundInsightsTitle: "Key results",
    roundInsightCastleDamage: "Keep damage: you {player} · rival {enemy}",
    roundInsightSurvivors: "Survivors: you {player} · rival {enemy}",
    roundInsightHealing: "Healing: you {player} · rival {enemy}",
    roundInsightBlocking: "Damage prevented: you {player} · rival {enemy}",
    roundInsightSummons: "Summons: you {player} · rival {enemy}",
    roundInsightSynergies: "Synergies: you {player} · rival {enemy}",
    battleCalloutArmor: "ARMOR +{amount}",
    battleCalloutBanner: "BANNER: +{amount} ATK",
    battleCalloutThorns: "THORNS: +{amount} ARMOR",
    battleCalloutPack: "PACK: +{amount} ATK",
    battleCalloutFrost: "FROST: −{amount} ATK",
    battleCalloutUndeadMastery: "UNDEAD 4/4: +{amount} ATK",
    battleCalloutBonePact: "BONE PACT",
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
    blockFeedback: "BLOCK",
    skipPickConfirm: "You can still choose one card this round. Fight anyway?",
  },
};

const CARD_TEXT: Record<"ru" | "uk", Record<CardId, LocalizedCardText>> = {
  ru: {
    iron_guard: {
      name: "Железный страж",
      text: "В начале боя получает 3 брони.",
      summary: "В начале боя получает 3 единицы брони, которые поглощают входящий урон.",
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
      text: "Возвращается скелетом 2/4; после улучшения — 3/6.",
      summary: "После гибели один раз возвращается скелетом с 2 АТК и 4 HP; после улучшения — с 3 АТК и 6 HP.",
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
      text: "В начале боя даёт союзникам 1 броню.",
      summary: "В начале боя каждый союзник получает 1 броню.",
    },
    stone_golem: {
      name: "Каменный голем",
      text: "В начале боя получает 5 брони.",
      summary: "Очень медленный и живучий; начинает бой с 5 бронёй.",
    },
    pyromancer: {
      name: "Пиромант",
      text: "Мощное заклинание по области.",
      summary: "Наносит усиленный урон цели и соседним позициям.",
    },
    duelist: {
      name: "Дуэлянт",
      text: "В начале боя получает 2 брони.",
      summary: "Броня поглощает первые 2 единицы урона; сам Дуэлянт сильно атакует.",
    },
    banner_knight: {
      name: "Рыцарь-знаменосец",
      text: "Усиливает атаку союзников.",
      summary: "В начале боя повышает атаку союзников.",
    },
    bone_archer: {
      name: "Костяной лучник",
      text: "Стреляет по врагу с наименьшим HP.",
      summary: "Атакует врага с наименьшим текущим запасом HP.",
    },
    plague_rat: {
      name: "Чумная крыса",
      text: "Получает +1 АТК, если в отряде есть другой Зверь.",
      summary: "В начале боя получает +1 АТК, если в отряде есть другой Зверь.",
    },
    rune_warden: {
      name: "Рунный хранитель",
      text: "В начале боя получает 3 брони.",
      summary: "В начале боя получает 3 единицы брони, которые поглощают входящий урон.",
    },
    forest_skirmisher: {
      name: "Лесной застрельщик",
      text: "Первый выстрел наносит дополнительно 2 урона.",
      summary: "Первая атака наносит дополнительно 2 урона.",
    },
    marsh_stalker: {
      name: "Болотный лазутчик",
      text: "Атакует врага с наименьшим HP; первый удар наносит дополнительно 1 урон.",
      summary: "Охотится на врага с наименьшим текущим HP, а первая атака наносит дополнительно 1 урон.",
    },
    crypt_keeper: {
      name: "Хранитель склепа",
      text: "Вместо атаки восстанавливает союзнику до 2 HP.",
      summary: "Вместо атаки восстанавливает до 2 HP самому раненому союзнику.",
    },
    battle_alchemist: {
      name: "Боевой алхимик",
      text: "Восстанавливает союзнику до 2 HP, затем атакует.",
      summary: "Перед атакой восстанавливает до 2 HP самому раненому союзнику.",
    },
    night_warden: {
      name: "Ночной страж",
      text: "В начале боя получает 2 брони.",
      summary: "В начале боя получает 2 единицы брони, которые поглощают входящий урон.",
    },
    grave_raider: {
      name: "Могильный рейдер",
      text: "Первый удар наносит дополнительно 2 урона.",
      summary: "Первая атака наносит дополнительно 2 урона.",
    },
    frost_wraith: {
      name: "Ледяной призрак",
      text: "Первый удар снижает АТК цели на 1.",
      summary: "Первая атака снижает АТК цели на 1, но не ниже 1.",
    },
    ironhide_bear: {
      name: "Железношкурый медведь",
      text: "В начале боя даёт каждому союзнику 1 броню.",
      summary: "В начале боя каждый союзник получает 1 броню.",
    },
    soul_hunter: {
      name: "Охотник за душами",
      text: "Атакует врага с наименьшим HP; первый удар наносит дополнительно 1 урон.",
      summary: "Охотится на врага с наименьшим текущим HP, а первая атака наносит дополнительно 1 урон.",
    },
    city_crossbowman: {
      name: "Арбалетчик цитадели",
      text: "Атакует врага с наименьшим текущим HP.",
      summary: "Выбирает целью врага с наименьшим текущим запасом HP.",
    },
    harpy_scout: {
      name: "Гарпия-разведчица",
      text: "Получает +1 АТК, если в отряде есть другой Зверь.",
      summary: "В начале боя получает +1 АТК, если в отряде есть другой Зверь.",
    },
    smoke_trickster: {
      name: "Дымный иллюзионист",
      text: "Первый удар снижает АТК цели на 1.",
      summary: "Первая атака снижает АТК цели на 1, но не ниже 1.",
    },
    war_mastiff: {
      name: "Боевой мастиф",
      text: "В начале боя получает 3 брони.",
      summary: "В начале боя получает 3 единицы брони, которые поглощают входящий урон.",
    },
    grave_bellringer: {
      name: "Могильный звонарь",
      text: "В начале боя даёт всем остальным союзникам +1 АТК.",
      summary: "В начале боя каждый другой союзник получает +1 АТК.",
    },
    moon_priestess: {
      name: "Лунная жрица",
      text: "Восстанавливает союзнику до 2 HP, затем атакует.",
      summary: "Перед атакой восстанавливает до 2 HP раненому союзнику с наименьшим текущим HP.",
    },
    phantom_duelist: {
      name: "Призрачный дуэлянт",
      text: "В начале боя получает 2 брони.",
      summary: "В начале боя получает 2 единицы брони, которые поглощают входящий урон.",
    },
    siege_engineer: {
      name: "Осадный инженер",
      text: "Наносит 1 урон врагам на соседних с целью позициях.",
      summary: "Каждая атака также наносит 1 урон врагам на позициях, соседних с целью.",
    },
    bronze_minotaur: {
      name: "Бронзовый минотавр",
      text: "В начале боя получает 5 брони.",
      summary: "В начале боя получает 5 единиц брони, которые поглощают входящий урон.",
    },
    headless_knight: {
      name: "Безголовый рыцарь",
      text: "Первый удар наносит дополнительно 2 урона.",
      summary: "Первая атака наносит дополнительно 2 урона.",
    },
    star_seer: {
      name: "Звёздный провидец",
      text: "Атакует врага с наименьшим текущим HP.",
      summary: "Выбирает целью врага с наименьшим текущим запасом HP.",
    },
    war_chaplain: {
      name: "Боевой капеллан",
      text: "В начале боя даёт каждому союзнику 1 броню.",
      summary: "В начале боя каждый союзник получает 1 броню.",
    },
  },
  uk: {
    iron_guard: {
      name: "Залізний вартовий",
      text: "На початку бою отримує 3 броні.",
      summary: "На початку бою отримує 3 одиниці броні, що поглинають вхідну шкоду.",
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
      text: "Повертається скелетом 2/4; після покращення — 3/6.",
      summary: "Після загибелі один раз повертається скелетом із 2 АТК і 4 HP; після покращення — із 3 АТК і 6 HP.",
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
      text: "На початку бою дає союзникам 1 броню.",
      summary: "На початку бою кожен союзник отримує 1 броню.",
    },
    stone_golem: {
      name: "Кам'яний голем",
      text: "На початку бою отримує 5 броні.",
      summary: "Дуже повільний і витривалий; починає бій із 5 броні.",
    },
    pyromancer: {
      name: "Піромант",
      text: "Потужне закляття по області.",
      summary: "Завдає посиленої шкоди цілі та сусіднім позиціям.",
    },
    duelist: {
      name: "Дуелянт",
      text: "На початку бою отримує 2 броні.",
      summary: "Броня поглинає перші 2 одиниці шкоди; сам Дуелянт сильно атакує.",
    },
    banner_knight: {
      name: "Лицар-прапороносець",
      text: "Посилює атаку союзників.",
      summary: "На початку бою підвищує атаку союзників.",
    },
    bone_archer: {
      name: "Кістяний лучник",
      text: "Стріляє у ворога з найменшим HP.",
      summary: "Атакує ворога з найменшим поточним запасом HP.",
    },
    plague_rat: {
      name: "Чумний пацюк",
      text: "Отримує +1 АТК, якщо в загоні є інший Звір.",
      summary: "На початку бою отримує +1 АТК, якщо в загоні є інший Звір.",
    },
    rune_warden: {
      name: "Рунічний вартовий",
      text: "На початку бою отримує 3 броні.",
      summary: "На початку бою отримує 3 одиниці броні, що поглинають вхідну шкоду.",
    },
    forest_skirmisher: {
      name: "Лісовий застрільник",
      text: "Перший постріл завдає додатково 2 шкоди.",
      summary: "Перша атака завдає додатково 2 шкоди.",
    },
    marsh_stalker: {
      name: "Болотяний розвідник",
      text: "Атакує ворога з найменшим HP; перший удар завдає додатково 1 шкоди.",
      summary: "Полює на ворога з найменшим поточним HP, а перша атака завдає додатково 1 шкоди.",
    },
    crypt_keeper: {
      name: "Доглядач склепу",
      text: "Замість атаки відновлює союзнику до 2 HP.",
      summary: "Замість атаки відновлює до 2 HP найбільш пораненому союзнику.",
    },
    battle_alchemist: {
      name: "Бойовий алхімік",
      text: "Відновлює союзнику до 2 HP, а потім атакує.",
      summary: "Перед атакою відновлює до 2 HP найбільш пораненому союзнику.",
    },
    night_warden: {
      name: "Нічний вартовий",
      text: "На початку бою отримує 2 броні.",
      summary: "На початку бою отримує 2 одиниці броні, що поглинають вхідну шкоду.",
    },
    grave_raider: {
      name: "Могильний рейдер",
      text: "Перший удар завдає додатково 2 шкоди.",
      summary: "Перша атака завдає додатково 2 шкоди.",
    },
    frost_wraith: {
      name: "Крижаний привид",
      text: "Перший удар знижує АТК цілі на 1.",
      summary: "Перша атака знижує АТК цілі на 1, але не нижче 1.",
    },
    ironhide_bear: {
      name: "Залізношкірий ведмідь",
      text: "На початку бою дає кожному союзнику 1 броню.",
      summary: "На початку бою кожен союзник отримує 1 броню.",
    },
    soul_hunter: {
      name: "Мисливець за душами",
      text: "Атакує ворога з найменшим HP; перший удар завдає додатково 1 шкоди.",
      summary: "Полює на ворога з найменшим поточним HP, а перша атака завдає додатково 1 шкоди.",
    },
    city_crossbowman: {
      name: "Арбалетник цитаделі",
      text: "Атакує ворога з найменшим поточним HP.",
      summary: "Обирає ціллю ворога з найменшим поточним запасом HP.",
    },
    harpy_scout: {
      name: "Гарпія-розвідниця",
      text: "Отримує +1 АТК, якщо в загоні є інший Звір.",
      summary: "На початку бою отримує +1 АТК, якщо в загоні є інший Звір.",
    },
    smoke_trickster: {
      name: "Димний ілюзіоніст",
      text: "Перший удар знижує АТК цілі на 1.",
      summary: "Перша атака знижує АТК цілі на 1, але не нижче 1.",
    },
    war_mastiff: {
      name: "Бойовий мастиф",
      text: "На початку бою отримує 3 броні.",
      summary: "На початку бою отримує 3 одиниці броні, що поглинають вхідну шкоду.",
    },
    grave_bellringer: {
      name: "Могильний дзвонар",
      text: "На початку бою дає всім іншим союзникам +1 АТК.",
      summary: "На початку бою кожен інший союзник отримує +1 АТК.",
    },
    moon_priestess: {
      name: "Місячна жриця",
      text: "Відновлює союзнику до 2 HP, а потім атакує.",
      summary: "Перед атакою відновлює до 2 HP пораненому союзнику з найменшим поточним HP.",
    },
    phantom_duelist: {
      name: "Примарний дуелянт",
      text: "На початку бою отримує 2 броні.",
      summary: "На початку бою отримує 2 одиниці броні, що поглинають вхідну шкоду.",
    },
    siege_engineer: {
      name: "Облоговий інженер",
      text: "Завдає 1 шкоди ворогам на сусідніх із ціллю позиціях.",
      summary: "Кожна атака також завдає 1 шкоди ворогам на позиціях, сусідніх із ціллю.",
    },
    bronze_minotaur: {
      name: "Бронзовий мінотавр",
      text: "На початку бою отримує 5 броні.",
      summary: "На початку бою отримує 5 одиниць броні, що поглинають вхідну шкоду.",
    },
    headless_knight: {
      name: "Безголовий лицар",
      text: "Перший удар завдає додатково 2 шкоди.",
      summary: "Перша атака завдає додатково 2 шкоди.",
    },
    star_seer: {
      name: "Зоряний провидець",
      text: "Атакує ворога з найменшим поточним HP.",
      summary: "Обирає ціллю ворога з найменшим поточним запасом HP.",
    },
    war_chaplain: {
      name: "Бойовий капелан",
      text: "На початку бою дає кожному союзнику 1 броню.",
      summary: "На початку бою кожен союзник отримує 1 броню.",
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

export function getSynergyEffectLabel(
  locale: SupportedLocale,
  tag: UnitTag,
  effect: SynergyEffect,
  variant: "full" | "compact" = "full",
): string {
  let copyKey: SynergyEffectCopyKey;
  if (effect.kind === "opening_damage") {
    copyKey = "openingDamage";
  } else if (effect.kind === "first_undead_death_attack") {
    copyKey = "undeadDeathAttack";
  } else if (effect.kind === "first_attack_damage") {
    copyKey = "rogueFirstAttack";
  } else if (tag === "warrior" && effect.stat === "attack") {
    copyKey = "warriorAttack";
  } else if (tag === "warrior" && effect.stat === "armor") {
    copyKey = "warriorArmor";
  } else if (tag === "beast" && effect.stat === "attack") {
    copyKey = "beastAttack";
  } else if (tag === "beast" && effect.stat === "speed") {
    copyKey = "beastSpeed";
  } else if (tag === "mage" && effect.stat === "attack") {
    copyKey = "mageAttack";
  } else if (tag === "undead" && effect.stat === "hp") {
    copyKey = "undeadHp";
  } else if (tag === "rogue" && effect.stat === "attack") {
    copyKey = "rogueAttack";
  } else if (tag === "guardian" && effect.stat === "hp") {
    copyKey = "guardianHp";
  } else if (tag === "guardian" && effect.stat === "armor") {
    copyKey = "guardianArmor";
  } else {
    throw new Error(`Unsupported ${tag} synergy effect: ${effect.kind}`);
  }

  const templates = variant === "compact" ? SYNERGY_EFFECT_COMPACT_COPY : SYNERGY_EFFECT_COPY;
  return formatMessage(templates[locale][copyKey], { value: effect.value });
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
