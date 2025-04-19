import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, ContentItem } from "./storage";
import path from "path";
import fs from "fs";
import matter from "gray-matter";
import { githubContentService } from "./services/githubContent";

// Define valid content types
const VALID_CONTENT_TYPES = ["article", "news", "scholarship", "country", "university"];

// Validate content type parameter
const validateContentType = (req: Request, res: Response, next: Function) => {
  try {
    const { type } = req.params;
    if (!VALID_CONTENT_TYPES.includes(type)) {
      return res.status(400).json({ 
        message: "Invalid content type", 
        validTypes: VALID_CONTENT_TYPES 
      });
    }
    next();
  } catch (error) {
    res.status(400).json({ 
      message: "Invalid content type", 
      validTypes: VALID_CONTENT_TYPES 
    });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    console.log('Starting route registration...');
    
    // --- CONTENT API ROUTES ---
    
    // GET all content by type
    app.get('/api/content/:type', validateContentType, async (req, res) => {
      try {
        const { type } = req.params;
        const content = await storage.getAllContentByType(type);
        
        // Return only necessary metadata for listings
        const contentList = content.map(item => ({
          slug: item.slug,
          path: item.path,
          type: item.contentType,
          category: item.category,
          title: item.frontmatter.title,
          excerpt: item.frontmatter.excerpt,
          publishedAt: item.frontmatter.publishedAt,
          updatedAt: item.frontmatter.updatedAt,
          coverImage: item.frontmatter.coverImage,
          author: item.frontmatter.author,
          tags: item.frontmatter.tags,
          featured: item.frontmatter.featured,
          readingTime: item.frontmatter.readingTime || 
            Math.ceil(item.content.split(/\s+/).length / 200)
        }));
        
        res.json(contentList);
      } catch (error) {
        console.error(`Error fetching content:`, error);
        res.status(500).json({ message: "Failed to fetch content" });
      }
    });

    // GET content by type and category
    app.get('/api/content/:type/:category', validateContentType, async (req, res) => {
      try {
        const { type, category } = req.params;
        const content = await storage.getContentByTypeAndCategory(type, category);
        
        // Return only necessary metadata for listings
        const contentList = content.map(item => ({
          slug: item.slug,
          path: item.path,
          type: item.contentType,
          category: item.category,
          title: item.frontmatter.title,
          excerpt: item.frontmatter.excerpt,
          publishedAt: item.frontmatter.publishedAt,
          updatedAt: item.frontmatter.updatedAt,
          coverImage: item.frontmatter.coverImage,
          author: item.frontmatter.author,
          tags: item.frontmatter.tags,
          featured: item.frontmatter.featured,
          readingTime: item.frontmatter.readingTime || 
            Math.ceil(item.content.split(/\s+/).length / 200)
        }));
        
        res.json(contentList);
      } catch (error) {
        console.error(`Error fetching content by category:`, error);
        res.status(500).json({ message: "Failed to fetch content by category" });
      }
    });

    // GET single content item by slug
    app.get('/api/content/:type/slug/:slug', validateContentType, async (req, res) => {
      try {
        const { type, slug } = req.params;
        const contentItem = await storage.getContentBySlug(type, slug);
        
        if (!contentItem) {
          return res.status(404).json({ message: "Content not found" });
        }
        
        // Return both metadata and content
        res.json({
          metadata: {
            slug: contentItem.slug,
            path: contentItem.path,
            type: contentItem.contentType,
            category: contentItem.category,
            ...contentItem.frontmatter
          },
          content: contentItem.content
        });
      } catch (error) {
        console.error(`Error fetching content by slug:`, error);
        res.status(500).json({ message: "Failed to fetch content item" });
      }
    });

    // GET featured content
    app.get('/api/featured/:type', validateContentType, async (req, res) => {
      try {
        const { type } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
        const content = await storage.getFeaturedContent(type, limit);
        
        // Return only necessary metadata for listings
        const contentList = content.map(item => ({
          slug: item.slug,
          path: item.path,
          type: item.contentType,
          category: item.category,
          title: item.frontmatter.title,
          excerpt: item.frontmatter.excerpt,
          publishedAt: item.frontmatter.publishedAt,
          updatedAt: item.frontmatter.updatedAt,
          coverImage: item.frontmatter.coverImage,
          author: item.frontmatter.author,
          tags: item.frontmatter.tags,
          featured: item.frontmatter.featured,
          readingTime: item.frontmatter.readingTime || 
            Math.ceil(item.content.split(/\s+/).length / 200)
        }));
        
        res.json(contentList);
      } catch (error) {
        console.error(`Error fetching featured content:`, error);
        res.status(500).json({ message: "Failed to fetch featured content" });
      }
    });

    // GET recent content
    app.get('/api/recent/:type', validateContentType, async (req, res) => {
      try {
        const { type } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
        const content = await storage.getRecentContent(type, limit);
        
        // Return only necessary metadata for listings
        const contentList = content.map(item => ({
          slug: item.slug,
          path: item.path,
          type: item.contentType,
          category: item.category,
          title: item.frontmatter.title,
          excerpt: item.frontmatter.excerpt,
          publishedAt: item.frontmatter.publishedAt,
          updatedAt: item.frontmatter.updatedAt,
          coverImage: item.frontmatter.coverImage,
          author: item.frontmatter.author,
          tags: item.frontmatter.tags,
          featured: item.frontmatter.featured,
          readingTime: item.frontmatter.readingTime || 
            Math.ceil(item.content.split(/\s+/).length / 200)
        }));
        
        res.json(contentList);
      } catch (error) {
        console.error(`Error fetching recent content:`, error);
        res.status(500).json({ message: "Failed to fetch recent content" });
      }
    });

    // Search content
    app.get('/api/search', async (req, res) => {
      try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
          return res.status(400).json({ message: "Search query is required" });
        }
        
        const results = await storage.searchContent(q);
        res.json(results);
      } catch (error) {
        console.error(`Error searching content:`, error);
        res.status(500).json({ message: "Failed to search content" });
      }
    });

    // Create content (admin)
    app.post('/api/admin/content/:type', validateContentType, async (req, res) => {
      try {
        const { type } = req.params;
        const { slug, mdxContent } = req.body;
        
        if (!slug || !mdxContent) {
          return res.status(400).json({ message: "Slug and MDX content are required" });
        }
        
        const contentItem = await storage.createContent(type, slug, mdxContent);
        
        if (!contentItem) {
          return res.status(500).json({ message: "Failed to create content" });
        }
        
        res.status(201).json({
          slug: contentItem.slug,
          path: contentItem.path,
          type: contentItem.contentType,
          category: contentItem.category,
          ...contentItem.frontmatter
        });
      } catch (error) {
        console.error(`Error creating content:`, error);
        res.status(500).json({ message: "Failed to create content" });
      }
    });

    // Update content (admin)
    app.put('/api/admin/content/:type/:slug', validateContentType, async (req, res) => {
      try {
        const { type, slug } = req.params;
        const { mdxContent } = req.body;
        
        if (!mdxContent) {
          return res.status(400).json({ message: "MDX content is required" });
        }
        
        const contentItem = await storage.updateContent(type, slug, mdxContent);
        
        if (!contentItem) {
          return res.status(404).json({ message: "Content not found or failed to update" });
        }
        
        res.json({
          slug: contentItem.slug,
          path: contentItem.path,
          type: contentItem.contentType,
          category: contentItem.category,
          ...contentItem.frontmatter
        });
      } catch (error) {
        console.error(`Error updating content:`, error);
        res.status(500).json({ message: "Failed to update content" });
      }
    });

    // Delete content (admin)
    app.delete('/api/admin/content/:type/:slug', validateContentType, async (req, res) => {
      try {
        const { type, slug } = req.params;
        
        const success = await storage.deleteContent(type, slug);
        
        if (!success) {
          return res.status(404).json({ message: "Content not found or failed to delete" });
        }
        
        res.json({ message: "Content deleted successfully" });
      } catch (error) {
        console.error(`Error deleting content:`, error);
        res.status(500).json({ message: "Failed to delete content" });
      }
    });

    // Generate sitemap
    app.get('/sitemap.xml', async (req, res) => {
      try {
        const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
        
        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        
        // Add home page
        sitemap += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
        
        // Add main section pages
        for (const type of VALID_CONTENT_TYPES) {
          sitemap += `  <url>\n    <loc>${baseUrl}/${type}s</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
          
          // Add all content for each type
          const content = await storage.getAllContentByType(type);
          for (const item of content) {
            const url = `/${type}s/${item.slug}`;
            const lastmod = item.frontmatter.updatedAt || item.frontmatter.publishedAt;
            const formattedDate = new Date(lastmod).toISOString().split('T')[0];
            
            sitemap += `  <url>\n    <loc>${baseUrl}${url}</loc>\n    <lastmod>${formattedDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
          }
        }
        
        sitemap += '</urlset>';
        
        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
      } catch (error) {
        console.error(`Error generating sitemap:`, error);
        res.status(500).json({ message: "Failed to generate sitemap" });
      }
    });

    // Generate robots.txt
    app.get('/robots.txt', (req, res) => {
      const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
      const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`;
      res.type('text/plain');
      res.send(robotsTxt);
    });

    // Generate RSS feed
    app.get('/rss.xml', async (req, res) => {
      try {
        const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
        
        // Get recent articles and news
        const articles = await storage.getRecentContent('article', 10);
        const news = await storage.getRecentContent('news', 10);
        
        // Combine and sort by date
        const items = [...articles, ...news].sort((a, b) => {
          const dateA = new Date(a.frontmatter.publishedAt).getTime();
          const dateB = new Date(b.frontmatter.publishedAt).getTime();
          return dateB - dateA;
        }).slice(0, 20);
        
        let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
        rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
        rss += '  <channel>\n';
        rss += '    <title>Study Abroad Education Portal</title>\n';
        rss += '    <description>Latest education news and articles for international students</description>\n';
        rss += `    <link>${baseUrl}</link>\n`;
        rss += `    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />\n`;
        
        for (const item of items) {
          const url = `/${item.contentType}s/${item.slug}`;
          const pubDate = new Date(item.frontmatter.publishedAt).toUTCString();
          
          rss += '    <item>\n';
          rss += `      <title>${item.frontmatter.title}</title>\n`;
          rss += `      <description>${item.frontmatter.excerpt}</description>\n`;
          rss += `      <link>${baseUrl}${url}</link>\n`;
          rss += `      <guid>${baseUrl}${url}</guid>\n`;
          rss += `      <pubDate>${pubDate}</pubDate>\n`;
          
          if (item.frontmatter.tags && item.frontmatter.tags.length > 0) {
            for (const tag of item.frontmatter.tags) {
              rss += `      <category>${tag}</category>\n`;
            }
          }
          
          rss += '    </item>\n';
        }
        
        rss += '  </channel>\n';
        rss += '</rss>';
        
        res.header('Content-Type', 'application/xml');
        res.send(rss);
      } catch (error) {
        console.error(`Error generating RSS feed:`, error);
        res.status(500).json({ message: "Failed to generate RSS feed" });
      }
    });

    console.log('All routes registered successfully');
    const httpServer = createServer(app);
    console.log('HTTP server created');
    return httpServer;
  } catch (error) {
    console.error(`Error registering routes:`, error);
    // Still return a server instance even if there's an error
    const httpServer = createServer(app);
    console.log('Fallback HTTP server created after error');
    return httpServer;
  }
}
