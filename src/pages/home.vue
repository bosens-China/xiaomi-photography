<script setup lang="ts">
import photo from "@/assets/photo.json";
import Card from "@/components/card.vue";
import type { List } from "../../server/crawling";
import { useWindowSize } from "@vueuse/core";
import { computed, watchEffect } from "vue";
import { useBreakpoints } from "@vueuse/core";
import Head from "@/components/head.vue";

const breakpoints = useBreakpoints({
  mobile: 0, // optional
  tablet: 640,
  laptop: 1024,
  desktop: 1280,
});

const { width } = useWindowSize();

const activeBreakpoint = breakpoints.active();

// 列数
const columns = computed(() => {
  if (activeBreakpoint.value === "mobile") {
    return 2;
  }

  if (activeBreakpoint.value === "tablet") {
    return 2;
  }

  if (activeBreakpoint.value === "laptop") {
    return 3;
  }
  return Math.floor(width.value / 512);
});

// 没列数据
const columnsData = computed(() => {
  const arr: List[][] = [];
  for (let i = 0; i < columns.value; i++) {
    arr.push(
      Array.from({ length: Math.floor(photo.length / columns.value) }).map(
        (_, index) => photo[index * columns.value + i] as List
      )
    );
  }
  return arr;
});

const pdfUrl = __APP_PDFURL;
const date = __APP_DATE;

// 根据尺寸不同，给html设置不同大小字体
watchEffect(() => {
  const html = document.querySelector("html");
  if (!html) {
    return;
  }
  html.style.fontSize = "";
  switch (activeBreakpoint.value) {
    case "laptop":
    case "desktop":
      html.style.fontSize = `34px`;
      return;

    // case "desktop":
    //   html.style.fontSize = `${Math.max(Math.floor(width.value / 34), 50)}px`;
    //   return;
  }
});
</script>

<template>
  <div class="flex flex-col h-100vh">
    <Head>
      <template #left>
        <div></div>
      </template>
      <div>每日推荐作品 {{ date }}</div>

      <template #right>
        <div class="text-size-2xl flex items-center">
          <a :href="pdfUrl" target="_blank" v-if="pdfUrl" class="mr-3">
            <div class="i-vscode-icons-file-type-pdf2"></div>
          </a>
          <a
            title="访问github"
            href="https://github.com/bosens-China/xiaomi-photography"
            target="_blank"
            class="color-#000"
          >
            <div class="i-devicon-github"></div>
          </a>
        </div>
      </template>
    </Head>

    <div class="flex p-4 gap-3 flex-1 overflow-auto">
      <div
        class="flex-1 flex flex-col gap-3"
        v-for="(column, index) of columnsData"
        :key="index"
      >
        <Card v-for="item of column" v-bind="item" :key="item.id"></Card>
      </div>
    </div>
  </div>
</template>
