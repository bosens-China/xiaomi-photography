<script setup lang="ts">
import { useTemplateRef, ref, computed } from "vue";
import type { List } from "../../server/crawling";
import { RouterLink } from "vue-router";
import { useIntersectionObserver } from "@vueuse/core";

const props = defineProps<List>();

const target = useTemplateRef<HTMLImageElement>("el");
const onError = () => {
  target.value!.src = props.picUrl;
};

const targetIsVisible = ref(false);

useIntersectionObserver(target, ([entry]) => {
  targetIsVisible.value = entry?.isIntersecting || false;
});

const imgSrc = computed(() => {
  if (targetIsVisible.value) {
    return props.picUrl;
  }
  return "";
});
</script>

<template>
  <RouterLink :to="`/preview/${id}`">
    <div
      class="rounded-3 cursor-pointer pos-relative"
      :style="{
        boxShadow: `0rem 0.25rem 0.5rem 0rem rgba(0, 0, 0, 0.05), 0rem 0rem 0rem 0rem rgba(0, 0, 0, 0.00), 0rem 0rem 0rem 0rem rgba(0, 0, 0, 0.00)`,
      }"
    >
      <img
        :src="imgSrc"
        class="w-100%"
        @error="onError"
        ref="el"
        :alt="desc"
        :width="width"
        :height="height"
        loading="lazy"
      />
      <div class="p-3">
        <div class="color-#111827 text-size-3 font-500 lh-4">
          {{ name }}
        </div>
        <div v-if="desc" class="color-#6B7280 text-size-3 lh-4 mt-1">
          {{ userName }}
        </div>
      </div>
    </div>
  </RouterLink>
</template>
