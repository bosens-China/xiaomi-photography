const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const homeUrl = `${base}/`;
export const issueUrl = (slug: string) => `${base}/issues/${slug}/`;
export const photoUrl = (slug: string, id: string) =>
  `${issueUrl(slug)}photos/${id}/`;
