<script setup lang="ts">
import photo from '@/assets/photo.json';
import Card from '@/components/card.vue';
import type { List } from '../../server/crawling';
import { computed } from 'vue';
import Head from '@/components/head.vue';
import { useResponseImage } from '@/hooks/use-response-image';
import { useColumns } from '@/hooks/use-columns';

// 列数
const columns = useColumns();

// 没列数据
const columnsData = computed(() => {
  const arr: List[][] = [];
  for (let i = 0; i < columns.value; i++) {
    arr.push(
      Array.from({ length: Math.floor(photo.length / columns.value) }).map(
        (_, index) => photo[index * columns.value + i] as List,
      ),
    );
  }
  return arr;
});

const pdfUrl = __APP_PDFURL;
const date = __APP_DATE;

const suffix = useResponseImage();

defineOptions({
  name: 'Home',
});
</script>

<template>
  <Head class="pos-sticky top-0 left-0 z-1 bg-#fff">
    <template #left>
      <div></div>
    </template>
    <div>每日推荐作品 {{ date }}</div>

    <template #right>
      <div class="text-size-2xl flex items-center">
        <a
          :href="pdfUrl"
          target="_blank"
          v-if="pdfUrl"
          class="mr-3"
          title="访问pdf文件"
        >
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

  <div class="flex p-4 gap-3">
    <div
      class="flex-1 flex flex-col gap-3"
      v-for="(column, index) of columnsData"
      :key="index"
    >
      <Card
        v-for="item of column"
        v-bind="item"
        :key="item.id"
        :pic-url="item.picUrl + suffix"
      ></Card>
    </div>
  </div>
</template>
