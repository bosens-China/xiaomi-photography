import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const https = z.url({ protocol: /^https$/ });
const pixels = z.number().int().positive();

const photo = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().trim().min(1),
  userName: z.string().trim().min(1),
  picUrl: https,
  width: pixels,
  height: pixels,
  desc: z.string().optional(),
  variants: z.array(z.object({ url: https, width: pixels })).optional(),
});

export const collections = {
  issues: defineCollection({
    loader: glob({ pattern: '*.json', base: './src/data/issues' }),
    schema: z
      .object({
        date: z.iso.date(),
        title: z.string().trim().min(1),
        edition: z.enum(['domestic', 'international']).default('domestic'),
        status: z.enum(['published', 'external', 'empty']).default('published'),
        sourceUrl: https.optional(),
        entries: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              userName: z.string().trim().min(1),
            }),
          )
          .optional(),
        photos: z
          .array(photo)
          .refine(
            (photos) =>
              new Set(photos.map(({ id }) => id)).size === photos.length,
            '同一期的作品 id 必须唯一',
          ),
      })
      .superRefine(({ photos, status, sourceUrl, entries }, ctx) => {
        if (status === 'published' ? photos.length === 0 : photos.length !== 0)
          ctx.addIssue({
            code: 'custom',
            path: ['photos'],
            message: '有图版至少一件作品，外链和空期不得嵌入作品图片。',
          });
        if (status === 'external') {
          if (!sourceUrl)
            ctx.addIssue({
              code: 'custom',
              path: ['sourceUrl'],
              message: '外链版须填写官方来源链接。',
            });
          if (!entries?.length)
            ctx.addIssue({
              code: 'custom',
              path: ['entries'],
              message: '外链版须提供作品和摄影师名单。',
            });
        } else if (entries !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['entries'],
            message: '仅外链版支持文本名单。',
          });
        }
      }),
  }),
};
