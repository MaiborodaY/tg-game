# Bridge Mini App

Первый игровой прототип классического контрактного бриджа для Telegram Mini Apps.

## Что уже работает

- одиночная партия: игрок занимает South, остальные места контролирует ИИ;
- торговля с пасом, заявками, контрой и реконтрой;
- розыгрыш 13 взяток с обязательным соблюдением масти;
- declarer, открытая рука dummy и duplicate scoring;
- PvP-комната по шестизначному коду: South и West — люди, North и East — серверные ИИ-партнёры;
- Telegram `initData`, одноразовые WebSocket-билеты и серверная игровая логика.

На этом этапе у Bridge нет рейтинга и наград World of Life. Войти в игру можно
через экран выбора внутри `/td/`; кнопка возврата открывает ту же сессию Tower Defense.

## Локальный запуск

Только клиент и одиночная игра:

```powershell
npm.cmd run bridge:dev
```

Открыть `http://127.0.0.1:5173/`.

Клиент вместе с локальным PvP Worker:

```powershell
npm.cmd run bridge:pvp:dev
```

Открыть два окна:

- `http://127.0.0.1:8787/?dev_user=alice`
- `http://127.0.0.1:8787/?dev_user=bob`

Первый игрок создаёт комнату, второй вводит полученный код. Параметр
`dev_user` принимается только при `ENVIRONMENT=development`.

## Проверка

```powershell
npm.cmd run bridge:test
npm.cmd run bridge:typecheck
npm.cmd run bridge:pvp:test
npm.cmd run bridge:pvp:typecheck
npm.cmd run bridge:build
```

## Развёртывание

Перед первым production deploy Worker должен получить секрет того же Telegram-бота,
который запускает Mini App:

```powershell
npx.cmd wrangler secret put BOT_TOKEN --config workers/bridge-pvp/wrangler.jsonc
```

После этого приложение можно развернуть вручную:

```powershell
npm.cmd run bridge:pvp:deploy
```
