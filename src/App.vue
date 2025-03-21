<script setup lang="ts">
import useScreen from "@/hooks/use-screen";
import { watchEffect } from "vue";

const { activeBreakpoint } = useScreen();

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
  <router-view />
</template>
