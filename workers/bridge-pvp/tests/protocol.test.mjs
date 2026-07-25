import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_PROCESSED_COMMANDS,
  ROOM_CODE_ALPHABET,
  appendProcessedCommand,
  createOpaqueToken,
  createRoomCode,
  getCommandDisposition,
  hashOpaqueToken,
  hasProcessedCommand,
  normalizeRoomCode,
  parseBridgeClientCommand,
} from "../src/protocol.ts";

test("room codes are six unambiguous server-generated characters", () => {
  const code = createRoomCode(new Uint8Array([0, 1, 2, 29, 30, 31]));

  assert.equal(code.length, 6);
  assert.equal([...code].every((character) => ROOM_CODE_ALPHABET.includes(character)), true);
  assert.equal(normalizeRoomCode(` ${code.slice(0, 3)}-${code.slice(3)} `), code);
  assert.equal(normalizeRoomCode("IO10AA"), undefined);
});

test("protocol accepts strict versioned calls and card plays", () => {
  assert.deepEqual(parseBridgeClientCommand({
    commandId: "command_0001",
    expectedRevision: 8,
    type: "call",
    call: { type: "bid", level: 3, strain: "notrump" },
  }), {
    commandId: "command_0001",
    expectedRevision: 8,
    type: "call",
    call: { type: "bid", level: 3, strain: "notrump" },
  });

  assert.deepEqual(parseBridgeClientCommand({
    commandId: "command_0002",
    expectedRevision: 9,
    type: "play_card",
    cardId: "spades:A",
  }), {
    commandId: "command_0002",
    expectedRevision: 9,
    type: "play_card",
    cardId: "spades:A",
  });

  assert.equal(parseBridgeClientCommand({
    commandId: "short",
    expectedRevision: 0,
    type: "call",
    call: { type: "pass" },
  }), undefined);
  assert.equal(parseBridgeClientCommand({
    commandId: "command_0003",
    expectedRevision: -1,
    type: "call",
    call: { type: "bid", level: 8, strain: "spades" },
  }), undefined);
});

test("processed command history makes retries idempotent and remains bounded", () => {
  let commands = [];
  commands = appendProcessedCommand(commands, { commandId: "command_0001", acceptedRevision: 1 });
  commands = appendProcessedCommand(commands, { commandId: "command_0001", acceptedRevision: 99 });

  assert.equal(commands.length, 1);
  assert.equal(commands[0].acceptedRevision, 1);
  assert.equal(hasProcessedCommand(commands, "command_0001"), true);
  assert.equal(getCommandDisposition(commands, {
    commandId: "command_0001",
    expectedRevision: 0,
  }, 1), "duplicate");
  assert.equal(getCommandDisposition(commands, {
    commandId: "command_0002",
    expectedRevision: 0,
  }, 1), "stale");
  assert.equal(getCommandDisposition(commands, {
    commandId: "command_0002",
    expectedRevision: 1,
  }, 1), "accept");

  for (let index = 2; index <= MAX_PROCESSED_COMMANDS + 5; index += 1) {
    commands = appendProcessedCommand(commands, {
      commandId: `command_${String(index).padStart(4, "0")}`,
      acceptedRevision: index,
    });
  }

  assert.equal(commands.length, MAX_PROCESSED_COMMANDS);
  assert.equal(hasProcessedCommand(commands, "command_0001"), false);
});

test("one-time ticket storage uses a hash rather than the bearer value", async () => {
  const bytes = Uint8Array.from({ length: 32 }, (_, index) => index);
  const token = createOpaqueToken(bytes);
  const hash = await hashOpaqueToken(token);

  assert.notEqual(hash, token);
  assert.equal(await hashOpaqueToken(token), hash);
  assert.equal(hash.includes(token), false);
});
