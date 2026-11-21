import { getCollection, type CollectionEntry } from 'astro:content';

export type Issue = CollectionEntry<'issues'>['data'];

export async function getIssues() {
  const entries = await getCollection('issues');
  if (!entries.length)
    throw new Error('请在 src/data/issues/ 中添加至少一份周刊 JSON。');

  return entries
    .map(({ id, data }) => {
      if (id !== data.date)
        throw new Error(
          `周刊文件 ${id}.json 必须与 date 字段 ${data.date} 一致。`,
        );
      return data;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
