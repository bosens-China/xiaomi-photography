import ts from 'typescript';
import { z } from 'astro/zod';
import { createHash } from 'node:crypto';
import type { Edition } from '../src/lib/issue-timeline.ts';

export const sourceUrls = {
  domestic: 'https://www.mi.com/visual/award/winWorks',
  international: 'https://event.mi.com/global/xiaomiImageryawards/award-works',
};

const rowsSchema = z
  .array(
    z.object({
      id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
      status: z.number(),
      content: z.object({
        type: z.enum(['1', '2']),
        imagesList: z
          .array(
            z.object({
              title: z.string(),
              name: z.string(),
              originPhoto: z.url({ protocol: /^https$/ }),
              photo: z.url({ protocol: /^https$/ }).optional(),
              desc: z.string().optional(),
            }),
          )
          .optional(),
      }),
    }),
  )
  .min(1);

export interface OfficialWork {
  sourceIds: string[];
  name: string;
  userName: string;
  image: string;
  thumbnail?: string;
  photo?: {
    picUrl: string;
    width: number;
    height: number;
    variants?: { url: string; width: number }[];
  };
  desc?: string;
}
export interface EditionSource {
  edition: Edition;
  year: string;
  works: OfficialWork[];
}

export const normalize = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[\s《》]/gu, '')
    .toLowerCase();
export const workKey = (work: { name: string; userName: string }) =>
  `${normalize(work.name)}\0${normalize(work.userName)}`;

export function parseRows(
  input: unknown,
  edition: Edition,
  year: string,
): EditionSource {
  const rows = rowsSchema.parse(input);
  const works = new Map<string, OfficialWork>();
  for (const row of rows) {
    if (row.status !== 1 || row.content.type !== '2') continue;
    if (!row.content.imagesList?.length)
      throw new Error(`${edition}: 获奖行缺少作品`);
    for (const image of row.content.imagesList) {
      const name = image.title.trim().replace(/^《(.*)》$/s, '$1');
      // 评委选择奖只列作者，沿用既有范围，不把占位标题当作作品名。
      if (/^(获奖作者|Winner)$/i.test(name)) continue;
      const match = image.name
        .trim()
        .match(/^(.*?)\s*[（(]([^()（）]+)[）)]$/u);
      const userName = (match?.[1] ?? image.name)
        .replace(/^获奖作者\s*[:：]\s*/u, '')
        .trim();
      if (!name || !userName) throw new Error(`${edition}: 标题或作者缺失`);
      const imagePath = new URL(image.originPhoto).pathname.split('@')[0];
      const imageId = createHash('sha256')
        .update(imagePath)
        .digest('hex')
        .slice(0, 24);
      const work: OfficialWork = {
        sourceIds: [`xiaomi-${year}-${edition}-${row.id}-${imageId}`],
        name,
        userName,
        image: image.originPhoto,
        ...(image.photo ? { thumbnail: image.photo } : {}),
        ...(image.desc?.trim() ? { desc: image.desc.trim() } : {}),
      };
      const key = workKey(work);
      const previous = works.get(key);
      if (previous) previous.sourceIds.push(...work.sourceIds);
      else works.set(key, work);
    }
  }
  if (!works.size) throw new Error(`${edition}: 未解析到作品，停止更新`);
  return { edition, year, works: [...works.values()] };
}

// 只读取字面量；不执行从官网获取的 JavaScript。
function literal(node: ts.Node): unknown {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node)) {
    const value = literal(node.operand);
    if (node.operator === ts.SyntaxKind.ExclamationToken) return !value;
    if (node.operator === ts.SyntaxKind.MinusToken && typeof value === 'number')
      return -value;
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        if (
          !ts.isPropertyAssignment(property) ||
          !property.name ||
          !(
            ts.isIdentifier(property.name) ||
            ts.isStringLiteral(property.name) ||
            ts.isNumericLiteral(property.name)
          )
        )
          throw new Error('官方数据包含非字面量属性');
        return [property.name.text, literal(property.initializer)];
      }),
    );
  }
  throw new Error(`官方数据包含非字面量: ${ts.SyntaxKind[node.kind]}`);
}

export function parseAwardScript(script: string): unknown {
  const source = ts.createSourceFile(
    'official.js',
    script,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const candidates: unknown[] = [];
  function named(
    property: ts.ObjectLiteralElementLike,
    name: string,
  ): property is ts.PropertyAssignment {
    return (
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
    );
  }
  function visit(node: ts.Node) {
    const isAwards =
      ts.isArrayLiteralExpression(node) &&
      node.elements.some((element) => {
        if (!ts.isObjectLiteralExpression(element)) return false;
        const content = element.properties.find((property) =>
          named(property, 'content'),
        );
        return (
          content &&
          ts.isPropertyAssignment(content) &&
          ts.isObjectLiteralExpression(content.initializer) &&
          content.initializer.properties.some((property) =>
            named(property, 'imagesList'),
          )
        );
      });
    if (isAwards) {
      candidates.push(literal(node));
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (candidates.length !== 1)
    throw new Error(`国际获奖数据应为唯一数组，实际 ${candidates.length} 个`);
  return candidates[0];
}

export function scriptUrls(html: string, pageUrl: string): string[] {
  const urls = new Map<string, string>();
  for (const match of html.matchAll(
    /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
  )) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), pageUrl);
    if (url.protocol !== 'https:') continue;
    urls.set(url.origin + url.pathname, url.href);
  }
  return [...urls.values()];
}

async function request(url: string, init: RequestInit = {}): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'User-Agent': 'xiaomi-photography/1.0', ...init.headers },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error('请求失败');
}

export async function fetchSources(): Promise<EditionSource[]> {
  const internationalHtml = await request(sourceUrls.international);
  const year = internationalHtml.match(
    /<title>[^<]*Awards(20\d{2})[^<]*<\/title>/i,
  )?.[1];
  if (!year) throw new Error('无法确定国际赛事年份');
  const url = scriptUrls(internationalHtml, sourceUrls.international).find(
    (value) => {
      const parsed = new URL(value);
      return (
        parsed.hostname === 'event.mi.com' &&
        parsed.pathname === '/scripts/xiaomiImageryawards/main.js'
      );
    },
  );
  if (!url) throw new Error('国际获奖页面的脚本地址已变化');
  const international = parseRows(
    parseAwardScript(await request(url)),
    'international',
    year,
  );

  const domesticHtml = await request(sourceUrls.domestic);
  let key: string | undefined;
  for (const asset of scriptUrls(domesticHtml, sourceUrls.domestic)) {
    const parsed = new URL(asset);
    if (
      parsed.hostname !== 'cdn.cnbj1.fds.api.mi-img.com' ||
      !parsed.pathname.startsWith('/mi.com-assets/home/pro-assets/')
    )
      continue;
    const script = await request(asset);
    if (!script.includes('WIN_WORKS_OPTIONS')) continue;
    const keys = [...new Set(script.match(/winWorks20\d{2}\d*/g) ?? [])].sort(
      (a, b) => b.localeCompare(a),
    );
    if (keys.length) {
      key = keys[0];
      break;
    }
  }
  if (!key) throw new Error('国内官网未找到获奖数据键');
  const response: unknown = JSON.parse(
    await request('https://api2.service.order.mi.com/mtop/act/mhome/static', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://www.mi.com',
        Referer: sourceUrls.domestic,
      },
      body: JSON.stringify([{}, { keys: [key], pageNo: 1, pageSize: 100 }]),
    }),
  );
  const payload = z
    .object({ code: z.literal(0), data: z.record(z.string(), z.unknown()) })
    .parse(response);
  const domestic = parseRows(payload.data[key], 'domestic', key.slice(8, 12));
  // 该公开接口当前返回完整配置数组；达到页容量时停止，避免把截断数据当作全量。
  if ((payload.data[key] as unknown[]).length >= 100)
    throw new Error('国内数据达到页容量，需检查分页');
  return [domestic, international];
}
