export const retry = async <T extends () => Promise<unknown>>(
  fn: T,
  times = 3
): Promise<Awaited<ReturnType<T>>> => {
  for (let i = 1; ; i++) {
    try {
      return (await fn()) as never;
    } catch (e) {
      if (i >= times) {
        throw e;
      }
    }
  }
};
