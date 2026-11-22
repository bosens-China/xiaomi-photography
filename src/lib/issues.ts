import { getCollection, type CollectionEntry } from 'astro:content';
import { groupIssueDates, issueSlug } from './issue-timeline';

export type Issue = CollectionEntry<'issues'>['data'] & { slug: string };

export async function getIssueTimeline() {
  const entries = await getCollection('issues');
  if (!entries.length)
    throw new Error('请在 src/data/issues/ 中添加至少一份周刊 JSON。');

  const issues: Issue[] = entries.map(({ id, data }) => {
    const slug = issueSlug(data.date, data.edition);
    if (id !== slug)
      throw new Error(
        `周刊文件 ${id}.json 与日期/版本不匹配，应为 ${slug}.json。`,
      );
    return { ...data, slug };
  });

  return groupIssueDates(issues).map((group, index, all) => ({
    ...group,
    number: all.length - index,
  }));
}
