import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { issueSchema, type IssueData } from '../src/lib/issue-schema.ts';
import {
  planUpdates,
  readArchive,
  shanghaiWeekStart,
  syncIssues,
  writeUpdates,
} from '../scripts/sync-issues.ts';
import {
  internationalYear,
  parseAwardScript,
  parseRows,
  scriptUrls,
  type EditionSource,
  type OfficialWork,
} from '../scripts/xiaomi-source.ts';

const work = (name = '黑衣少年'): OfficialWork => ({
  name,
  userName: '相飞田',
  image: 'https://example.com/original.jpg',
  photo: {
    picUrl: 'https://example.com/original.jpg',
    width: 1920,
    height: 1440,
  },
  sourceIds: ['xiaomi-2026-domestic-award-0'],
  desc: '官方说明',
});
const foreign: OfficialWork = {
  name: 'Cat and Hat',
  userName: 'Taras Bychko',
  image: 'https://example.com/cat.jpg',
  photo: { picUrl: 'https://example.com/cat.jpg', width: 1200, height: 1800 },
  sourceIds: ['xiaomi-2026-international-portrait-0'],
};
const sources = (
  domestic = [work()],
  international = [foreign],
): EditionSource[] => [
  { edition: 'domestic', year: '2026', works: domestic },
  { edition: 'international', year: '2026', works: international },
];
function archive() {
  return new Map<string, IssueData>([
    [
      '2026-11-21.json',
      issueSchema.parse({
        date: '2026-11-21',
        title: '2026 国内',
        photos: [
          {
            id: 'old-link',
            name: '黑衣少年',
            userName: '相飞田',
            picUrl: 'https://example.com/archived.jpg',
            width: 1920,
            height: 1440,
          },
        ],
      }),
    ],
    [
      '2026-11-21-international.json',
      issueSchema.parse({
        date: '2026-11-21',
        title: '2026 国际',
        edition: 'international',
        status: 'external',
        sourceUrl:
          'https://event.mi.com/global/xiaomiImageryawards/award-works',
        photos: [],
        entries: [{ name: 'Cat and Hat', userName: 'Taras Bychko' }],
      }),
    ],
  ]);
}
function row(id: string, title: string, name: string) {
  return {
    id,
    status: 1,
    content: {
      type: '2',
      imagesList: [
        { title, name, originPhoto: 'https://example.com/photo.jpg' },
      ],
    },
  };
}

test('each source retains all countries, deduplicates awards and skips unnamed author awards', () => {
  const rows = [
    row('annual', '《黑衣少年》', '相飞田（中国）'),
    row('series', '《黑衣少年》', '相飞田（中国）'),
    row('portrait', '《猫和帽子》', 'Taras Bychko（乌克兰）'),
    row('jury', '获奖作者', '王建章（中国）'),
  ];
  const parsed = parseRows(rows, 'domestic', '2026');
  assert.equal(parsed.works.length, 2);
  assert.equal(parsed.works[0].name, '黑衣少年');
  assert.equal(parsed.works[0].sourceIds.length, 2);
  assert.equal(
    parseRows(
      [
        row('annual', 'The Boy in Black', 'Xiang Feitian（CN）'),
        row('portrait', 'Cat and Hat', 'Taras Bychko（UA）'),
      ],
      'international',
      '2026',
    ).works[0].name,
    'The Boy in Black',
  );
  assert.equal(
    parseRows([row('legacy', '《交流》', '获奖作者：阿竹')], 'domestic', '2025')
      .works[0].userName,
    '阿竹',
  );
  assert.throws(() =>
    parseRows([row('missing', 'Title', '')], 'domestic', '2026'),
  );
  assert.throws(() => parseRows([], 'domestic', '2026'));
});

test('script parser reads literals without executing code and refuses executable data or ambiguous arrays', () => {
  const data = JSON.stringify([
    row('portrait', 'Cat and Hat', 'Taras Bychko（UA）'),
  ]);
  const script = `globalThis.neverRun(); const data = ${data};`;
  assert.equal(
    parseRows(parseAwardScript(script), 'international', '2026').works.length,
    1,
  );
  assert.throws(
    () =>
      parseAwardScript(
        `const data=${data.replace('"https://example.com/photo.jpg"', 'dangerous()')};`,
      ),
    /非字面量/,
  );
  assert.throws(
    () => parseAwardScript(`const a=${data}, b=${data};`),
    /唯一数组/,
  );
  assert.throws(() => parseAwardScript('const changed = [];'), /唯一数组/);
});

test('script URL discovery resolves protocol-relative URLs and keeps the last cache version', () => {
  assert.deepEqual(
    scriptUrls(
      '<script src="//event.mi.com/main.js?v=1"></script><script src="/main.js?v=2&amp;x=3"></script>',
      'https://event.mi.com/page',
    ),
    ['https://event.mi.com/main.js?v=2&x=3'],
  );
});

test('a placeholder international title uses the Global award year from the bundle', () => {
  const placeholder = '<title>meta title</title>';
  const bundle =
    'en:{meta_title:"Xiaomi Imagery Awards 2025"},global:{meta_title:"XiaomiImageryGlobalAwards2026"}';
  assert.equal(internationalYear(placeholder, bundle), '2026');
  assert.equal(
    internationalYear('<title>Xiaomi Imagery Awards2027</title>', ''),
    '2027',
  );
  assert.throws(
    () =>
      internationalYear(placeholder, 'meta_title:"Xiaomi Imagery Awards 2025"'),
    /无法确定国际赛事年份/,
  );
  assert.throws(
    () =>
      internationalYear(
        placeholder,
        `${bundle};meta_title:"XiaomiImageryGlobalAwards2027"`,
      ),
    /无法确定国际赛事年份/,
  );
});

test('first sync adopts old records without duplicating them and a second run is unchanged', () => {
  const initial = archive();
  const changes = planUpdates(initial, sources(), '2026-11-22');
  assert.equal(changes.size, 2);
  assert.equal(initial.get('2026-11-21.json')!.photos[0].sourceIds, undefined);
  const photo = changes.get('2026-11-21.json')!.photos[0];
  assert.equal(photo.id, 'old-link');
  assert.equal(photo.picUrl, 'https://example.com/archived.jpg');
  assert.equal(photo.desc, '官方说明');
  assert.equal(changes.has('2026-11-22.json'), false);
  assert.equal(
    planUpdates(new Map([...initial, ...changes]), sources(), '2026-11-23')
      .size,
    0,
  );
});

test('stable official identity corrects title and author in the original issue', () => {
  const initial = new Map([
    ...archive(),
    ...planUpdates(archive(), sources(), '2026-11-22'),
  ]);
  const corrected = { ...work(), name: '更正名称', userName: '更正署名' };
  const changes = planUpdates(initial, sources([corrected]), '2026-11-23');
  assert.equal(changes.size, 1);
  const issue = changes.get('2026-11-21.json')!;
  assert.equal(issue.date, '2026-11-21');
  assert.equal(issue.photos[0].id, 'old-link');
  assert.equal(issue.photos[0].name, '更正名称');
  assert.equal(issue.photos[0].userName, '更正署名');
});

test('a quiet Monday can be backfilled and expanded later in the same Beijing week', () => {
  const initial = new Map([
    ...archive(),
    ...planUpdates(archive(), sources(), '2026-11-22'),
  ]);
  const monday = shanghaiWeekStart(new Date('2026-11-22T23:00:00Z'));
  assert.equal(planUpdates(initial, sources(), monday).size, 0);

  const added = {
    ...work('新作品'),
    sourceIds: ['xiaomi-2026-domestic-new-0'],
  };
  const thursday = shanghaiWeekStart(new Date('2026-11-26T08:00:00Z'));
  const changes = planUpdates(initial, sources([work(), added]), thursday);
  assert.deepEqual(
    [...changes.keys()],
    ['2026-11-23.json', '2026-11-23-international.json'],
  );
  const domestic = changes.get('2026-11-23.json')!;
  assert.equal(domestic.status, 'published');
  assert.equal(domestic.photos.length, 1);
  assert.deepEqual(
    domestic.photos.map(({ name }) => name),
    ['新作品'],
  );
  assert.equal(changes.get('2026-11-23-international.json')!.status, 'empty');
  const next = new Map([...initial, ...changes]);
  const friday = shanghaiWeekStart(new Date('2026-11-27T08:00:00Z'));
  assert.equal(planUpdates(next, sources([work(), added]), friday).size, 0);
  const another = {
    ...work('另一个作品'),
    sourceIds: ['xiaomi-2026-domestic-another-0'],
  };
  const updated = planUpdates(next, sources([work(), added, another]), friday);
  assert.deepEqual([...updated.keys()], ['2026-11-23.json']);
  assert.deepEqual(
    updated.get('2026-11-23.json')!.photos.map(({ name }) => name),
    ['新作品', '另一个作品'],
  );
  assert.equal(
    updated.get('2026-11-23.json')!.photos[0].id,
    domestic.photos[0].id,
  );
});

test('missing historical work is retained, while incomplete sources and file collisions fail', () => {
  const initial = archive();
  const missing = {
    ...work('另一作品'),
    sourceIds: ['xiaomi-2026-domestic-new-0'],
  };
  const changes = planUpdates(initial, sources([missing]), '2026-11-23');
  assert.equal(changes.has('2026-11-21.json'), false);
  assert.equal(initial.get('2026-11-21.json')!.photos.length, 1);
  assert.throws(
    () => planUpdates(initial, sources().slice(0, 1), '2026-11-23'),
    /完整获取/,
  );
  assert.throws(
    () => planUpdates(initial, sources([]), '2026-11-23'),
    /完整获取/,
  );
  assert.equal(
    planUpdates(initial, sources([work(), missing]), '2026-11-21').get(
      '2026-11-21.json',
    )!.photos.length,
    2,
  );
  assert.throws(() => planUpdates(initial, sources([missing]), '2026-99-99'));
});

test('archive matching is scoped to the competition year', () => {
  const nextYear = sources().map((source) => ({
    ...source,
    year: '2027',
    works: source.works.map((entry) => ({
      ...entry,
      sourceIds: entry.sourceIds.map((id) => id.replace('2026', '2027')),
    })),
  }));
  const changes = planUpdates(archive(), nextYear, '2027-11-22');
  assert.equal(changes.size, 2);
  assert.equal(changes.get('2027-11-22.json')!.photos.length, 1);
});

test('file writes validate the whole batch before replacement and preserve original bytes on failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xiaomi-sync-'));
  try {
    const initial = archive();
    for (const [filename, issue] of initial)
      await writeFile(join(directory, filename), JSON.stringify(issue));
    const original = await readFile(join(directory, '2026-11-21.json'), 'utf8');
    const changes = planUpdates(initial, sources(), '2026-11-22');
    changes.set('unexpected.json', changes.values().next().value!);
    await assert.rejects(writeUpdates(directory, changes), /非周刊路径/);
    assert.equal(
      await readFile(join(directory, '2026-11-21.json'), 'utf8'),
      original,
    );
    assert.equal((await readdir(directory)).length, 2);
    changes.delete('unexpected.json');
    await writeUpdates(directory, changes);
    assert.equal(
      planUpdates(await readArchive(directory), sources(), '2026-11-23').size,
      0,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('weekly publication rolls over at Beijing Monday midnight and can span years', () => {
  assert.equal(
    shanghaiWeekStart(new Date('2026-11-22T16:00:00Z')),
    '2026-11-23',
  );
  assert.equal(
    shanghaiWeekStart(new Date('2026-11-22T15:59:59Z')),
    '2026-11-16',
  );
  assert.equal(
    shanghaiWeekStart(new Date('2027-01-01T01:00:00Z')),
    '2026-12-28',
  );
});

test('official work identity survives row reordering and CDN query changes', () => {
  const first = row('same-row', '《第一张》', '甲（中国）');
  const second = row('other-row', '《第二张》', '乙（中国）').content
    .imagesList[0];
  second.originPhoto = 'https://example.com/second.jpg?w=200';
  first.content.imagesList.push(second);
  const before = parseRows([first], 'domestic', '2026');
  first.content.imagesList.reverse();
  first.content.imagesList[0].originPhoto =
    'https://example.com/second.jpg?w=800';
  const after = parseRows([first], 'domestic', '2026');
  for (const entry of before.works) {
    assert.deepEqual(
      after.works.find(({ name }) => name === entry.name)!.sourceIds,
      entry.sourceIds,
    );
  }
});

test('source failure and dry-run leave archive files byte-for-byte unchanged', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xiaomi-source-failure-'));
  try {
    for (const [filename, issue] of archive())
      await writeFile(join(directory, filename), JSON.stringify(issue));
    const filename = join(directory, '2026-11-21.json');
    const before = await readFile(filename, 'utf8');
    await assert.rejects(
      syncIssues(directory, async () => {
        throw new Error('official source unavailable');
      }),
      /unavailable/,
    );
    assert.equal(await readFile(filename, 'utf8'), before);
    const result = await syncIssues(directory, async () => sources(), true);
    assert.equal(result.changed.length, 2);
    assert.equal(await readFile(filename, 'utf8'), before);
    assert.equal((await readdir(directory)).length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('overlapping works stay in both source editions and each source keeps its own year', () => {
  const overlap = {
    ...work(),
    sourceIds: ['xiaomi-2026-international-overlap'],
  };
  const sameYear = planUpdates(
    new Map(),
    sources([work()], [overlap]),
    '2026-11-22',
  );
  assert.equal(sameYear.get('2026-11-22.json')!.photos[0].name, '黑衣少年');
  assert.equal(
    sameYear.get('2026-11-22-international.json')!.photos[0].name,
    '黑衣少年',
  );
  assert.equal(
    planUpdates(sameYear, sources([work()], [overlap]), '2026-11-23').size,
    0,
  );
  const differentYears = sources();
  differentYears[0].year = '2025';
  const independent = planUpdates(new Map(), differentYears, '2026-11-22');
  assert.match(independent.get('2026-11-22.json')!.title, /^2025 /);
  assert.match(
    independent.get('2026-11-22-international.json')!.title,
    /^2026 /,
  );
});

test('legacy text editions become galleries in place with stable generated photo links', () => {
  const initial = archive();
  const first = planUpdates(initial, sources(), '2026-11-22');
  const migrated = first.get('2026-11-21-international.json')!;
  assert.equal(migrated.status, 'published');
  assert.equal(migrated.entries, undefined);
  assert.equal(migrated.photos[0].picUrl, foreign.image);
  assert.equal(migrated.photos[0].width, 1200);
  assert.equal(migrated.date, '2026-11-21');
  assert.equal(
    planUpdates(new Map([...initial, ...first]), sources(), '2026-11-23').size,
    0,
  );
  assert.equal(
    migrated.photos[0].id,
    planUpdates(initial, sources(), '2026-11-22').get(
      '2026-11-21-international.json',
    )!.photos[0].id,
  );
});

test('missing photo dimensions or partial text migration fail before writing data', () => {
  const unavailable = { ...foreign, photo: undefined };
  assert.throws(
    () =>
      planUpdates(archive(), sources([work()], [unavailable]), '2026-11-22'),
    /图片尺寸/,
  );
  const initial = archive();
  initial
    .get('2026-11-21-international.json')!
    .entries!.push({
      name: 'Archived missing work',
      userName: 'Retained author',
    });
  assert.throws(
    () => planUpdates(initial, sources(), '2026-11-22'),
    /无法补图/,
  );
  assert.equal(
    initial.get('2026-11-21-international.json')!.entries!.length,
    2,
  );
});
