import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import {
  FIT,
  boundTransform,
  fitSize,
  zoomAt,
  type Size,
} from './photo-transform';

export function usePhotoTransform(
  stage: Ref<HTMLElement | null>,
  image: () => Size,
  identity: () => string,
) {
  const bounds = ref<Size>({ width: 0, height: 0 });
  const value = ref({ ...FIT });
  const desktop = ref(false);
  const dragging = ref(false);
  const frame = computed(() => fitSize(image(), bounds.value));
  const magnified = computed(() => value.value.scale > 1.001);
  const frameStyle = computed(() =>
    bounds.value.width && bounds.value.height
      ? {
          width: `${frame.value.width}px`,
          height: `${frame.value.height}px`,
          transform: `translate(-50%, -50%) translate(${value.value.x}px, ${value.value.y}px) scale(${value.value.scale})`,
        }
      : undefined,
  );
  let drag:
    | { x: number; y: number; left: number; top: number; id: number }
    | undefined;
  let gestureScale = 1;
  let gesturing = false;
  const reset = () => {
    value.value = { ...FIT };
    dragging.value = false;
    drag = undefined;
  };
  function anchor(clientX?: number, clientY?: number) {
    const rect = stage.value?.getBoundingClientRect();
    return rect && Number.isFinite(clientX) && Number.isFinite(clientY)
      ? {
          x: clientX! - rect.left - rect.width / 2,
          y: clientY! - rect.top - rect.height / 2,
        }
      : { x: 0, y: 0 };
  }
  function zoom(scale: number, x?: number, y?: number) {
    if (!desktop.value) return;
    value.value = zoomAt(
      value.value,
      scale,
      anchor(x, y),
      frame.value,
      bounds.value,
    );
  }
  function toggle(x?: number, y?: number) {
    if (!desktop.value) return;
    if (magnified.value) reset();
    else zoom(2, x, y);
    stage.value?.focus({ preventScroll: true });
  }
  function pan(x: number, y: number) {
    value.value = boundTransform(
      { ...value.value, x, y },
      frame.value,
      bounds.value,
    );
  }
  function wheel(event: WheelEvent) {
    if (!desktop.value) return;
    if (event.ctrlKey) {
      event.preventDefault();
      if (!gesturing)
        zoom(
          value.value.scale *
            Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.04 : 0.005)),
          event.clientX,
          event.clientY,
        );
    } else if (magnified.value) {
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? bounds.value.height
            : 1;
      pan(
        value.value.x - event.deltaX * unit,
        value.value.y - event.deltaY * unit,
      );
    }
  }
  // Safari 使用 GestureEvent；Chromium/Firefox 的触控板捏合使用 ctrl+wheel。
  type Gesture = Event & { scale: number; clientX: number; clientY: number };
  function gestureStart(event: Event) {
    if (!desktop.value) return;
    event.preventDefault();
    gesturing = true;
    gestureScale = value.value.scale;
  }
  function gestureChange(event: Event) {
    if (!desktop.value || !gesturing) return;
    event.preventDefault();
    const e = event as Gesture;
    if (Number.isFinite(e.scale) && e.scale > 0)
      zoom(gestureScale * e.scale, e.clientX, e.clientY);
  }
  function gestureEnd(event: Event) {
    if (gesturing) event.preventDefault();
    gesturing = false;
  }
  function startDrag(event: PointerEvent) {
    if (
      !desktop.value ||
      !magnified.value ||
      event.pointerType !== 'mouse' ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    stage.value?.focus({ preventScroll: true });
    stage.value?.setPointerCapture(event.pointerId);
    drag = {
      x: event.clientX,
      y: event.clientY,
      left: value.value.x,
      top: value.value.y,
      id: event.pointerId,
    };
    dragging.value = true;
  }
  function moveDrag(event: PointerEvent) {
    if (drag)
      pan(
        drag.left + event.clientX - drag.x,
        drag.top + event.clientY - drag.y,
      );
  }
  function endDrag() {
    drag = undefined;
    dragging.value = false;
  }
  function keydown(event: KeyboardEvent) {
    if (!desktop.value || event.ctrlKey || event.metaKey || event.altKey)
      return;
    if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === '0') reset();
      else zoom(value.value.scale * (event.key === '-' ? 0.8 : 1.25));
    } else if (magnified.value && event.key.startsWith('Arrow')) {
      event.preventDefault();
      event.stopPropagation();
      pan(
        value.value.x +
          (event.key === 'ArrowLeft'
            ? 60
            : event.key === 'ArrowRight'
              ? -60
              : 0),
        value.value.y +
          (event.key === 'ArrowUp' ? 60 : event.key === 'ArrowDown' ? -60 : 0),
      );
    }
  }
  let cleanup = () => {};
  onMounted(() => {
    const el = stage.value;
    if (!el) return;
    const media = matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => {
      desktop.value = media.matches;
      reset();
    };
    update();
    media.addEventListener('change', update);
    const observer = new ResizeObserver(() => {
      bounds.value = { width: el.clientWidth, height: el.clientHeight };
      value.value = boundTransform(value.value, frame.value, bounds.value);
    });
    observer.observe(el);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('gesturestart', gestureStart, { passive: false });
    el.addEventListener('gesturechange', gestureChange, { passive: false });
    el.addEventListener('gestureend', gestureEnd, { passive: false });
    cleanup = () => {
      observer.disconnect();
      media.removeEventListener('change', update);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('gesturestart', gestureStart);
      el.removeEventListener('gesturechange', gestureChange);
      el.removeEventListener('gestureend', gestureEnd);
    };
  });
  onUnmounted(() => cleanup());
  watch(identity, reset);
  return {
    frameStyle,
    magnified,
    dragging,
    toggle,
    reset,
    startDrag,
    moveDrag,
    endDrag,
    keydown,
  };
}
