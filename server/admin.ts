import { Router, Request, Response } from 'express';
import { storage } from './storage';

const adminRouter = Router();

// Basic authentication middleware for admin routes
const adminAuth = (req: Request, res: Response, next: Function) => {
  // In a real app, you'd validate a proper authentication token
  // For now, we'll just check for the GitHub access token existence
  const githubToken = process.env.GITHUB_ACCESS_TOKEN;
  
  if (!githubToken) {
    return res.status(401).json({ 
      message: "Admin access requires a GitHub token. Please set the GITHUB_ACCESS_TOKEN environment variable." 
    });
  }
  
  next();
};

// Apply authentication to all admin routes
adminRouter.use(adminAuth);

// Get all content
adminRouter.get('/content', async (req: Request, res: Response) => {
  try {
    const contentType = req.query.type as string;
    
    if (!contentType) {
      return res.status(400).json({ message: "Content type is required" });
    }
    
    const content = await storage.getAllContentByType(contentType);
    
    // Return only metadata for listings
    const contentList = content.map(item => ({
      slug: item.slug,
      path: item.path,
      type: item.contentType,
      category: item.category,
      title: item.frontmatter.title,
      excerpt: item.frontmatter.excerpt,
      publishedAt: item.frontmatter.publishedAt,
      updatedAt: item.frontmatter.updatedAt,
      featured: item.frontmatter.featured,
      tags: item.frontmatter.tags
    }));
    
    res.json(contentList);
  } catch (error) {
    console.error(`Admin error fetching content:`, error);
    res.status(500).json({ message: "Failed to fetch content" });
  }
});

// Get content by slug
adminRouter.get('/content/:type/:slug', async (req: Request, res: Response) => {
  try {
    const { type, slug } = req.params;
    
    const contentItem = await storage.getContentBySlug(type, slug);
    
    if (!contentItem) {
      return res.status(404).json({ message: "Content not found" });
    }
    
    res.json({
      slug: contentItem.slug,
      path: contentItem.path,
      type: contentItem.contentType,
      category: contentItem.category,
      frontmatter: contentItem.frontmatter,
      content: contentItem.content
    });
  } catch (error) {
    console.error(`Admin error fetching content by slug:`, error);
    res.status(500).json({ message: "Failed to fetch content" });
  }
});

// Create content
adminRouter.post('/content/:type', async (req: Request, res: Response) => {
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
    console.error(`Admin error creating content:`, error);
    res.status(500).json({ message: "Failed to create content" });
  }
});

// Update content
adminRouter.put('/content/:type/:slug', async (req: Request, res: Response) => {
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
    console.error(`Admin error updating content:`, error);
    res.status(500).json({ message: "Failed to update content" });
  }
});

// Delete content
adminRouter.delete('/content/:type/:slug', async (req: Request, res: Response) => {
  try {
    const { type, slug } = req.params;
    
    const success = await storage.deleteContent(type, slug);
    
    if (!success) {
      return res.status(404).json({ message: "Content not found or failed to delete" });
    }
    
    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error(`Admin error deleting content:`, error);
    res.status(500).json({ message: "Failed to delete content" });
  }
});

export default adminRouter;
