<script setup lang="ts">
import { useTemplateRef, type ImgHTMLAttributes } from "vue";
import type { List } from "../../server/crawling";

const props = defineProps<List & { suffix: string }>();

const ref = useTemplateRef<ImgHTMLAttributes>("el");
const onError = () => {
  ref.value!.src = props.picUrl;
};

const onJump = () => {
  const imageHTML = `
    <html>
      <body style="margin:0; background:#000; display:grid; place-items:center; height:100vh;">
        <img src="${props.picUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />
      </body>
    </html>
  `;

  // 将HTML转换为Blob URL
  const blob = new Blob([imageHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 30000);
};
</script>

<template>
  <div class="rounded-3 cursor-pointer pos-relative group" @click="onJump">
    <img
      :src="picUrl + suffix"
      class="w-100% h-auto"
      @error="onError"
      ref="el"
      :alt="desc"
      loading="lazy"
    />
    <div
      class="pos-absolute bottom-0 left-0 bg-[rgba(0,0,0,.7)] color-#eee p-3 right-0 text-center lh-6 op-0 group-hover:op-100 transition-all-100"
    >
      <div>
        {{ name }}
        {{ userName }}
      </div>
      <div v-if="desc">
        {{ desc }}
      </div>
    </div>
  </div>
</template>
