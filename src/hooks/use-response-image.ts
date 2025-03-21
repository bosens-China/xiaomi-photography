import { useDevicePixelRatio, useWindowSize } from "@vueuse/core";
import { computed } from "vue";
import useScreen from "./use-screen";

export const useResponseImage = () => {
  const { pixelRatio } = useDevicePixelRatio();
  const { activeBreakpoint } = useScreen();

  const { width } = useWindowSize();

  const w = computed(() => {
    switch (activeBreakpoint.value) {
      case "laptop":
      case "desktop":
        return Math.ceil(width.value / 100) * 100;

      default:
        return Math.ceil((width.value * pixelRatio.value) / 100) * 100;
    }
  });

  const img = computed(() => {
    return `?thumb=1&w=${w.value}`;
  });
  return img;
};
