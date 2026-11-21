import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIT,
  fitSize,
  zoomAt,
  boundTransform,
} from '../src/lib/photo-transform.ts';

for (const stage of [
  { width: 850, height: 600 },
  { width: 360, height: 235 },
  { width: 720, height: 280 },
]) {
  for (const image of [
    { width: 6000, height: 4000 },
    { width: 4000, height: 6000 },
    { width: 9000, height: 1000 },
  ]) {
    test(`full-fit ${image.width}x${image.height} in ${stage.width}x${stage.height}`, () => {
      const frame = fitSize(image, stage);
      assert.ok(
        frame.width <= stage.width + 1e-8 &&
          frame.height <= stage.height + 1e-8,
      );
      assert.ok(
        Math.abs(frame.width / frame.height - image.width / image.height) <
          1e-8,
      );
      assert.deepEqual(
        boundTransform({ scale: 0.1, x: 999, y: -999 }, frame, stage),
        FIT,
      );
    });
  }
}
test('cursor anchor stays on the same image point until bounds intervene', () => {
  const stage = { width: 800, height: 600 };
  const anchor = { x: 100, y: -80 };
  const next = zoomAt(FIT, 2, anchor, stage, stage);
  assert.equal((anchor.x - next.x) / next.scale, anchor.x);
  assert.equal((anchor.y - next.y) / next.scale, anchor.y);
  assert.deepEqual(zoomAt(next, 0.2, anchor, stage, stage), FIT);
});
test('bounds center the short axis and constrain edges after resizing', () => {
  assert.deepEqual(
    boundTransform(
      { scale: 2, x: 900, y: -900 },
      { width: 800, height: 100 },
      { width: 800, height: 600 },
    ),
    { scale: 2, x: 400, y: 0 },
  );
  assert.deepEqual(
    boundTransform(
      { scale: 2, x: 900, y: 900 },
      { width: 300, height: 200 },
      { width: 800, height: 600 },
    ),
    { scale: 2, x: 0, y: 0 },
  );
});
test('continuous zoom is capped', () => {
  const stage = { width: 800, height: 600 };
  assert.equal(zoomAt(FIT, 999, { x: 0, y: 0 }, stage, stage).scale, 8);
});
