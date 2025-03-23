import { computed } from 'vue';
import useScreen from './use-screen';
import { useWindowSize } from '@vueuse/core';

export const useColumns = () => {
  const { width } = useWindowSize();
  const { activeBreakpoint } = useScreen();

  const columns = computed(() => {
    if (activeBreakpoint.value === 'mobile') {
      return 2;
    }

    if (activeBreakpoint.value === 'tablet') {
      return 2;
    }

    if (activeBreakpoint.value === 'laptop') {
      return 3;
    }
    return Math.floor(width.value / 512);
  });

  return columns;
};
