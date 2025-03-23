import { useDevicePixelRatio, useWindowSize } from '@vueuse/core';
import { computed } from 'vue';
import { useColumns } from './use-columns';

export const useResponseImage = () => {
  const { pixelRatio } = useDevicePixelRatio();

  const { width } = useWindowSize();

  const columns = useColumns();

  const w = computed(() => {
    const value = (width.value / columns.value) * pixelRatio.value;

    return Math.ceil(value / 100) * 100;
  });

  const img = computed(() => {
    return `?thumb=1&w=${w.value}`;
  });
  return img;
};
