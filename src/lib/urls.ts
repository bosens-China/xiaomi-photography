const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const homeUrl = `${base}/`;
export const issueUrl = (date: string) => `${base}/issues/${date}/`;
export const photoUrl = (date: string, id: string) =>
  `${issueUrl(date)}photos/${id}/`;
