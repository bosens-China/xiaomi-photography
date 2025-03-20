export const retry = async <T>(fn: () => Promise<T>, times = 3) => {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= times) {
        throw e;
      }
    }
  }
};
