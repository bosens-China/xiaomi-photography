<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";
import photo from "@/assets/photo.json";
import { LeftOutlined, ShareAltOutlined } from "@ant-design/icons-vue";
import Head from "@/components/head.vue";
import useScreen from "@/hooks/use-screen";

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
    class="py-5"
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
    <div
      class="text-size-4.5 lh-6 color-#4B5563 whitespace-pre-wrap p-3 mb-1"
      v-if="item?.desc"
    >
      {{ item?.desc }}
    </div>

    <img
      :src="item?.picUrl"
      class="object-cover"
      :width="item?.width"
      :height="item?.height"
    />
  </div>
</template>
