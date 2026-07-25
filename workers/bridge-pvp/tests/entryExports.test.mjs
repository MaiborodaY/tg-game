import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new globalThis.URL("../src/index.ts", import.meta.url),
  "utf8",
);

test("the Worker entrypoint does not export runtime values Cloudflare cannot register", () => {
  const unsupportedExports = Array.from(
    source.matchAll(/^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm),
    (match) => match[1],
  );

  assert.deepEqual(unsupportedExports, []);
});
