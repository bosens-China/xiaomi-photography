<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import photo from '@/assets/photo.json';
import { LeftOutlined, ShareAltOutlined } from '@ant-design/icons-vue';
import Head from '@/components/head.vue';
import useScreen from '@/hooks/use-screen';
import AuxiliaryLine from '@/components/auxiliary-line.vue';
import { useLocalStorage } from '@vueuse/core';

const route = useRoute();
const router = useRouter();

const { activeBreakpoint } = useScreen();

const item = computed(() => {
  const id = route.params.id;
  const item = photo.find((item) => item.id === id);
  return item;
});

// 是否禁止分享
const isShare = !!navigator.share;

const onShare = () => {
  if (!isShare) {
    return;
  }
  navigator.share({
    title: item.value?.name,
    text: item.value?.desc,
    url: window.location.href,
  });
};

const onBack = () => {
  router.back();
};

const show = useLocalStorage('auxiliary-line-show', true);
</script>
<template>
  <Head class="pos-sticky top-0 left-0 z-1 bg-#fff">
    <template #left>
      <LeftOutlined class="text-size-2xl" @click="onBack" />
    </template>
    <div>{{ item?.name }}</div>
    <template #right>
      <ShareAltOutlined
        class="text-size-2xl"
        :class="{
          'op-40': !isShare,
        }"
        @click="onShare"
      />
    </template>
  </Head>

  <div
    :style="{
      'max-width':
        activeBreakpoint === 'laptop'
          ? '80vw'
          : activeBreakpoint === 'desktop'
            ? `50vw`
            : undefined,
      margin: ['laptop', 'desktop'].includes(activeBreakpoint)
        ? 'auto'
        : undefined,
    }"
  >
    <AuxiliaryLine :show="show">
      <img
        :src="item?.picUrl"
        class="object-cover"
        :width="item?.width"
        :height="item?.height"
      />
    </AuxiliaryLine>

    <div
      class="text-size-4.5 lh-6 color-#4B5563 whitespace-pre-wrap my-3"
      v-if="item?.desc"
    >
      {{ item?.desc }}
    </div>
    <div class="my-3 flex-justify-end flex">
      <button
        class="color-#fff rounded-3 bg-#007AFF text-size-3 lh-5 py-2 px-3"
        @click="show = !show"
      >
        {{ show ? '隐藏' : '显示' }}九宫辅助线
      </button>
    </div>
  </div>
</template>
