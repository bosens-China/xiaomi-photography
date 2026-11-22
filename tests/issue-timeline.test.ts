import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupIssueDates, issueSlug } from '../src/lib/issue-timeline.ts';

test('same-day editions have distinct URLs without changing legacy domestic slugs', () => {
  assert.equal(issueSlug('2026-11-21', 'domestic'), '2026-11-21');
  assert.equal(
    issueSlug('2026-11-21', 'international'),
    '2026-11-21-international',
  );
});

test('timeline is newest first and retains empty or missing edition slots', () => {
  const domestic = {
    date: '2026-11-21',
    edition: 'domestic',
    status: 'published',
  } as const;
  const international = {
    date: '2026-11-21',
    edition: 'international',
    status: 'external',
  } as const;
  const next = {
    date: '2026-11-28',
    edition: 'international',
    status: 'empty',
  } as const;
  assert.deepEqual(groupIssueDates([domestic, next, international]), [
    { date: '2026-11-28', editions: { international: next } },
    { date: '2026-11-21', editions: { domestic, international } },
  ]);
});
