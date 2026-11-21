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
    schema: z.object({
      date: z.iso.date(),
      title: z.string().trim().min(1),
      sourceUrl: https.optional(),
      photos: z
        .array(photo)
        .min(1)
        .refine(
          (photos) =>
            new Set(photos.map(({ id }) => id)).size === photos.length,
          '同一期的作品 id 必须唯一',
        ),
    }),
  }),
};
