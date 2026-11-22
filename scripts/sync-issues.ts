import {
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { hydratePhotos } from './photo-metadata.ts';
import { fileURLToPath } from 'node:url';
import { issueSchema, type IssueData } from '../src/lib/issue-schema.ts';
import { editions, issueSlug } from '../src/lib/issue-timeline.ts';
import {
  fetchSources,
  sourceUrls,
  workKey,
  type EditionSource,
  type OfficialWork,
} from './xiaomi-source.ts';

type Archive = Map<string, IssueData>;
type RecordEntry =
  | IssueData['photos'][number]
  | NonNullable<IssueData['entries']>[number];

export function shanghaiDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join('-');
}

function makePhoto(work: OfficialWork): IssueData['photos'][number] {
  if (!work.photo) throw new Error(`作品缺少已验证的图片尺寸: ${work.name}`);
  return {
    id: `xiaomi-${createHash('sha256').update(work.sourceIds[0]).digest('hex').slice(0, 16)}`,
    name: work.name,
    userName: work.userName,
    sourceIds: [...new Set(work.sourceIds)].sort(),
    ...work.photo,
    ...(work.desc ? { desc: work.desc } : {}),
  };
}

export function planUpdates(
  archive: Archive,
  sources: EditionSource[],
  date: string,
): Archive {
  if (
    sources.length !== 2 ||
    new Set(sources.map(({ edition }) => edition)).size !== 2 ||
    sources.some(({ works }) => !works.length)
  )
    throw new Error('必须完整获取国内、国际两版，停止更新');
  const updated: Archive = structuredClone(archive);
  const additions = new Map<string, IssueData['photos']>();
  for (const source of sources) {
    const records: { issue: IssueData; record: RecordEntry }[] = [];
    for (const issue of updated.values()) {
      if (
        issue.edition === source.edition &&
        (issue.title.match(/20\d{2}/)?.[0] ?? issue.date.slice(0, 4)) ===
          source.year
      )
        for (const record of [...issue.photos, ...(issue.entries ?? [])])
          records.push({ issue, record });
    }
    const newPhotos: IssueData['photos'] = [];
    for (const work of source.works) {
      const bySource = records.filter(({ record }) =>
        record.sourceIds?.some((id) => work.sourceIds.includes(id)),
      );
      const matches = bySource.length
        ? bySource
        : records.filter(({ record }) => workKey(record) === workKey(work));
      if (matches.length > 1)
        throw new Error(`归档中存在重复作品: ${work.name}`);
      const match = matches[0];
      if (match) {
        const { record, issue } = match;
        record.name = work.name;
        record.userName = work.userName;
        record.sourceIds = [
          ...new Set([...(record.sourceIds ?? []), ...work.sourceIds]),
        ].sort();
        if ('picUrl' in record) {
          // 保留既有照片地址与 id，CDN 重导出不改变已有详情链接。
          if (work.desc) record.desc = work.desc;
        } else {
          const photo = { ...makePhoto(work), sourceIds: record.sourceIds };
          issue.photos.push(photo);
          issue.entries = issue.entries!.filter((entry) => entry !== record);
          match.record = photo;
          if (!issue.entries.length) {
            delete issue.entries;
            issue.status = 'published';
          }
        }
      } else {
        const photo = makePhoto(work);
        newPhotos.push(photo);
      }
    }
    additions.set(source.edition, newPhotos);
  }
  if ([...additions.values()].some((photos) => photos.length)) {
    for (const edition of editions) {
      const source = sources.find((item) => item.edition === edition)!;
      const filename = `${issueSlug(date, edition)}.json`;
      const photos = additions.get(edition)!;
      const existing = updated.get(filename);
      if (!photos.length) {
        if (!existing)
          updated.set(filename, {
            date,
            edition,
            status: 'empty',
            title: `${date} · ${edition === 'domestic' ? '国内' : '国际'}暂无新增作品`,
            photos: [],
          });
        continue;
      }
      if (
        existing &&
        existing.status !== 'empty' &&
        !existing.title.includes(source.year)
      )
        throw new Error(`${filename} 已有不同赛事的期次，不能覆盖`);
      if (existing?.status === 'external')
        throw new Error(`${filename} 尚有无法补图的历史记录，停止更新`);
      updated.set(filename, {
        ...(existing ?? {}),
        date,
        edition,
        status: 'published',
        title:
          existing?.status === 'published'
            ? existing.title
            : `${source.year} 小米影像大赛 · ${edition === 'domestic' ? '国内' : '国际'}`,
        sourceUrl: sourceUrls[edition],
        photos: [...(existing?.photos ?? []), ...photos],
      });
    }
  }
  const changes: Archive = new Map();
  for (const [filename, issue] of updated) {
    if (issue.status === 'external' && issue.photos.length)
      throw new Error(`${filename} 尚有无法补图的历史记录，停止更新`);
    issueSchema.parse(issue);
    if (filename !== `${issueSlug(issue.date, issue.edition)}.json`)
      throw new Error(`文件名与日期、版本不匹配: ${filename}`);
    if (JSON.stringify(issue) !== JSON.stringify(archive.get(filename)))
      changes.set(filename, issue);
  }
  return changes;
}

export async function readArchive(directory: string): Promise<Archive> {
  const archive: Archive = new Map();
  for (const filename of (await readdir(directory))
    .filter((name) => name.endsWith('.json'))
    .sort()) {
    const issue = issueSchema.parse(
      JSON.parse(await readFile(join(directory, filename), 'utf8')),
    );
    if (filename !== `${issueSlug(issue.date, issue.edition)}.json`)
      throw new Error(`文件名与日期、版本不匹配: ${filename}`);
    archive.set(filename, issue);
  }
  return archive;
}

export async function writeUpdates(
  directory: string,
  changes: Archive,
): Promise<void> {
  if (!changes.size) return;
  const temporary = await mkdtemp(join(directory, '.sync-'));
  const backups = new Map<string, string | undefined>();
  const written: string[] = [];
  try {
    for (const [filename, issue] of changes) {
      if (filename !== `${issueSlug(issue.date, issue.edition)}.json`)
        throw new Error('拒绝写入非周刊路径');
      issueSchema.parse(issue);
      try {
        backups.set(
          filename,
          await readFile(join(directory, filename), 'utf8'),
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        backups.set(filename, undefined);
      }
      await writeFile(
        join(temporary, filename),
        JSON.stringify(issue, null, 2) + '\n',
      );
    }
    for (const filename of changes.keys()) {
      await rename(join(temporary, filename), join(directory, filename));
      written.push(filename);
    }
  } catch (error) {
    for (const filename of written) {
      const backup = backups.get(filename);
      if (backup === undefined) await rm(join(directory, filename));
      else await writeFile(join(directory, filename), backup);
    }
    throw error;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function syncIssues(
  directory: string,
  loadSources: () => Promise<EditionSource[]> = fetchSources,
  dryRun = false,
) {
  const archive = await readArchive(directory);
  const sources = await hydratePhotos(await loadSources(), archive.values());
  const date = shanghaiDate();
  const changes = planUpdates(archive, sources, date);
  if (!dryRun) await writeUpdates(directory, changes);
  return {
    date,
    dryRun,
    sources: sources.map(({ edition, year, works }) => ({
      edition,
      year,
      works: works.length,
    })),
    changed: [...changes.keys()],
  };
}

async function main() {
  if (process.argv.slice(2).some((argument) => argument !== '--dry-run'))
    throw new Error('只支持 --dry-run 参数');
  const result = await syncIssues(
    fileURLToPath(new URL('../src/data/issues/', import.meta.url)),
    fetchSources,
    process.argv.includes('--dry-run'),
  );
  console.log(JSON.stringify(result, null, 2));
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
