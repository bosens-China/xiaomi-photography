import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { issueSchema } from './lib/issue-schema';

export const collections = {
  issues: defineCollection({
    loader: glob({ pattern: '*.json', base: './src/data/issues' }),
    schema: issueSchema,
  }),
};
