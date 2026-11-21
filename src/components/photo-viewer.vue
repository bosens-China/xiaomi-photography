<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue';
import { useEventListener, useLocalStorage } from '@vueuse/core';
import {
  CheckOutlined,
  ExportOutlined,
  LeftOutlined,
  RightOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue';
import PhotoStage from './photo-stage.vue';
import {
  formatPhotoSpecs,
  type GridMode,
  type Photo,
} from '@/lib/photos';

const props = defineProps<{
  item: Photo;
  index: number;
  count: number;
  previous?: string;
  next?: string;
  back: string;
}>();

const GRID_OPTIONS: Array<{ value: GridMode; label: string }> = [
  { value: 'none', label: '关闭' },
  { value: 'thirds', label: '三分' },
  { value: 'golden', label: '黄金' },
  { value: 'diagonal', label: '对角' },
];

const gridMode = useLocalStorage<GridMode>('composition-grid-mode', 'none', {
  initOnMounted: true,
});
const monochrome = useLocalStorage('photo-monochrome', false, {
  initOnMounted: true,
});
const photoStage = useTemplateRef<InstanceType<typeof PhotoStage>>('photo-stage');
const specs = computed(() =>
  formatPhotoSpecs(props.item.width, props.item.height),
);

const heading = useTemplateRef<HTMLHeadingElement>('title');
const shareField = useTemplateRef<HTMLInputElement>('share-field');
const shareMessage = ref('');
const manualShareUrl = ref('');

onMounted(() => heading.value?.focus({ preventScroll: true }));

function move(direction: -1 | 1) {
  const href = direction === -1 ? props.previous : props.next;
  if (href) location.assign(href);
}

function toggleZoom() {
  photoStage.value?.toggle();
}

function cycleGrid() {
  const idx = GRID_OPTIONS.findIndex((opt) => opt.value === gridMode.value);
  const nextIdx = (idx + 1) % GRID_OPTIONS.length;
  gridMode.value = GRID_OPTIONS[nextIdx].value;
}

useEventListener('keydown', (event) => {
  if (
    event.defaultPrevented ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  if (
    event.target instanceof HTMLElement &&
    event.target.closest('input, textarea, [contenteditable]')
  )
    return;

  if (event.key === 'Escape') {
    location.assign(props.back);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    if (!event.repeat) move(event.key === 'ArrowLeft' ? -1 : 1);
  } else if (event.key === 'g' || event.key === 'G') {
    event.preventDefault();
    if (!event.repeat) cycleGrid();
  } else if (event.key === 'm' || event.key === 'M') {
    event.preventDefault();
    if (!event.repeat) monochrome.value = !monochrome.value;
  } else if (event.key === 'z' || event.key === 'Z') {
    event.preventDefault();
    if (!event.repeat) toggleZoom();
  }
});

async function share() {
  shareMessage.value = '';
  manualShareUrl.value = '';
  const url = location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: props.item.name, url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    shareMessage.value = '已复制作品链接';
    setTimeout(() => {
      if (shareMessage.value === '已复制作品链接') shareMessage.value = '';
    }, 2500);
  } catch {
    manualShareUrl.value = url;
    await nextTick();
    shareField.value?.focus();
    shareField.value?.select();
  }
}
</script>

<template>
  <div class="preview-layout">
    <section
      class="card-surface overflow-hidden"
      aria-label="作品大图"
    >
      <PhotoStage
        :photo="item"
        ref="photo-stage"
        :grid-mode="gridMode"
        :monochrome="monochrome"
        @move="move"
      />
      <nav
        class="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-border bg-card"
        aria-label="切换作品"
      >
        <a
          v-if="previous"
          class="control"
          :href="previous"
          aria-keyshortcuts="ArrowLeft"
        >
          <LeftOutlined aria-hidden="true" class="text-xs" />
          <span>上一张</span>
        </a>
        <span v-else class="control" aria-disabled="true">
          <LeftOutlined aria-hidden="true" class="text-xs" />
          <span>上一张</span>
        </span>
        <div class="flex flex-wrap items-center justify-center gap-x-2 text-xs text-muted-foreground">
          <span
            class="font-mono tabular-nums text-foreground font-medium"
            aria-live="polite"
          >
            {{ index + 1 }} / {{ count }}
          </span>
          <span class="desktop-zoom-hint hidden sm:inline text-border">·</span>
          <span class="desktop-zoom-hint hidden sm:inline text-[11px]">
            捏合 / Ctrl + 滚轮缩放 · 双击放大或复位
          </span>
          <span class="touch-zoom-hint text-[11px]">双指缩放</span>
        </div>
        <a
          v-if="next"
          class="control"
          :href="next"
          aria-keyshortcuts="ArrowRight"
        >
          <span>下一张</span>
          <RightOutlined aria-hidden="true" class="text-xs" />
        </a>
        <span v-else class="control" aria-disabled="true">
          <span>下一张</span>
          <RightOutlined aria-hidden="true" class="text-xs" />
        </span>
      </nav>
    </section>

    <aside
      class="card-surface p-5 sm:p-6 flex flex-col gap-5"
      aria-labelledby="photo-title"
    >
      <!-- 1. 作品档案与元数据区 -->
      <header class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center rounded border border-border bg-secondary px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground tabular-nums">
            NO.{{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="text-[11px] font-mono text-muted-foreground">
            {{ specs.ratioLabel }} · {{ specs.orientation }}
          </span>
        </div>

        <div>
          <h1
            id="photo-title"
            ref="title"
            tabindex="-1"
            class="m-0 text-xl sm:text-2xl font-semibold tracking-tight leading-snug text-foreground break-words focus:outline-none"
          >
            {{ item.name }}
          </h1>
          <p
            v-if="item.userName"
            class="m-0 mt-1 text-sm text-muted-foreground break-words"
          >
            摄影师：<span class="text-foreground font-medium">{{ item.userName }}</span>
          </p>
        </div>

        <p
          v-if="item.desc"
          class="m-0 pt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words"
        >
          {{ item.desc }}
        </p>

        <!-- 画幅与分辨率规格小卡片 -->
        <dl class="m-0 mt-1 grid grid-cols-2 gap-2.5">
          <div class="rounded-md border border-border bg-secondary/50 px-3 py-2">
            <dt class="text-[11px] text-muted-foreground">画幅比例</dt>
            <dd class="m-0 mt-0.5 text-xs font-mono font-medium text-foreground tabular-nums">
              {{ specs.ratioLabel }} ({{ specs.orientation }})
            </dd>
          </div>
          <div class="rounded-md border border-border bg-secondary/50 px-3 py-2">
            <dt class="text-[11px] text-muted-foreground">原始分辨率</dt>
            <dd class="m-0 mt-0.5 text-xs font-mono font-medium text-foreground tabular-nums">
              {{ specs.dimensions }} · {{ specs.megapixels }}
            </dd>
          </div>
        </dl>
      </header>

      <!-- 2. 构图与光影观察工具区（按钮独立间距，解耦不粘连） -->
      <div
        class="pt-4 border-t border-border flex flex-col gap-4"
        role="group"
        aria-label="构图与光影观察工具"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold tracking-tight text-foreground">
            构图与光影观察
          </span>
          <button
            v-if="gridMode !== 'none' || monochrome"
            type="button"
            class="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 bg-transparent border-0 p-0"
            @click="
              gridMode = 'none';
              monochrome = false;
              photoStage?.reset();
            "
          >
            重置视图
          </button>
        </div>

        <!-- 构图辅助线 -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">构图辅助线</span>
            <span class="text-[11px] font-mono text-muted-foreground">
              {{
                gridMode === 'none'
                  ? '未开启'
                  : gridMode === 'thirds'
                    ? '井字三分法'
                    : gridMode === 'golden'
                      ? '1:0.618 黄金分割'
                      : '中心十字与对角线'
              }}
            </span>
          </div>
          <div
            class="grid grid-cols-4 gap-2"
            role="group"
            aria-label="构图辅助线模式"
          >
            <button
              v-for="option in GRID_OPTIONS"
              :key="option.value"
              type="button"
              class="control !min-h-8 !px-2 !py-1 !text-xs"
              :aria-pressed="gridMode === option.value"
              @click="gridMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- 影调观察（原彩 / 黑白） -->
        <div class="flex flex-col gap-2">
          <span class="text-xs text-muted-foreground">影调模式</span>
          <div
            class="grid grid-cols-2 gap-2.5"
            role="group"
            aria-label="影调观察模式"
          >
            <button
              type="button"
              class="control !min-h-8 !px-3 !py-1 !text-xs"
              :aria-pressed="!monochrome"
              @click="monochrome = false"
            >
              原彩
            </button>
            <button
              type="button"
              class="control !min-h-8 !px-3 !py-1 !text-xs"
              :aria-pressed="monochrome"
              @click="monochrome = true"
            >
              黑白明暗
            </button>
          </div>
        </div>
      </div>

      <!-- 3. 导出分享与键盘快捷键提示 -->
      <div class="pt-4 border-t border-border flex flex-col gap-3.5">
        <div class="grid grid-cols-2 gap-2.5">
          <a
            class="control"
            :href="item.picUrl"
            target="_blank"
            rel="noopener"
          >
            <ExportOutlined aria-hidden="true" class="text-xs" />
            <span>打开原图</span>
          </a>
          <button class="control" type="button" @click="share">
            <CheckOutlined
              v-if="shareMessage"
              aria-hidden="true"
              class="text-xs"
            />
            <ShareAltOutlined v-else aria-hidden="true" class="text-xs" />
            <span>{{ shareMessage || '分享作品' }}</span>
          </button>
        </div>

        <label
          v-if="manualShareUrl"
          class="flex flex-col gap-1.5 text-xs text-muted-foreground"
        >
          <span>复制作品链接</span>
          <input
            ref="share-field"
            :value="manualShareUrl"
            readonly
            class="w-full min-h-9 px-2.5 py-1.5 rounded-md border border-border bg-secondary text-foreground text-xs font-mono"
          />
        </label>

        <!-- 桌面端键盘快捷键提示栏 -->
        <div
          class="hidden sm:flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground"
          aria-label="键盘快捷键提示"
        >
          <span class="inline-flex items-center gap-1.5">
            <kbd class="kbd-badge">←</kbd>
            <kbd class="kbd-badge">→</kbd>
            <span>切图</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <kbd class="kbd-badge">G</kbd>
            <span>网格</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <kbd class="kbd-badge">M</kbd>
            <span>黑白</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <kbd class="kbd-badge">Z</kbd>
            <span>缩放</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <kbd class="kbd-badge">Esc</kbd>
            <span>返回</span>
          </span>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 350px);
  align-items: start;
  gap: 18px;
}

.touch-zoom-hint {
  display: none;
}

@media (hover: none), (pointer: coarse) {
  .desktop-zoom-hint {
    display: none;
  }

  .touch-zoom-hint {
    display: inline;
  }
}

.kbd-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding-inline: 4px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--secondary);
  color: var(--foreground);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  line-height: 1;
}

@media (max-width: 960px) {
  .preview-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 639px) {
  .preview-layout {
    gap: 12px;
  }
}
</style>
