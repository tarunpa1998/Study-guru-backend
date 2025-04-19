import { z } from "zod";

// GitHub content configuration schema
export const githubContentSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string().default("main"),
  contentPath: z.string().default("content"),
  accessToken: z.string().optional()
});

// Content type schema
export const contentTypeSchema = z.enum([
  "article",
  "news",
  "scholarship",
  "country",
  "university"
]);

// Frontmatter schema for MDX files
export const frontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  category: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  coverImage: z.string().optional(),
  author: z.string().optional(),
  featured: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional(),
  
  // SEO metadata
  seoMeta: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string())
  }),
  
  // Optional fields for specific content types
  deadline: z.string().optional(),
  fundingAmount: z.string().optional(),
  eligibility: z.string().optional(),
  location: z.string().optional(),
  ranking: z.string().optional(),
  tuition: z.string().optional(),
  continent: z.string().optional(),
  population: z.string().optional(),
  languages: z.array(z.string()).optional(),
  timeZone: z.string().optional(),
  studentPopulation: z.string().optional(),
  internationalStudents: z.string().optional(),
  acceptanceRate: z.string().optional(),
  readingTime: z.number().optional()
});

// Export types
export type ContentType = z.infer<typeof contentTypeSchema>;
export type Frontmatter = z.infer<typeof frontmatterSchema>;
export type SEOMetadata = z.infer<typeof frontmatterSchema>["seoMeta"];
export type GithubContentConfig = z.infer<typeof githubContentSchema>;
