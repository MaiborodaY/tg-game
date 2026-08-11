import assert from "node:assert/strict";
import test from "node:test";

import { getMatchCastleDamage } from "../src/combatHp.ts";

test("host and guest HP losses follow the shared combat perspective", () => {
  assert.deepEqual(
    getMatchCastleDamage({ playerCastleDamage: 3, enemyCastleDamage: 0 }),
    { hostHpLoss: 3, guestHpLoss: 0 },
  );
  assert.deepEqual(
    getMatchCastleDamage({ playerCastleDamage: 0, enemyCastleDamage: 4 }),
    { hostHpLoss: 0, guestHpLoss: 4 },
  );
  assert.deepEqual(
    getMatchCastleDamage({ playerCastleDamage: 0, enemyCastleDamage: 0 }),
    { hostHpLoss: 0, guestHpLoss: 0 },
  );
});
