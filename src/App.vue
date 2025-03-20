<script setup lang="ts">
import photo from "./assets/photo.json";
import Card from "./components/card.vue";
import type { List } from "../server/crawling";
import { useWindowSize } from "@vueuse/core";
import { computed } from "vue";
import { useBreakpoints } from "@vueuse/core";
import { GithubOutlined } from "@ant-design/icons-vue";

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

// 后缀参数
const suffix = computed(() => {
  return `?thumb=1&w=${(width.value ?? 0) / columns.value}`;
});

const pdfUrl = __APP_PDFURL;
const date = __APP_DATE;

const gapStyle = computed(() => {
  if (columns.value >= 3) {
    return {
      x: { gap: "30px" },
      y: { gap: "40px" },
    };
  }
  return null;
});
</script>

<template>
  <div
    class="color-#111827 text-size-4.5 lh-7 px-4 py-3 bg-#fff text-center mb-3 flex justify-center pos-relative"
    :style="{
      boxShadow: `0rem 0.25rem 0.5rem 0rem rgba(0, 0, 0, 0.05), 0rem 0rem 0rem 0rem rgba(0, 0, 0, 0.00), 0rem 0rem 0rem 0rem rgba(0, 0, 0, 0.00)`,
    }"
  >
    <div class="mr-3">每日推荐作品 {{ date }}</div>
    <a :href="pdfUrl" target="_blank" v-if="pdfUrl">查看 PDF</a>

    <a
      title="访问github"
      href="https://github.com/bosens-China/xiaomi-photography"
      target="_blank"
      class="pos-absolute right-5 color-#000 text-size-2xl"
    >
      <GithubOutlined />
    </a>
  </div>
  <div class="flex gap-2 mb-3" :style="gapStyle?.x">
    <div
      class="flex-1 flex flex-col gap-3"
      v-for="(column, index) of columnsData"
      :key="index"
      :style="gapStyle?.y"
    >
      <Card
        v-for="item of column"
        v-bind="item"
        :key="item.id + suffix"
        :suffix="suffix"
      ></Card>
    </div>
  </div>
</template>
