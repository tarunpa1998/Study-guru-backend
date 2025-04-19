# Study Guru Backend

A content-focused backend for the Study Guru platform, using GitHub as a content repository.

## Features

- Content management for study abroad resources
- GitHub-based content storage (no database required)
- RESTful API for content retrieval
- Support for articles, news, scholarships, countries, and universities
- Search functionality
- Admin API for content management

## Content Types

- **Articles**: Educational content about studying abroad
- **News**: Latest updates in international education
- **Scholarships**: Information about available scholarships
- **Countries**: Profiles of study destinations
- **Universities**: Information about educational institutions

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
   GITHUB_OWNER=your-github-username
   GITHUB_REPO=Study-guru-backend
   GITHUB_BRANCH=main
   GITHUB_ACCESS_TOKEN=your-github-token (for admin operations)
   ```
4. Run the development server: `npm run dev`

## API Endpoints

### Content Retrieval

- `GET /api/content/:type` - Get all content of a specific type
- `GET /api/content/:type/:category` - Get content by type and category
- `GET /api/content/:type/slug/:slug` - Get a single content item by slug
- `GET /api/featured/:type` - Get featured content
- `GET /api/recent/:type` - Get recent content
- `GET /api/search?q=query` - Search across all content

### Admin API

- `GET /api/admin/content?type=type` - List all content of a type
- `GET /api/admin/content/:type/:slug` - Get a specific content item
- `POST /api/admin/content/:type` - Create new content
- `PUT /api/admin/content/:type/:slug` - Update existing content
- `DELETE /api/admin/content/:type/:slug` - Delete content

## Content Structure

Content is stored as MDX files in the GitHub repository with the following structure:

```
content/
  articles/
    category1/
      article1.mdx
    category2/
      article2.mdx
  news/
    news1.mdx
  scholarships/
    global/
      scholarship1.mdx
  countries/
    country1.mdx
  universities/
    university1.mdx
```

Each MDX file includes frontmatter with metadata and Markdown content.
