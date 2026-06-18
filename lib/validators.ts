import { z } from 'zod';

export const articleInput = z.object({
  domain: z.string().min(3).max(253).regex(/^[a-z0-9.-]+$/i, 'invalid domain'),
  title: z.string().min(2).max(200),
  header: z.string().min(2).max(500),
  topic: z.string().max(300).optional().nullable(),
  keywords: z.string().max(300).optional().nullable(),
  meta_description: z.string().max(300).optional().nullable(),
  og_image: z.string().url().max(500).optional().nullable().or(z.literal('')),
  body_html: z.string().max(200_000).optional().nullable(),
  body_markdown: z.string().max(200_000).optional().nullable(),
  lang: z.string().min(2).max(8).default('id'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const articleUpdate = articleInput.partial();

export const aiGenerate = z.object({
  domain: z.string().min(3),
  title: z.string().min(2),
  header: z.string().min(2),
  topic: z.string().max(300).optional(),
  keywords: z.string().max(300).optional(),
  lang: z.string().min(2).max(8).optional(),
});

export type ArticleInputT = z.infer<typeof articleInput>;
export type ArticleUpdateT = z.infer<typeof articleUpdate>;
export type AIGenerateT = z.infer<typeof aiGenerate>;
