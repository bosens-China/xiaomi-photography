import { useDevicePixelRatio, useWindowSize } from "@vueuse/core";
import { computed } from "vue";
import useScreen from "./use-screen";

export const useResponseImage = () => {
  const { pixelRatio } = useDevicePixelRatio();
  const { activeBreakpoint } = useScreen();

  const { width } = useWindowSize();

  const img = computed(() => {
    switch (activeBreakpoint.value) {
      case "laptop":
      case "desktop":
        return "";

      default:
        return `?thumb=1&w=${
          Math.ceil((width.value * pixelRatio.value) / 100) * 100
        }`;
    }
  });
  return img;
};
