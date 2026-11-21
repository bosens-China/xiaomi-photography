<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import PhotoImage from '@/components/photo-image.vue';
import type { GridMode, Photo } from '@/lib/photos';

const props = defineProps<{
  photo: Photo;
  original: boolean;
  gridMode: GridMode;
  monochrome: boolean;
}>();
const emit = defineEmits<{
  move: [direction: -1 | 1];
  toggleZoom: [];
}>();
const stage = useTemplateRef<HTMLDivElement>('stage');
let touchStart: Touch | undefined;

const dragging = ref(false);
let dragMoved = false;
let dragOrigin:
  | { x: number; y: number; left: number; top: number }
  | undefined;

const frameStyle = computed(() => {
  const { width, height } = props.photo;
  return width && height && width > 0 && height > 0
    ? { '--aspect': width / height, '--original-width': `${width}px` }
    : undefined;
});

watch(
  () => [props.photo.id, props.original],
  () => {
    stage.value?.scrollTo(0, 0);
  },
  { flush: 'post' },
);

function startSwipe(event: TouchEvent) {
  touchStart =
    !props.original && event.touches.length === 1
      ? event.touches[0]
      : undefined;
}

function endSwipe(event: TouchEvent) {
  const start = touchStart;
  touchStart = undefined;
  if (!start || event.touches.length) return;

  const end = Array.from(event.changedTouches).find(
    ({ identifier }) => identifier === start.identifier,
  );
  if (!end) return;
  const dx = end.clientX - start.clientX;
  const dy = end.clientY - start.clientY;
  if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.5)
    emit('move', dx > 0 ? -1 : 1);
}

function startDrag(event: MouseEvent) {
  if (!props.original || event.button !== 0 || !stage.value) return;
  event.preventDefault();
  dragging.value = true;
  dragMoved = false;
  dragOrigin = {
    x: event.clientX,
    y: event.clientY,
    left: stage.value.scrollLeft,
    top: stage.value.scrollTop,
  };
}

function onDrag(event: MouseEvent) {
  if (!dragging.value || !dragOrigin || !stage.value) return;
  const dx = event.clientX - dragOrigin.x;
  const dy = event.clientY - dragOrigin.y;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
  stage.value.scrollLeft = dragOrigin.left - dx;
  stage.value.scrollTop = dragOrigin.top - dy;
}

function endDrag() {
  dragging.value = false;
  dragOrigin = undefined;
}

function onDoubleClick() {
  if (!dragMoved) emit('toggleZoom');
}

function panWithArrows(event: KeyboardEvent) {
  if (
    props.original &&
    (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
  )
    event.stopPropagation();
}
</script>

<template>
  <div
    ref="stage"
    class="stage"
    :class="{
      'stage-original': original,
      'is-dragging': dragging,
    }"
    :style="frameStyle"
    :tabindex="original ? 0 : undefined"
    :role="original ? 'region' : undefined"
    :aria-label="
      original
        ? '原始尺寸照片，可滚动或拖拽查看，双击切回适应屏幕'
        : '适应屏幕，双击可查看原始尺寸'
    "
    @keydown="panWithArrows"
    @mousedown="startDrag"
    @mousemove="onDrag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
    @dblclick="onDoubleClick"
    @touchstart.passive="startSwipe"
    @touchend.passive="endSwipe"
    @touchcancel="touchStart = undefined"
  >
    <div class="photo-frame" :class="{ 'is-monochrome': monochrome }">
      <PhotoImage
        :photo="photo"
        :original="original"
        sizes="(min-width: 1272px) 850px, (min-width: 900px) 65vw, 100vw"
        eager
      />

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
  display: grid;
  place-items: center;
  width: 100%;
  height: var(--view-height);
  background: var(--stage);
  overflow: hidden;
  touch-action: pan-y pinch-zoom;
  cursor: zoom-in;
}

.stage-original {
  display: block;
  overflow: auto;
  touch-action: auto;
  cursor: grab;
  user-select: none;
}

.stage-original.is-dragging {
  cursor: grabbing;
}

.stage-original:focus-visible {
  outline-offset: -4px;
}

.photo-frame {
  --photo-fit: contain;
  --muted: #a1a1aa;
  position: relative;
  aspect-ratio: var(--aspect, 4 / 3);
  width: min(100%, calc(var(--view-height) * var(--aspect, 1.3333)));
  transition: filter 220ms ease;
}

.photo-frame.is-monochrome :deep(img) {
  filter: grayscale(100%) contrast(1.04);
}

.photo-frame > :first-child {
  background: var(--stage);
}

.stage-original .photo-frame {
  width: var(--original-width, 100%);
  margin-inline: auto;
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
