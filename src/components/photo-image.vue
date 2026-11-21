<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import { PictureOutlined } from '@ant-design/icons-vue';
import { imageSources, type Photo } from '@/lib/photos';

const props = defineProps<{
  photo: Photo;
  sizes?: string;
  eager?: boolean;
  original?: boolean;
  decorative?: boolean;
}>();

const state = ref<'responsive' | 'original' | 'unavailable'>('responsive');
const loaded = ref(false);

watch(
  () => [props.photo.picUrl, props.original],
  async () => {
    loaded.value = false;
    state.value = 'responsive';
    await nextTick();
    resolveCompleteImage();
  },
);

const img = useTemplateRef<HTMLImageElement>('img');
const sources = computed(() =>
  imageSources(
    props.photo,
    props.original || !props.sizes || state.value !== 'responsive',
  ),
);

function onError() {
  loaded.value = false;
  state.value = sources.value.srcset ? 'original' : 'unavailable';
}

function resolveCompleteImage() {
  const el = img.value;
  if (!el?.complete) return;
  if (el.naturalWidth > 0) loaded.value = true;
  else onError();
}

onMounted(resolveCompleteImage);
</script>

<template>
  <div class="photo-image">
    <img
      v-if="state !== 'unavailable'"
      ref="img"
      :src="sources.src"
      :srcset="sources.srcset"
      :sizes="sources.srcset ? sizes : undefined"
      :alt="decorative ? '' : photo.name"
      :width="photo.width"
      :height="photo.height"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : undefined"
      decoding="async"
      @load="loaded = true"
      @error="onError"
    />
    <div v-else class="image-unavailable">
      <PictureOutlined aria-hidden="true" />
      <span>图片暂不可用</span>
    </div>
    <div
      v-if="!loaded && state !== 'unavailable'"
      class="image-loading"
      role="status"
    >
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>图片加载中…</span>
    </div>
  </div>
</template>

<style scoped>
.photo-image {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--secondary);
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: var(--photo-fit, cover);
  object-position: var(--photo-position, center);
}

.image-loading {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8px;
  pointer-events: none;
  color: var(--muted);
  font-size: 0.8125rem;
}

.loading-spinner {
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: image-loading-spin 800ms linear infinite;
}

@keyframes image-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
}

.image-unavailable {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  color: var(--muted);
  font-size: 0.8125rem;
}

.image-unavailable .anticon {
  font-size: 1.4rem;
}
</style>
