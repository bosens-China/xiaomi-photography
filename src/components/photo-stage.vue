<script setup lang="ts">
import { useTemplateRef } from 'vue';
import PhotoImage from '@/components/photo-image.vue';
import type { GridMode, Photo } from '@/lib/photos';
import { usePhotoTransform } from '@/lib/use-photo-transform';
const props = defineProps<{
  photo: Photo;
  gridMode: GridMode;
  monochrome: boolean;
}>();
const emit = defineEmits<{ move: [direction: -1 | 1] }>();
const stage = useTemplateRef<HTMLDivElement>('stage');
const {
  frameStyle,
  magnified,
  dragging,
  toggle,
  reset,
  startDrag,
  moveDrag,
  endDrag,
  keydown,
} = usePhotoTransform(
  stage,
  () => ({ width: props.photo.width || 4, height: props.photo.height || 3 }),
  () => props.photo.id,
);
defineExpose({ toggle, reset });
let touchStart: Touch | undefined;
function startSwipe(event: TouchEvent) {
  touchStart =
    !magnified.value && event.touches.length === 1
      ? event.touches[0]
      : undefined;
}
function endSwipe(event: TouchEvent) {
  const start = touchStart;
  touchStart = undefined;
  if (!start || event.touches.length || magnified.value) return;
  const end = Array.from(event.changedTouches).find(
    (touch) => touch.identifier === start.identifier,
  );
  if (!end) return;
  const dx = end.clientX - start.clientX;
  const dy = end.clientY - start.clientY;
  if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.5)
    emit('move', dx > 0 ? -1 : 1);
}
</script>

<template>
  <div
    ref="stage"
    class="stage"
    :class="{ 'is-magnified': magnified, 'is-dragging': dragging }"
    :style="{ '--aspect': (photo.width || 4) / (photo.height || 3) }"
    tabindex="0"
    role="region"
    aria-label="照片画布：桌面捏合或 Ctrl 加滚轮缩放，双击或 Z 放大与复位；加减号缩放，0 复位，放大后方向键平移"
    @keydown="keydown"
    @pointerdown="startDrag"
    @pointermove="moveDrag"
    @pointerup="endDrag"
    @pointercancel="endDrag"
    @lostpointercapture="endDrag"
    @dblclick="toggle($event.clientX, $event.clientY)"
    @dragstart.prevent
    @touchstart.passive="startSwipe"
    @touchend.passive="endSwipe"
    @touchcancel="touchStart = undefined"
  >
    <div
      class="photo-frame"
      :style="frameStyle"
      :class="{ 'is-monochrome': monochrome }"
    >
      <PhotoImage :photo="photo" original eager />

      <!-- 构图辅助网格 SVG 叠加层（带暗色衬底+亮色细线，深浅画面均清晰可见） -->
      <svg
        v-if="gridMode !== 'none'"
        class="composition-overlay"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <!-- 三分法（九宫格 Rule of Thirds: 33.33% / 66.67%） -->
        <template v-if="gridMode === 'thirds'">
          <g class="grid-shadow">
            <line x1="33.333" y1="0" x2="33.333" y2="100" />
            <line x1="66.667" y1="0" x2="66.667" y2="100" />
            <line x1="0" y1="33.333" x2="100" y2="33.333" />
            <line x1="0" y1="66.667" x2="100" y2="66.667" />
          </g>
          <g class="grid-stroke">
            <line x1="33.333" y1="0" x2="33.333" y2="100" />
            <line x1="66.667" y1="0" x2="66.667" y2="100" />
            <line x1="0" y1="33.333" x2="100" y2="33.333" />
            <line x1="0" y1="66.667" x2="100" y2="66.667" />
          </g>
        </template>

        <!-- 黄金分割（Phi Grid 1 : 0.618 : 1 -> 38.2% / 61.8%） -->
        <template v-else-if="gridMode === 'golden'">
          <g class="grid-shadow">
            <line x1="38.197" y1="0" x2="38.197" y2="100" />
            <line x1="61.803" y1="0" x2="61.803" y2="100" />
            <line x1="0" y1="38.197" x2="100" y2="38.197" />
            <line x1="0" y1="61.803" x2="100" y2="61.803" />
          </g>
          <g class="grid-stroke">
            <line x1="38.197" y1="0" x2="38.197" y2="100" />
            <line x1="61.803" y1="0" x2="61.803" y2="100" />
            <line x1="0" y1="38.197" x2="100" y2="38.197" />
            <line x1="0" y1="61.803" x2="100" y2="61.803" />
          </g>
        </template>

        <!-- 中心与对角线（Center Cross + Diagonals） -->
        <template v-else-if="gridMode === 'diagonal'">
          <g class="grid-shadow">
            <line x1="0" y1="0" x2="100" y2="100" />
            <line x1="100" y1="0" x2="0" y2="100" />
            <line x1="50" y1="0" x2="50" y2="100" stroke-dasharray="4 3" />
            <line x1="0" y1="50" x2="100" y2="50" stroke-dasharray="4 3" />
          </g>
          <g class="grid-stroke">
            <line x1="0" y1="0" x2="100" y2="100" />
            <line x1="100" y1="0" x2="0" y2="100" />
            <line x1="50" y1="0" x2="50" y2="100" stroke-dasharray="4 3" />
            <line x1="0" y1="50" x2="100" y2="50" stroke-dasharray="4 3" />
          </g>
        </template>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.stage {
  --view-height: clamp(360px, calc(100dvh - 220px), 720px);
  position: relative;
  container-type: size;
  width: 100%;
  height: var(--view-height);
  background: var(--stage);
  overflow: hidden;
  touch-action: pan-y pinch-zoom;
  user-select: none;
}
@media (hover: hover) and (pointer: fine) {
  .stage {
    cursor: zoom-in;
  }
  .stage.is-magnified {
    cursor: grab;
  }
  .stage.is-dragging {
    cursor: grabbing;
  }
}
.stage:focus-visible {
  outline-offset: -4px;
}
.photo-frame {
  --photo-fit: contain;
  --muted: #a1a1aa;
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center;
  aspect-ratio: var(--aspect, 1.3333);
  width: min(100cqw, calc(100cqh * var(--aspect, 1.3333)));
  transform: translate(-50%, -50%);
}

.photo-frame.is-monochrome :deep(img) {
  filter: grayscale(100%) contrast(1.04);
}

.photo-frame > :first-child {
  background: var(--stage);
}

.composition-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 24%);
}

.composition-overlay line {
  vector-effect: non-scaling-stroke;
}

.grid-shadow line {
  stroke: rgb(0 0 0 / 48%);
  stroke-width: 2.2px;
}

.grid-stroke line {
  stroke: rgb(255 255 255 / 82%);
  stroke-width: 1px;
}

@media (max-width: 899px) {
  .stage {
    --view-height: clamp(280px, 56dvh, 630px);
    height: auto;
    min-height: min(220px, var(--view-height));
    max-height: var(--view-height);
    aspect-ratio: var(--aspect, 4 / 3);
  }
}

@media (max-width: 639px) {
  .stage {
    --view-height: clamp(235px, 54dvh, 490px);
  }
}
</style>
