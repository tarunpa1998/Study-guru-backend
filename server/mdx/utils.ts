import matter from 'gray-matter';

/**
 * Read an MDX file and extract frontmatter and content
 * @param content MDX content string
 * @returns Object containing frontmatter and MDX content
 */
export async function readMDXFile(content: string): Promise<{ frontmatter: Record<string, any>; content: string }> {
  try {
    const { data, content: mdxContent } = matter(content);
    
    // Validate required frontmatter fields
    if (!data.title) {
      throw new Error('MDX file is missing title in frontmatter');
    }
    
    if (!data.slug) {
      throw new Error('MDX file is missing slug in frontmatter');
    }
    
    if (!data.excerpt) {
      throw new Error('MDX file is missing excerpt in frontmatter');
    }
    
    return {
      frontmatter: data,
      content: mdxContent
    };
  } catch (error) {
    console.error(`Error parsing MDX file:`, error);
    throw error;
  }
}

/**
 * Extract plain text content from MDX for search indexing
 * @param mdxContent The MDX content string
 * @returns Plain text content
 */
export function extractTextContent(mdxContent: string): string {
  try {
    // Remove MDX/JSX components and tags
    let plainText = mdxContent
      // Remove import statements
      .replace(/^import.*$/gm, '')
      // Remove JSX/MDX component tags
      .replace(/<[^>]*>.*?<\/[^>]*>|<[^/>]*\/>/g, '')
      // Remove markdown headings
      .replace(/^#+\s+/gm, '')
      // Remove markdown lists
      .replace(/^[-*+]\s+/gm, '')
      // Remove markdown links but keep the text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^---+$/gm, '')
      // Remove emphasis and strong emphasis
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove excess whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return plainText;
  } catch (error) {
    console.error(`Error extracting plain text from MDX:`, error);
    return mdxContent; // Return original if extraction fails
  }
}

/**
 * Create a slug from a string
 * @param str String to slugify
 * @returns Slugified string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate an MDX template for a new content item
 * @param type Content type
 * @param title Content title
 * @param category Content category
 * @returns MDX template string
 */
export function generateMDXTemplate(type: string, title: string, category: string = 'general'): string {
  const slug = slugify(title);
  const now = new Date().toISOString();
  
  let template = `---
title: "${title}"
slug: "${slug}"
excerpt: "Write a brief summary of the content here..."
category: "${category}"
publishedAt: "${now}"
coverImage: "/images/${type}s/${slug}.jpg"
author: "Content Team"
featured: false
tags: ["tag1", "tag2"]
seoMeta:
  title: "${title} | Study Abroad Portal"
  description: "Write an SEO-friendly description here..."
  keywords: ["study abroad", "education", "${type}"]
---

# ${title}

Write your content here using Markdown and MDX syntax.

## Section 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec
ultricies lacinia, nisl nisl aliquam nisl, eu aliquam nisl nisl eu nisl.

## Section 2

- Point 1
- Point 2
- Point 3

For more information, contact us at [contact@studyabroadportal.com](mailto:contact@studyabroadportal.com).
`;

  // Add type-specific frontmatter or content
  if (type === 'scholarship') {
    template = template.replace('tags: ["tag1", "tag2"]', 'tags: ["scholarship", "funding", "education"]\ndeadline: "2024-12-31"\nfundingAmount: "$10,000"\neligibility: "International students"\n');
  } else if (type === 'university') {
    template = template.replace('tags: ["tag1", "tag2"]', 'tags: ["university", "education", "higher education"]\nlocation: "City, Country"\nranking: "Top 100"\ntuition: "$20,000 per year"\n');
  } else if (type === 'country') {
    template = template.replace('tags: ["tag1", "tag2"]', 'tags: ["study destination", "international education"]\ncontinent: "Europe"\npopulation: "67 million"\nlanguages: ["English"]\ntimeZone: "GMT+0"\n');
  }
  
  return template;
}
