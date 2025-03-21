<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";
import photo from "@/assets/photo.json";
import { LeftOutlined, ShareAltOutlined } from "@ant-design/icons-vue";
import Head from "@/components/head.vue";

const route = useRoute();
const router = useRouter();

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
  <div class="flex flex-col h-100vh">
    <Head>
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
    <div class="flex-1 overflow-auto flex justify-center items-center flex-col">
      <div
        class="text-size-4.5 lh-6 color-#4B5563 whitespace-pre-wrap p-3"
        v-if="item?.desc"
      >
        {{ item?.desc }}
      </div>
      <div>
        <img
          :src="item?.picUrl"
          class="object-cover"
          :width="item?.width"
          :height="item?.height"
        />
      </div>
    </div>
  </div>
</template>
