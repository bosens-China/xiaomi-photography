import "virtual:uno.css";
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import "@unocss/reset/tailwind-compat.css";
import { createWebHashHistory, createRouter } from "vue-router";

const routes = [
  { path: "/", component: () => import("@/pages/home.vue") },
  { path: "/preview/:id", component: () => import("@/pages/preview.vue") },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

createApp(App).use(router).mount("#app");
