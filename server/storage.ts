import { readMDXFile, extractTextContent } from "./mdx/utils";
import matter from "gray-matter";
import { githubContentService } from "./services/githubContent";

/**
 * Content item interface representing an MDX file with frontmatter
 */
export interface ContentItem {
  slug: string;
  path: string;
  contentType: "article" | "news" | "scholarship" | "country" | "university";
  category: string;
  frontmatter: any;
  content: string;
}

/**
 * SearchResult interface for search functionality
 */
export interface SearchResult {
  slug: string;
  path: string;
  contentType: "article" | "news" | "scholarship" | "country" | "university";
  category: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
}

/**
 * GitHub-based storage implementation
 * This class handles all content operations using the GitHub API
 */
class GitHubStorage {
  /**
   * Get all content items of a specific type
   */
  async getAllContentByType(type: string): Promise<ContentItem[]> {
    try {
      // Get all content paths for the specified type
      const contentType = type as "article" | "news" | "scholarship" | "country" | "university";
      const paths = await githubContentService.listContent(contentType);
      
      // Fetch and parse each content file
      const contentItems: ContentItem[] = [];
      
      for (const path of paths) {
        try {
          const mdxContent = await githubContentService.getFileContent(path);
          const { data, content } = matter(mdxContent);
          
          // Determine category from file path
          const pathParts = path.split('/');
          const category = pathParts.length > 2 ? pathParts[1] : 'general';
          
          contentItems.push({
            slug: data.slug,
            path,
            contentType,
            category,
            frontmatter: data,
            content
          });
        } catch (error) {
          console.error(`Error processing file ${path}:`, error);
        }
      }
      
      return contentItems;
    } catch (error) {
      console.error(`Error getting content of type ${type}:`, error);
      return [];
    }
  }
  
  /**
   * Get content items by type and category
   */
  async getContentByTypeAndCategory(type: string, category: string): Promise<ContentItem[]> {
    try {
      const allContent = await this.getAllContentByType(type);
      return allContent.filter(item => item.category === category);
    } catch (error) {
      console.error(`Error getting content by category ${type}/${category}:`, error);
      return [];
    }
  }
  
  /**
   * Get a single content item by slug
   */
  async getContentBySlug(type: string, slug: string): Promise<ContentItem | null> {
    try {
      const allContent = await this.getAllContentByType(type);
      const contentItem = allContent.find(item => item.slug === slug);
      return contentItem || null;
    } catch (error) {
      console.error(`Error getting content by slug ${type}/${slug}:`, error);
      return null;
    }
  }
  
  /**
   * Get featured content
   */
  async getFeaturedContent(type: string, limit = 5): Promise<ContentItem[]> {
    try {
      const allContent = await this.getAllContentByType(type);
      
      // Filter featured content and sort by publishedAt
      return allContent
        .filter(item => item.frontmatter.featured)
        .sort((a, b) => {
          const dateA = new Date(a.frontmatter.publishedAt);
          const dateB = new Date(b.frontmatter.publishedAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
    } catch (error) {
      console.error(`Error getting featured content of type ${type}:`, error);
      return [];
    }
  }
  
  /**
   * Get recent content
   */
  async getRecentContent(type: string, limit = 5): Promise<ContentItem[]> {
    try {
      const allContent = await this.getAllContentByType(type);
      
      // Sort by publishedAt and take the most recent
      return allContent
        .sort((a, b) => {
          const dateA = new Date(a.frontmatter.publishedAt);
          const dateB = new Date(b.frontmatter.publishedAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
    } catch (error) {
      console.error(`Error getting recent content of type ${type}:`, error);
      return [];
    }
  }
  
  /**
   * Create new content
   */
  async createContent(contentType: string, slug: string, mdxContent: string): Promise<ContentItem | null> {
    try {
      // Parse frontmatter to validate
      const { data } = matter(mdxContent);
      
      if (!data.slug || data.slug !== slug) {
        throw new Error('Slug in content does not match provided slug');
      }
      
      // Determine path
      let category = 'general';
      if (data.category) {
        category = data.category;
      }
      
      const path = `${contentType}s/${category}/${slug}.mdx`;
      
      // Save to GitHub
      const success = await githubContentService.createFile(
        path, 
        mdxContent, 
        `Add ${contentType}: ${data.title}`
      );
      
      if (!success) {
        throw new Error('Failed to create content in GitHub');
      }
      
      // Parse and return the created item
      const { content } = matter(mdxContent);
      
      return {
        slug,
        path,
        contentType: contentType as any,
        category,
        frontmatter: data,
        content
      };
    } catch (error) {
      console.error(`Error creating content ${contentType}/${slug}:`, error);
      return null;
    }
  }
  
  /**
   * Update existing content
   */
  async updateContent(contentType: string, slug: string, mdxContent: string): Promise<ContentItem | null> {
    try {
      // Get existing content to get the path
      const existingContent = await this.getContentBySlug(contentType, slug);
      
      if (!existingContent) {
        throw new Error(`Content not found: ${contentType}/${slug}`);
      }
      
      // Parse frontmatter to validate
      const { data, content } = matter(mdxContent);
      
      if (!data.slug || data.slug !== slug) {
        throw new Error('Slug in content does not match provided slug');
      }
      
      // Update in GitHub
      const success = await githubContentService.updateFile(
        existingContent.path, 
        mdxContent, 
        `Update ${contentType}: ${data.title}`
      );
      
      if (!success) {
        throw new Error('Failed to update content in GitHub');
      }
      
      return {
        slug,
        path: existingContent.path,
        contentType: contentType as any,
        category: existingContent.category,
        frontmatter: data,
        content
      };
    } catch (error) {
      console.error(`Error updating content ${contentType}/${slug}:`, error);
      return null;
    }
  }
  
  /**
   * Delete content
   */
  async deleteContent(contentType: string, slug: string): Promise<boolean> {
    try {
      // Get existing content to get the path
      const existingContent = await this.getContentBySlug(contentType, slug);
      
      if (!existingContent) {
        throw new Error(`Content not found: ${contentType}/${slug}`);
      }
      
      // Delete from GitHub
      const success = await githubContentService.deleteFile(
        existingContent.path, 
        `Delete ${contentType}: ${existingContent.frontmatter.title}`
      );
      
      return success;
    } catch (error) {
      console.error(`Error deleting content ${contentType}/${slug}:`, error);
      return false;
    }
  }
  
  /**
   * Search content across all types
   */
  async searchContent(query: string): Promise<SearchResult[]> {
    try {
      const contentTypes = ["article", "news", "scholarship", "country", "university"];
      const searchResults: SearchResult[] = [];
      const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
      
      // Early return for empty search query
      if (searchTerms.length === 0) {
        return [];
      }
      
      // Fetch all content types
      for (const type of contentTypes) {
        const contentItems = await this.getAllContentByType(type);
        
        for (const item of contentItems) {
          // Create searchable text
          const title = item.frontmatter.title.toLowerCase();
          const excerpt = item.frontmatter.excerpt.toLowerCase();
          const plainTextContent = extractTextContent(item.content).toLowerCase();
          const tags = Array.isArray(item.frontmatter.tags) 
            ? item.frontmatter.tags.map((t: string) => t.toLowerCase())
            : [];
          
          // Check if any search term is present
          const isMatch = searchTerms.some(term => 
            title.includes(term) || 
            excerpt.includes(term) || 
            plainTextContent.includes(term) ||
            tags.some((tag: string) => tag.includes(term))
          );
          
          if (isMatch) {
            searchResults.push({
              slug: item.slug,
              path: item.path,
              contentType: item.contentType,
              category: item.category,
              title: item.frontmatter.title,
              excerpt: item.frontmatter.excerpt,
              publishedAt: item.frontmatter.publishedAt,
              tags: item.frontmatter.tags || []
            });
          }
        }
      }
      
      return searchResults;
    } catch (error) {
      console.error(`Error searching content for "${query}":`, error);
      return [];
    }
  }
}

// Export a singleton instance
export const storage = new GitHubStorage();
