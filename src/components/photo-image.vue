<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
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

watch(
  () => [props.photo.picUrl, props.original],
  () => {
    state.value = 'responsive';
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
  state.value = sources.value.srcset ? 'original' : 'unavailable';
}

onMounted(() => {
  if (img.value?.complete && !img.value.naturalWidth) onError();
});
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
      @error="onError"
    />
    <div v-else class="image-unavailable">
      <PictureOutlined aria-hidden="true" />
      <span>图片暂不可用</span>
    </div>
  </div>
</template>

<style scoped>
.photo-image {
  width: 100%;
  height: 100%;
  background: var(--secondary);
}

img {
  width: 100%;
  height: 100%;
  object-fit: var(--photo-fit, cover);
  object-position: var(--photo-position, center);
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
