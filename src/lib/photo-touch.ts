export type TouchPoint = {
  identifier: number;
  clientX: number;
  clientY: number;
};
type Point = { x: number; y: number };
// 渐进更新中心和指距；触点增减时重设参考点，不引入位移跳变。
export function getTouchFrame(points: readonly TouchPoint[]) {
  const [a, b] = points;
  if (!a) return;
  if (!b)
    return {
      ids: String(a.identifier),
      center: { x: a.clientX, y: a.clientY },
      distance: 0,
    };
  return {
    ids: [a.identifier, b.identifier].sort((x, y) => x - y).join(','),
    center: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 },
    distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
  };
}

export function createPhotoTouch(options: {
  magnified: () => boolean;
  transform: (scaleFactor: number, previous: Point, current: Point) => void;
  toggle: (point: Point) => void;
  move: (direction: -1 | 1) => void;
}) {
  let last: ReturnType<typeof getTouchFrame>;
  let initial: TouchPoint | undefined;
  let manipulated = false;
  let blocked = false;
  let tapMoved = false;
  let tap: { x: number; y: number; time: number } | undefined;
  function clear() {
    last = undefined;
    initial = undefined;
    manipulated = false;
    blocked = false;
    tapMoved = false;
  }
  function start(points: readonly TouchPoint[], total = points.length) {
    if (blocked) return false;
    last = getTouchFrame(points);
    if (total === 1 && points.length === 1 && !manipulated) initial = points[0];
    if (total > 1) {
      initial = undefined;
      manipulated = true;
      tap = undefined;
    }
    return points.length >= 2 || options.magnified();
  }
  function update(points: readonly TouchPoint[], cancelable: boolean) {
    if (!cancelable) {
      // 浏览器已接管纵向滚动，本次接触不再转成画布操作。
      clear();
      blocked = true;
      tap = undefined;
      return false;
    }
    if (blocked) return false;
    const current = getTouchFrame(points);
    if (
      initial &&
      current &&
      Math.hypot(
        current.center.x - initial.clientX,
        current.center.y - initial.clientY,
      ) > 12
    )
      tapMoved = true;
    const handle = points.length >= 2 || options.magnified();
    if (handle && current && last?.ids === current.ids) {
      const factor =
        last.distance && current.distance
          ? current.distance / last.distance
          : 1;
      options.transform(factor, last.center, current.center);
    }
    last = current;
    return handle;
  }
  function end(
    remaining: readonly TouchPoint[],
    changed: readonly TouchPoint[],
    time: number,
  ) {
    if (remaining.length) {
      last = getTouchFrame(remaining);
      return;
    }
    const start = initial;
    const allow = !blocked && !manipulated;
    const stationary = !tapMoved;
    clear();
    const finish = changed.find(
      (point) => point.identifier === start?.identifier,
    );
    if (!allow || !start || !finish) return;
    const dx = finish.clientX - start.clientX;
    const dy = finish.clientY - start.clientY;
    if (
      !options.magnified() &&
      Math.abs(dx) >= 55 &&
      Math.abs(dx) > Math.abs(dy) * 1.5
    ) {
      tap = undefined;
      options.move(dx > 0 ? -1 : 1);
    } else if (stationary && Math.hypot(dx, dy) <= 12) {
      const point = { x: finish.clientX, y: finish.clientY };
      if (
        tap &&
        time - tap.time < 320 &&
        Math.hypot(tap.x - point.x, tap.y - point.y) <= 28
      ) {
        tap = undefined;
        options.toggle(point);
      } else tap = { ...point, time };
    } else tap = undefined;
  }
  function cancel() {
    clear();
    tap = undefined;
  }
  return { start, update, end, cancel };
}
