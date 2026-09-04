import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

register("../../../draft-battler/tests/resolve-typescript.mjs", import.meta.url);

const {
  CARD_DEFINITIONS,
  createDraftOptions,
  createEmptyBoardSlots,
  isCardAllowedInSlot,
} = await import("../../../draft-battler/src/game/index.ts");
const {
  DISCONNECT_GRACE_MS,
  MATCH_MAX_ROUNDS,
  RULESET_VERSION,
  MatchDomainError,
  applyMatchIntent,
  areSeatsReady,
  claimSeat,
  createMatch,
  createPlayerMatchSnapshot,
  createRoom,
  createRoomSnapshot,
  disconnectSeat,
  expireMatch,
  forfeitDisconnectedPlayer,
  getDisconnectForfeitRole,
  getDisconnectedSeatReleaseRole,
  isCurrentMatchState,
  isCurrentRoomState,
  isMatchExpired,
  isRematchReady,
  releaseDisconnectedSeat,
  setSeatReady,
  startRematch,
  touchSeat,
} = await import("../src/matchDomain.ts");

const NOW = 1_800_000_000_000;

function createFixtureMatch(matchId = "match-fixture-1", seed = "server-secret-seed") {
  return createMatch({ matchId, seed, now: NOW });
}

function intent(state, value) {
  return { matchId: state.matchId, round: state.round, ...value };
}

function apply(state, role, value, now = state.updatedAt + 1) {
  return applyMatchIntent(state, role, intent(state, value), now).state;
}

function expectDomainError(code, callback) {
  assert.throws(callback, (error) => error instanceof MatchDomainError && error.code === code);
}

function firstLegalTarget(cardId) {
  return createEmptyBoardSlots().find((slot) => isCardAllowedInSlot(cardId, slot.slotIndex)).slotIndex;
}

function boardWith(cardId, slotIndex = 0) {
  const board = createEmptyBoardSlots();
  board[slotIndex] = { slotIndex, cardId, upgradeLevel: 0 };
  return board;
}

function boardWithCards(cardIds) {
  const board = createEmptyBoardSlots();
  for (const cardId of cardIds) {
    const target = board.find((slot) => slot.cardId === null && isCardAllowedInSlot(cardId, slot.slotIndex));
    assert.ok(target, `expected a legal slot for ${cardId}`);
    target.cardId = cardId;
  }
  return board;
}

test("match creation is deterministic but keeps each server offer private", () => {
  const left = createFixtureMatch();
  const right = createFixtureMatch();

  assert.deepEqual(left, right);
  assert.equal(left.rulesetVersion, RULESET_VERSION);
  assert.equal(left.round, 1);
  assert.equal(left.phase, "draft");
  assert.equal(left.players.host.draftOptions.length, 3);
  assert.equal(left.players.guest.draftOptions.length, 3);

  const wireSnapshot = JSON.parse(JSON.stringify(createPlayerMatchSnapshot(left, "host", NOW + 10)));
  assert.equal("seed" in wireSnapshot, false);
  assert.equal("draftOptions" in wireSnapshot.opponent, false);
  assert.equal("pendingBoardSlots" in wireSnapshot.opponent, false);
  assert.equal("pickedCardId" in wireSnapshot.opponent, false);
  assert.equal("boardSlots" in wireSnapshot.opponent, false);
  assert.deepEqual(wireSnapshot.self.draftOptions, left.players.host.draftOptions);
});

test("persisted state compatibility gates reject stale rulesets and schemas", () => {
  const room = createRoom({ roomId: "room-v4", now: NOW });
  const match = createFixtureMatch();

  assert.equal(RULESET_VERSION, "draft-battler-pvp-v4");
  assert.equal(isCurrentRoomState(room), true);
  assert.equal(isCurrentMatchState(match), true);
  assert.equal(isCurrentRoomState({ ...room, rulesetVersion: "draft-battler-pvp-v3" }), false);
  assert.equal(isCurrentMatchState({ ...match, rulesetVersion: "draft-battler-pvp-v3" }), false);
  assert.equal(isCurrentRoomState({ ...room, schemaVersion: 0 }), false);
  assert.equal(isCurrentMatchState({ ...match, schemaVersion: 0 }), false);
  assert.equal(isCurrentRoomState(null), false);
  assert.equal(isCurrentMatchState([]), false);
});

test("pick accepts only the player's current offer and derives the pending board on the server", () => {
  const match = createFixtureMatch();
  const offeredIds = new Set(match.players.host.draftOptions.map((option) => option.cardId));
  const forgedCard = CARD_DEFINITIONS.find((card) => !offeredIds.has(card.id)).id;

  expectDomainError("card_not_offered", () => apply(match, "host", {
    type: "pick",
    cardId: forgedCard,
    targetSlotIndex: firstLegalTarget(forgedCard),
    allowReplacement: false,
  }));

  const offeredCard = match.players.host.draftOptions[0].cardId;
  const targetSlotIndex = firstLegalTarget(offeredCard);
  const picked = apply(match, "host", {
    type: "pick",
    cardId: offeredCard,
    targetSlotIndex,
    allowReplacement: false,
  });

  assert.equal(picked.players.host.boardSlots[targetSlotIndex].cardId, null);
  assert.equal(picked.players.host.pendingBoardSlots[targetSlotIndex].cardId, offeredCard);
  assert.equal(picked.players.host.pickedCardId, offeredCard);
  expectDomainError("card_already_picked", () => apply(picked, "host", {
    type: "pick",
    cardId: offeredCard,
    targetSlotIndex,
    allowReplacement: false,
  }));
  expectDomainError("stale_match", () => applyMatchIntent(picked, "host", {
    type: "lock",
    matchId: "another-match",
    round: picked.round,
  }, NOW + 20));
});

test("reroll is server-generated, once per round, and unavailable after a pick", () => {
  const match = createFixtureMatch();
  const originalOptions = match.players.host.draftOptions;
  const rerolled = apply(match, "host", { type: "reroll" });

  assert.equal(rerolled.players.host.draftRerollCount, 1);
  assert.notDeepEqual(rerolled.players.host.draftOptions, originalOptions);
  expectDomainError("reroll_unavailable", () => apply(rerolled, "host", { type: "reroll" }));

  const cardId = match.players.guest.draftOptions[0].cardId;
  const picked = apply(match, "guest", {
    type: "pick",
    cardId,
    targetSlotIndex: firstLegalTarget(cardId),
    allowReplacement: false,
  });
  expectDomainError("reroll_unavailable", () => apply(picked, "guest", { type: "reroll" }));

  let incumbentFixture;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = createFixtureMatch(`match-incumbent-${attempt}`, `incumbent-seed-${attempt}`);
    candidate.players.host.boardSlots = boardWith("iron_guard", 0);
    const weighted = createDraftOptions(
      `${candidate.seed}:pvp:host`,
      candidate.round,
      1,
      candidate.players.host.boardSlots,
    );
    const unweighted = createDraftOptions(`${candidate.seed}:pvp:host`, candidate.round, 1);
    if (JSON.stringify(weighted) !== JSON.stringify(unweighted)) {
      incumbentFixture = { candidate, weighted };
      break;
    }
  }
  assert.ok(incumbentFixture, "expected a deterministic seed where incumbent weighting changes the reroll");
  const incumbentReroll = apply(incumbentFixture.candidate, "host", { type: "reroll" });
  assert.deepEqual(incumbentReroll.players.host.draftOptions, incumbentFixture.weighted);
});

test("move and swap are server-authoritative and enforce front-row-only cards", () => {
  const match = createFixtureMatch();
  match.players.host.boardSlots = boardWith("iron_guard", 0);
  const moved = apply(match, "host", { type: "move", sourceSlotIndex: 0, targetSlotIndex: 3 });

  assert.equal(moved.players.host.boardSlots[0].cardId, "iron_guard");
  assert.equal(moved.players.host.pendingBoardSlots[0].cardId, null);
  assert.equal(moved.players.host.pendingBoardSlots[3].cardId, "iron_guard");

  const shieldMatch = createFixtureMatch("match-shield", "shield-secret");
  shieldMatch.players.host.boardSlots = boardWith("shieldbearer", 0);
  expectDomainError("invalid_move", () => apply(shieldMatch, "host", {
    type: "move",
    sourceSlotIndex: 0,
    targetSlotIndex: 3,
  }));
});

test("round one rejects an empty lock; both locks resolve and only then reveal armies", () => {
  let match = createFixtureMatch();
  expectDomainError("empty_board", () => apply(match, "host", { type: "lock" }));

  for (const role of ["host", "guest"]) {
    const cardId = match.players[role].draftOptions[0].cardId;
    match = apply(match, role, {
      type: "pick",
      cardId,
      targetSlotIndex: firstLegalTarget(cardId),
      allowReplacement: false,
    });
  }

  match = apply(match, "host", { type: "lock" });
  assert.equal(match.phase, "draft");
  assert.equal(createPlayerMatchSnapshot(match, "guest").opponent.boardSlots, undefined);

  match = apply(match, "guest", { type: "lock" });
  assert.equal(match.phase, "battle");
  assert.ok(match.combat);
  assert.deepEqual(createPlayerMatchSnapshot(match, "guest").opponent.boardSlots, match.players.host.boardSlots);
});

test("PvP snapshots preserve the current four-unit synergy tier on the wire", () => {
  const warriorIds = CARD_DEFINITIONS
    .filter((card) => card.tags.includes("warrior"))
    .slice(0, 4)
    .map((card) => card.id);
  assert.equal(warriorIds.length, 4);

  let match = createFixtureMatch("match-warrior-mastery", "warrior-mastery-secret");
  match.players.host.boardSlots = boardWithCards(warriorIds);
  match.players.guest.boardSlots = boardWith("iron_guard", 0);
  match = apply(match, "host", { type: "lock" });
  match = apply(match, "guest", { type: "lock" });

  const wireSnapshot = JSON.parse(JSON.stringify(createPlayerMatchSnapshot(match, "host")));
  const masteryEvent = wireSnapshot.combat.combat.events.find((event) =>
    event.type === "synergy_applied"
      && event.owner === "player"
      && event.tag === "warrior"
      && event.threshold === 4,
  );
  assert.deepEqual(masteryEvent && {
    effectKind: masteryEvent.effectKind,
    value: masteryEvent.value,
    shieldBonus: masteryEvent.shieldBonus,
    unitCount: masteryEvent.unitIds.length,
  }, {
    effectKind: "stat",
    value: 1,
    shieldBonus: 1,
    unitCount: 4,
  });
});

test("the next round starts only after acknowledgements from both players and preserves committed armies", () => {
  let match = createFixtureMatch();
  match.players.host.boardSlots = boardWith("iron_guard", 0);
  match.players.guest.boardSlots = boardWith("iron_guard", 0);
  match = apply(match, "host", { type: "lock" });
  match = apply(match, "guest", { type: "lock" });
  assert.equal(match.phase, "battle");

  const hostReady = apply(match, "host", { type: "next_ready" });
  assert.equal(hostReady.round, 1);
  assert.equal(hostReady.phase, "battle");
  expectDomainError("already_ready", () => apply(hostReady, "host", { type: "next_ready" }));

  const nextRound = apply(hostReady, "guest", { type: "next_ready" });
  assert.equal(nextRound.round, 2);
  assert.equal(nextRound.phase, "draft");
  assert.equal(nextRound.players.host.boardSlots[0].cardId, "iron_guard");
  assert.equal(nextRound.players.host.draftRerollCount, 0);
  assert.deepEqual(
    nextRound.players.host.draftOptions,
    createDraftOptions(`${nextRound.seed}:pvp:host`, 2, 0, nextRound.players.host.boardSlots),
  );
  assert.deepEqual(
    nextRound.players.guest.draftOptions,
    createDraftOptions(`${nextRound.seed}:pvp:guest`, 2, 0, nextRound.players.guest.boardSlots),
  );

  const skippedPick = apply(nextRound, "host", { type: "lock" });
  assert.equal(skippedPick.players.host.locked, true);
});

test("round 15 terminates by remaining castle HP, including an exact draw", () => {
  let match = createFixtureMatch("match-round-limit", "round-limit-secret");
  match.round = MATCH_MAX_ROUNDS;
  match.hostHp = 12;
  match.guestHp = 10;
  match.players.host.boardSlots = boardWith("iron_guard", 0);
  match.players.guest.boardSlots = boardWith("iron_guard", 0);
  match = apply(match, "host", { type: "lock" });
  match = apply(match, "guest", { type: "lock" });

  assert.equal(match.phase, "finished");
  assert.deepEqual(match.outcome, {
    winner: "host",
    reason: "round_limit",
    finishedAt: match.updatedAt,
    forfeitedRole: undefined,
  });

  let tied = createFixtureMatch("match-round-draw", "round-draw-secret");
  tied.round = MATCH_MAX_ROUNDS;
  tied.players.host.boardSlots = boardWith("iron_guard", 0);
  tied.players.guest.boardSlots = boardWith("iron_guard", 0);
  tied = apply(tied, "host", { type: "lock" });
  tied = apply(tied, "guest", { type: "lock" });
  assert.equal(tied.outcome.winner, "draw");
  assert.equal(tied.outcome.reason, "round_limit");
});

test("forfeit, expiry, disconnect loss, and two-sided rematch are explicit terminal transitions", () => {
  const match = createFixtureMatch();
  const forfeited = apply(match, "guest", { type: "forfeit" });
  assert.equal(forfeited.outcome.winner, "host");
  assert.equal(forfeited.outcome.reason, "forfeit");
  assert.equal(forfeited.outcome.forfeitedRole, "guest");

  let rematchAccepted = apply(forfeited, "host", { type: "rematch" });
  assert.equal(isRematchReady(rematchAccepted), false);
  rematchAccepted = apply(rematchAccepted, "guest", { type: "rematch" });
  assert.equal(isRematchReady(rematchAccepted), true);
  const rematch = startRematch(rematchAccepted, { matchId: "rematch-id-2", seed: "new-secret", now: NOW + 100 });
  assert.equal(rematch.phase, "draft");
  assert.equal(rematch.round, 1);
  assert.equal(rematch.hostHp, 20);

  const disconnected = forfeitDisconnectedPlayer(match, "host", NOW + 200);
  assert.equal(disconnected.outcome.reason, "disconnect");
  assert.equal(disconnected.outcome.winner, "guest");

  assert.equal(isMatchExpired(match, match.expiresAt), true);
  const expired = expireMatch(match, match.expiresAt);
  assert.equal(expired.outcome.reason, "expired");
  assert.equal(expired.outcome.winner, "draw");
});

test("seat tokens reclaim the same seat, stale socket closes are ignored, and snapshots never expose credentials", () => {
  let room = createRoom({ roomId: "roomcode", now: NOW });
  const hostClaim = claimSeat(room, {
    issuedTokenHash: "host-token-hash",
    connectionId: "host-connection-1",
    now: NOW + 1,
  });
  room = hostClaim.room;
  assert.equal(hostClaim.role, "host");

  room = disconnectSeat(room, "host", "host-token-hash", "host-connection-1", NOW + 2);
  const reconnect = claimSeat(room, {
    presentedTokenHash: "host-token-hash",
    issuedTokenHash: "unused-new-hash",
    connectionId: "host-connection-2",
    now: NOW + 3,
  });
  room = reconnect.room;
  assert.equal(reconnect.role, "host");
  assert.equal(reconnect.reconnected, true);
  assert.equal(room.seats.host.tokenHash, "host-token-hash");

  room = disconnectSeat(room, "host", "host-token-hash", "host-connection-1", NOW + 4);
  assert.equal(room.seats.host.connected, true);
  assert.equal(room.seats.host.connectionId, "host-connection-2");

  room = touchSeat(room, "host", "host-token-hash", "host-connection-2", NOW + 5);
  room = setSeatReady(room, {
    role: "host",
    tokenHash: "host-token-hash",
    connectionId: "host-connection-2",
    ready: true,
    now: NOW + 6,
  });
  const guestClaim = claimSeat(room, {
    issuedTokenHash: "guest-token-hash",
    connectionId: "guest-connection",
    now: NOW + 7,
  });
  room = setSeatReady(guestClaim.room, {
    role: "guest",
    tokenHash: "guest-token-hash",
    connectionId: "guest-connection",
    ready: true,
    now: NOW + 8,
  });
  assert.equal(areSeatsReady(room), true);

  const serialized = JSON.stringify(createRoomSnapshot(room, "host", NOW + 9));
  assert.equal(serialized.includes("tokenHash"), false);
  assert.equal(serialized.includes("connectionId"), false);
  assert.equal(serialized.includes("host-token-hash"), false);
});

test("Telegram identity is bound to a seat and one user cannot claim both sides", () => {
  let room = createRoom({ roomId: "identity", now: NOW });
  room = claimSeat(room, {
    issuedTokenHash: "host-token",
    connectionId: "host-connection",
    now: NOW + 1,
    identity: { userId: "100", displayName: "Host" },
  }).room;

  expectDomainError("same_player", () => claimSeat(room, {
    issuedTokenHash: "guest-token",
    connectionId: "guest-connection",
    now: NOW + 2,
    identity: { userId: "100", displayName: "Host again" },
  }));
  expectDomainError("invalid_seat", () => claimSeat(room, {
    presentedTokenHash: "host-token",
    issuedTokenHash: "unused-token",
    connectionId: "stolen-connection",
    now: NOW + 3,
    identity: { userId: "200", displayName: "Other" },
  }));

  const snapshot = JSON.stringify(createRoomSnapshot(room, "host", NOW + 4));
  assert.doesNotMatch(snapshot, /100|Host/);
});

test("disconnect grace exposes deterministic forfeit and waiting-room seat release hooks", () => {
  let room = createRoom({ roomId: "graceroom", now: NOW });
  room = claimSeat(room, {
    issuedTokenHash: "host-hash",
    connectionId: "host-1",
    now: NOW + 1,
  }).room;
  room = claimSeat(room, {
    issuedTokenHash: "guest-hash",
    connectionId: "guest-1",
    now: NOW + 2,
  }).room;
  room = disconnectSeat(room, "host", "host-hash", "host-1", NOW + 3);

  const deadline = NOW + 3 + DISCONNECT_GRACE_MS;
  assert.equal(getDisconnectForfeitRole(room, deadline - 1), undefined);
  assert.equal(getDisconnectForfeitRole(room, deadline), "host");
  assert.equal(getDisconnectedSeatReleaseRole(room, deadline), "host");

  const released = releaseDisconnectedSeat(room, "host", deadline);
  assert.equal(released.seats.host, undefined);
  assert.equal(released.seats.guest.role, "guest");
});
