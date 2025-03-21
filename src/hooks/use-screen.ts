import { createSharedComposable, useBreakpoints } from "@vueuse/core";

const useScreen = () => {
  const breakpoints = useBreakpoints({
    mobile: 0, // optional
    tablet: 640,
    laptop: 1024,
    desktop: 1280,
  });

  const activeBreakpoint = breakpoints.active();

  return {
    activeBreakpoint,
  };
};

export default createSharedComposable(useScreen);
