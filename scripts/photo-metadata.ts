import { imageMetadata } from 'astro/assets/utils';
import { workKey, type EditionSource } from './xiaomi-source.ts';
import type { IssueData } from '../src/lib/issue-schema.ts';

type Size = { width: number; height: number };

export async function readImageSize(
  url: string,
  fetchImage: typeof fetch = fetch,
): Promise<Size> {
  const response = await fetchImage(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok || !response.body)
    throw new Error(`无法读取原图: ${url} HTTP ${response.status}`);
  const reader = response.body.getReader();
  let bytes = new Uint8Array(0);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) throw new Error(`无法识别图片实际尺寸: ${url}`);
      const next = new Uint8Array(bytes.length + value.length);
      next.set(bytes);
      next.set(value, bytes.length);
      bytes = next;
      if (bytes.length > 50 * 1024 * 1024)
        throw new Error(`图片超过 50 MiB 探测上限: ${url}`);
      try {
        const { width, height } = await imageMetadata(bytes, url);
        if (width > 0 && height > 0) return { width, height };
      } catch {
        // 图片头可能跨网络数据块，继续读取；识别到尺寸后立即取消下载。
      }
    }
  } finally {
    await reader.cancel();
  }
}

export async function hydratePhotos(
  sources: EditionSource[],
  archive: Iterable<IssueData> = [],
): Promise<EditionSource[]> {
  const issues = [...archive];
  const enriched = sources.map((source) => ({
    ...source,
    works: source.works.map((work) => {
      const photo = issues
        .filter(
          (issue) =>
            issue.edition === source.edition &&
            (issue.title.match(/20\d{2}/)?.[0] ?? issue.date.slice(0, 4)) ===
              source.year,
        )
        .flatMap((issue) => issue.photos)
        .find(
          (photo) =>
            photo.sourceIds?.some((id) => work.sourceIds.includes(id)) ||
            workKey(photo) === workKey(work),
        );
      return {
        ...work,
        ...(photo
          ? {
              photo: {
                picUrl: photo.picUrl,
                width: photo.width,
                height: photo.height,
                ...(photo.variants ? { variants: photo.variants } : {}),
              },
            }
          : {}),
      };
    }),
  }));
  const cache = new Map<string, Promise<Size>>();
  const size = (url: string) => {
    if (!cache.has(url)) cache.set(url, readImageSize(url));
    return cache.get(url)!;
  };
  const pending = enriched
    .flatMap(({ works }) => works)
    .filter((work) => !work.photo);
  for (let index = 0; index < pending.length; index += 4) {
    await Promise.all(
      pending.slice(index, index + 4).map(async (work) => {
        const original = await size(work.image);
        work.photo = { picUrl: work.image, ...original };
        if (work.thumbnail && work.thumbnail !== work.image) {
          const thumbnail = await size(work.thumbnail);
          if (
            thumbnail.width < original.width &&
            Math.abs(
              thumbnail.width /
                thumbnail.height /
                (original.width / original.height) -
                1,
            ) < 0.02
          )
            work.photo.variants = [
              { url: work.thumbnail, width: thumbnail.width },
            ];
        }
      }),
    );
  }
  return enriched;
}
