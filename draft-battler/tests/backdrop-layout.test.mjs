import assert from "node:assert/strict";
import test from "node:test";
import { getBackdropCoverSize } from "../src/rendering/backdropLayout.ts";

for (const [viewportWidth, viewportHeight] of [[320, 568], [390, 844], [430, 932], [460, 736], [844, 390]]) {
  test(`backdrop covers ${viewportWidth}x${viewportHeight} without distorting the source`, () => {
    for (const [sourceWidth, sourceHeight] of [[585, 1080], [923, 1703], [1920, 1080]]) {
      const { width, height } = getBackdropCoverSize(viewportWidth, viewportHeight, sourceWidth, sourceHeight);
      const expectedScale = Math.max((viewportWidth + 2) / sourceWidth, (viewportHeight + 2) / sourceHeight);
      close(width, sourceWidth * expectedScale);
      close(height, sourceHeight * expectedScale);
      close(width / height, sourceWidth / sourceHeight);
      assert.ok((viewportWidth - width) / 2 <= -1 + 1e-9, "left edge includes one pixel of bleed");
      assert.ok((viewportHeight - height) / 2 <= -1 + 1e-9, "top edge includes one pixel of bleed");
      assert.ok((viewportWidth + width) / 2 >= viewportWidth + 1 - 1e-9, "right edge includes one pixel of bleed");
      assert.ok((viewportHeight + height) / 2 >= viewportHeight + 1 - 1e-9, "bottom edge includes one pixel of bleed");
    }
  });
}

test("cover sizing rejects non-positive or non-finite viewport and source dimensions", () => {
  for (let index = 0; index < 4; index += 1) {
    for (const invalid of [0, -1, NaN, Infinity, -Infinity]) {
      const dimensions = [390, 844, 585, 1080];
      dimensions[index] = invalid;
      assert.throws(() => getBackdropCoverSize(...dimensions), RangeError);
    }
  }
});

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);
}
