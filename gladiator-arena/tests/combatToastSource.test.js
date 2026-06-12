import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("fight log toast is hidden from the active battle layout", () => {
  const source = readFileSync(join(root, "src", "styles.css"), "utf8");

  assert.match(source, /\.battle-screen \.combat-toast \{\s*display: none;\s*\}/);
  assert.match(source, /\.battle-screen \.arena-fighters-strip \{[^}]*bottom: max\(6px, calc\(env\(safe-area-inset-bottom\) \+ var\(--hud-bottom-offset, -16px\)\)\);[^}]*\}/s);
});
