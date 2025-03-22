<script setup lang="ts">
defineProps<{
  show: boolean;
}>();
</script>

<template>
  <div
    :class="{
      'pos-relative': show,
    }"
  >
    <slot></slot>
    <template v-if="show">
      <div
        class="pos-absolute left-0 right-0 top-33.33% h-0.5px bg-[rgba(255,255,255,0.60)]"
      ></div>
      <div
        class="pos-absolute left-0 right-0 top-66.66% h-0.5px bg-[rgba(255,255,255,0.60)]"
      ></div>
      <div
        class="pos-absolute top-0 bottom-0 left-33.33% w-0.5px bg-[rgba(255,255,255,0.60)]"
      ></div>
      <div
        class="pos-absolute top-0 bottom-0 left-66.66% w-0.5px bg-[rgba(255,255,255,0.60)]"
      ></div>
    </template>
  </div>
</template>
