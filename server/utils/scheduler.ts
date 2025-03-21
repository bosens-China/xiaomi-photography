import { retry } from "./retry";

interface Props<T> {
  // 并发数
  concurrencyLevel: number;
  // 重试次数
  retryCount: number;

  onChange: (obj: { executed: number; current: T }) => void;
}
export const scheduler = <T extends () => Promise<unknown>>(
  tasks: Array<T>,
  props?: Partial<Props<T>>
) => {
  const { concurrencyLevel = 5, retryCount = 3, onChange } = props || {};
  const myTasks = [...tasks];

  const arr: Array<Awaited<ReturnType<T>>> = [];

  const { resolve, reject, promise } =
    Promise.withResolvers<Awaited<ReturnType<T>>[]>();

  const checkComplete = () => {
    if (arr.filter(Boolean).length === tasks.length) {
      resolve(arr);
    }
  };

  const next = async (current?: T) => {
    if (!current) {
      return;
    }
    try {
      const result = await retry(current, retryCount);
      arr[tasks.indexOf(current)] = result;
      onChange?.({
        executed: arr.filter(Boolean).length,
        current,
      });
      const nextTask = myTasks.shift();
      next(nextTask);
    } catch (e) {
      reject(e);
    } finally {
      checkComplete();
    }
  };

  Array.from({ length: Math.min(concurrencyLevel, tasks.length) }).forEach(
    (_, index) => {
      const current = myTasks.splice(index, 1)[0];
      next(current);
    }
  );

  return promise;
};
