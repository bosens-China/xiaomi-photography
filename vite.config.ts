import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import {
  __APP_DATE,
  __APP_PDFURL,
} from "./src/assets/transplant-information.json";
import { dependencies } from "./package.json";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const base =
    command === "build" && !process.env.vercel ? "/xiaomi-photography/" : "/";
  return {
    plugins: [vue(), UnoCSS()],
    server: {
      port: 4441,
    },
    base,
    define: {
      __APP_PDFURL: JSON.stringify(base + __APP_PDFURL),
      __APP_DATE: JSON.stringify(__APP_DATE),
    },
    build: {
      rollupOptions: {
        output: {
          // 拆包，不要打成一个文件
          manualChunks: {
            ...Object.keys(dependencies)
              .filter(
                (f) =>
                  ![
                    "@unocss",
                    //  '@iconify-json', 'antd'
                  ].find((item) => f.startsWith(item))
              )
              .reduce((chunks, name) => {
                chunks[name] = [name];
                return chunks;
              }, {} as Record<string, [string]>),
          },
        },
      },
    },
  };
});
