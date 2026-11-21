import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import UnoCSS from '@unocss/astro';

export default defineConfig({
  base: '/xiaomi-photography',
  trailingSlash: 'always',
  server: { port: 4441 },
  integrations: [
    UnoCSS({
      injectReset: false,
    }),
    vue(),
  ],
});
