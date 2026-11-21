import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoTouch } from '../src/lib/photo-touch.ts';

const point = (identifier: number, clientX: number, clientY = 0) => ({
  identifier,
  clientX,
  clientY,
});

function fixture() {
  let magnified = false;
  const transforms: unknown[] = [];
  const moves: number[] = [];
  const touch = createPhotoTouch({
    magnified: () => magnified,
    transform: (...args) => {
      transforms.push(args);
      magnified = true;
    },
    toggle: () => {
      magnified = !magnified;
    },
    move: (direction) => moves.push(direction),
  });
  return { touch, transforms, moves, magnified: () => magnified };
}

test('unsuppressed one-finger swipe navigates only at fit', () => {
  const { touch, moves } = fixture();
  assert.equal(touch.start([point(1, 100)]), false);
  assert.equal(touch.update([point(1, 30)], true), false);
  touch.end([], [point(1, 30)], 100);
  assert.deepEqual(moves, [1]);
});

test('pinch tracks finger distance and midpoint; remaining finger can pan without navigation', () => {
  const { touch, transforms, moves } = fixture();
  touch.start([point(1, 0)]);
  assert.equal(touch.start([point(1, 0), point(2, 100)]), true);
  assert.equal(touch.update([point(2, 170), point(1, -30)], true), true);
  touch.end([point(1, -30)], [point(2, 170)], 80);
  assert.equal(touch.update([point(1, 60)], true), true);
  touch.end([], [point(1, 60)], 100);
  assert.deepEqual(transforms, [
    [2, { x: 50, y: 0 }, { x: 70, y: 0 }],
    [1, { x: -30, y: 0 }, { x: 60, y: 0 }],
  ]);
  assert.deepEqual(moves, []);
});

test('native scroll and cancellation never trigger navigation', () => {
  const { touch, transforms, moves } = fixture();
  touch.start([point(1, 100)]);
  assert.equal(touch.update([point(1, 80, 80)], false), false);
  touch.start([point(1, 80, 80), point(2, 125)]);
  assert.equal(touch.update([point(1, 0), point(2, 140)], true), false);
  touch.end([], [point(1, 0)], 100);
  touch.start([point(1, 100)]);
  touch.cancel();
  touch.end([], [point(1, 0)], 200);
  assert.deepEqual(moves, []);
  assert.deepEqual(transforms, []);
});

test('double tap toggles and reset, subsequent single gesture is normal', () => {
  const { touch, magnified } = fixture();
  for (const time of [100, 200, 600, 700]) {
    touch.start([point(1, 100)]);
    touch.end([], [point(1, 100)], time);
    if (time === 200) assert.equal(magnified(), true);
  }
  assert.equal(magnified(), false);
  assert.equal(touch.start([point(1, 100)]), false);
});
