<template>
  <div
    class="flex items-center flex-justify-between py-4 px-5 color-#111827 text-size-4.25 lh-6.4 font-600 px-4 py-3 border-b-solid border-b-1 border-b-#F3F4F6"
  >
    <slot name="left"></slot>
    <slot></slot>
    <slot name="right"></slot>
  </div>
</template>

<script setup lang="ts"></script>
