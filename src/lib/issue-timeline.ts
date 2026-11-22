export const editions = ['domestic', 'international'] as const;
export type Edition = (typeof editions)[number];

export const editionLabels: Record<Edition, string> = {
  domestic: '国内',
  international: '国际',
};

export function issueSlug(date: string, edition: Edition): string {
  return edition === 'domestic' ? date : `${date}-international`;
}

export function groupIssueDates<T extends { date: string; edition: Edition }>(
  issues: readonly T[],
) {
  const groups = new Map<string, Partial<Record<Edition, T>>>();
  for (const issue of issues) {
    const group = groups.get(issue.date) ?? {};
    group[issue.edition] = issue;
    groups.set(issue.date, group);
  }
  return [...groups]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, editions]) => ({ date, editions }));
}
