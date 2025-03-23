<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import {
  computed,
  type CSSProperties,
  onMounted,
  ref,
  useTemplateRef,
} from 'vue';
import photo from '@/assets/photo.json';
import { LeftOutlined, ShareAltOutlined } from '@ant-design/icons-vue';
import Head from '@/components/head.vue';
import AuxiliaryLine from '@/components/auxiliary-line.vue';
import { useEventListener, useLocalStorage } from '@vueuse/core';
import { Button, Space, Select } from 'ant-design-vue';
import useScreen from '@/hooks/use-screen';

const route = useRoute();
const router = useRouter();

const item = computed(() => {
  const id = route.params.id;
  const item = photo.find((item) => item.id === id);
  return item;
});

const { activeBreakpoint } = useScreen();

// 是否非移动端下
const isMobile = computed(() => {
  return !['laptop', 'desktop'].includes(activeBreakpoint.value);
});

// 是否禁止分享
const isShare = !!navigator.share;

const onShare = () => {
  if (!isShare) {
    return;
  }
  navigator.share({
    title: title.value,
    text: item.value?.desc,
    url: window.location.href,
  });
};

const onBack = () => {
  router.back();
};

const show = useLocalStorage('auxiliary-line-show', true);
const title = computed(() => {
  const { name, userName } = item.value || {};
  return `${name}-${userName}`;
});

// 图片展示尺寸方式
const size = useLocalStorage('preview-size', 'auto');

const otherHeight = ref(0);

const divEl = useTemplateRef<HTMLDivElement>('root');

// 计算尺寸函数
const calcDimensions = () => {
  if (!divEl.value) {
    return;
  }
  const otherAll = Array.from(
    divEl.value.querySelectorAll(':scope > :not(.auxiliary_line)'),
  );
  otherHeight.value = otherAll.reduce((pre, cur) => {
    const styles = window.getComputedStyle(cur);
    const marginTop = parseFloat(styles.marginTop) || 0;
    const marginBottom = parseFloat(styles.marginBottom) || 0;
    const height = parseFloat(styles.height) || 0;
    return pre + marginTop + marginBottom + height;
  }, 0);
};

useEventListener(window, 'resize', () => {
  calcDimensions();
});

onMounted(() => {
  calcDimensions();
});

const imgStyle = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {};
  }
  if (size.value === 'auto') {
    return {
      height: `calc(100vh - ${otherHeight.value}px)`,
      width: 'auto',
      // margin: 'auto',
      // 'maxHeight': ,
    };
  }
  return {};
});
</script>
<template>
  <div ref="root">
    <Head class="pos-sticky top-0 left-0 z-1 bg-#fff">
      <template #left>
        <LeftOutlined class="text-size-2xl" @click="onBack" />
      </template>
      <div>{{ title }}</div>
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

    <AuxiliaryLine :show="show" class="auxiliary_line">
      <img
        :src="item?.picUrl"
        class="object-cover"
        :width="item?.width"
        :height="item?.height"
        :style="imgStyle"
      />
    </AuxiliaryLine>

    <div class="my-3 flex items-center flex-col p-3">
      <div
        class="text-size-4.5 lh-6 color-#4B5563 whitespace-pre-wrap mb-3"
        v-if="item?.desc"
      >
        {{ item?.desc }}
      </div>

      <Space :size="'large'">
        <Select
          v-if="!isMobile"
          v-model:value="size"
          class="w-20"
          :options="[
            {
              label: '适应屏幕',
              value: 'auto',
            },
            {
              label: '原始尺寸',
              value: 'original',
            },
          ]"
          :size="isMobile ? 'middle' : 'large'"
        ></Select>

        <Button
          @click="show = !show"
          type="primary"
          :size="isMobile ? 'middle' : 'large'"
        >
          {{ show ? '隐藏' : '显示' }}九宫辅助线
        </Button>
      </Space>
    </div>
  </div>
</template>
