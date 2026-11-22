import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIT,
  fitSize,
  visiblePhotoSize,
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

test('pinch preserves image point under the moving midpoint before bounds', () => {
  const stage = { width: 800, height: 600 };
  const next = zoomAt(FIT, 2, { x: 100, y: 50 }, stage, stage, {
    x: 20,
    y: 30,
  });
  assert.equal((120 - next.x) / next.scale, 100);
  assert.equal((80 - next.y) / next.scale, 50);
});

test('guides cover only the zoomed landscape photo, capped by the stage', () => {
  const stage = { width: 360, height: 720 };
  const frame = fitSize({ width: 1800, height: 900 }, stage);
  assert.deepEqual(visiblePhotoSize(frame, stage, 1), { width: 360, height: 180 });
  assert.deepEqual(visiblePhotoSize(frame, stage, 2), { width: 360, height: 360 });
  assert.deepEqual(visiblePhotoSize(frame, stage, 8), stage);
});

test('guides cover only the zoomed portrait photo, capped by the stage', () => {
  const stage = { width: 800, height: 400 };
  const frame = fitSize({ width: 900, height: 1800 }, stage);
  assert.deepEqual(visiblePhotoSize(frame, stage, 1), { width: 200, height: 400 });
  assert.deepEqual(visiblePhotoSize(frame, stage, 2), { width: 400, height: 400 });
  assert.deepEqual(visiblePhotoSize(frame, stage, 8), stage);
});

test('panning to the bounds keeps the centered guides entirely over the photo', () => {
  const stage = { width: 360, height: 720 };
  const frame = { width: 360, height: 180 };
  const scale = 2;
  const guide = visiblePhotoSize(frame, stage, scale);
  for (const edge of [-999, 999]) {
    const pan = boundTransform({ scale, x: edge, y: edge }, frame, stage);
    assert.equal(pan.y, 0);
    assert.equal(Math.abs(pan.x), 180);
    assert.ok(Math.abs(pan.x) + guide.width / 2 <= frame.width * scale / 2);
    assert.ok(Math.abs(pan.y) + guide.height / 2 <= frame.height * scale / 2);
  }
});
