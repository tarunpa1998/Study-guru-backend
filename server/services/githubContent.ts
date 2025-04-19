import { GithubContentConfig, ContentType } from '../../shared/schema';

export class GitHubContentService {
  private config: GithubContentConfig;
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: GithubContentConfig) {
    this.config = config;
    this.baseUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents`;
    
    this.headers = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'Study-Abroad-Portal'
    };
    
    if (config.accessToken) {
      this.headers['Authorization'] = `token ${config.accessToken}`;
    }
  }

  /**
   * Get a list of all content paths for a specific content type
   */
  async listContent(contentType: ContentType): Promise<string[]> {
    try {
      // Get the directory listing for the content type
      const path = `${this.config.contentPath}/${contentType}s`;
      const response = await fetch(`${this.baseUrl}/${path}?ref=${this.config.branch}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const contents = await response.json();
      
      // Filter for directories (categories) and files at the root level
      const items: string[] = [];
      
      // Process directories (categories)
      for (const item of contents) {
        if (item.type === 'dir') {
          // Get contents of the category directory
          const categoryContents = await this.listCategoryContent(contentType, item.name);
          items.push(...categoryContents);
        } else if (item.type === 'file' && item.name.endsWith('.mdx')) {
          // Add file at root level
          items.push(`${contentType}s/${item.name}`);
        }
      }
      
      return items;
    } catch (error) {
      console.error(`Error listing GitHub content for ${contentType}:`, error);
      throw error;
    }
  }
  
  /**
   * List content within a category directory
   */
  private async listCategoryContent(contentType: ContentType, category: string): Promise<string[]> {
    try {
      const path = `${this.config.contentPath}/${contentType}s/${category}`;
      const response = await fetch(`${this.baseUrl}/${path}?ref=${this.config.branch}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const contents = await response.json();
      
      // Return only MDX files in this category
      return contents
        .filter((item: any) => item.type === 'file' && item.name.endsWith('.mdx'))
        .map((item: any) => `${contentType}s/${category}/${item.name}`);
    } catch (error) {
      console.error(`Error listing category content for ${contentType}/${category}:`, error);
      return [];
    }
  }

  /**
   * Get the raw content of a file
   */
  async getFileContent(filePath: string): Promise<string> {
    try {
      const path = `${this.config.contentPath}/${filePath}`;
      const response = await fetch(`${this.baseUrl}/${path}?ref=${this.config.branch}`, {
        headers: {
          ...this.headers,
          'Accept': 'application/vnd.github.v3.raw'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Error getting file content for ${filePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new file in the GitHub repository
   * Note: This requires write access and will create a commit
   */
  async createFile(path: string, content: string, commitMessage: string): Promise<boolean> {
    try {
      if (!this.config.accessToken) {
        throw new Error('GitHub access token required for write operations');
      }
      
      const fullPath = `${this.config.contentPath}/${path}`;
      const encodedContent = Buffer.from(content).toString('base64');
      
      const response = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${fullPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Study-Abroad-Portal'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: encodedContent,
          branch: this.config.branch
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${error.message}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error creating file ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an existing file in the GitHub repository
   */
  async updateFile(path: string, content: string, commitMessage: string): Promise<boolean> {
    try {
      if (!this.config.accessToken) {
        throw new Error('GitHub access token required for write operations');
      }
      
      const fullPath = `${this.config.contentPath}/${path}`;
      
      // First, we need to get the current file to get its SHA
      const fileResponse = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${fullPath}?ref=${this.config.branch}`, {
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'User-Agent': 'Study-Abroad-Portal'
        }
      });
      
      if (!fileResponse.ok) {
        throw new Error(`GitHub API error: ${fileResponse.status} ${fileResponse.statusText}`);
      }
      
      const fileData = await fileResponse.json();
      const encodedContent = Buffer.from(content).toString('base64');
      
      const response = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${fullPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Study-Abroad-Portal'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: encodedContent,
          sha: fileData.sha,
          branch: this.config.branch
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${error.message}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating file ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a file from the GitHub repository
   */
  async deleteFile(path: string, commitMessage: string): Promise<boolean> {
    try {
      if (!this.config.accessToken) {
        throw new Error('GitHub access token required for write operations');
      }
      
      const fullPath = `${this.config.contentPath}/${path}`;
      
      // First, we need to get the current file to get its SHA
      const fileResponse = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${fullPath}?ref=${this.config.branch}`, {
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'User-Agent': 'Study-Abroad-Portal'
        }
      });
      
      if (!fileResponse.ok) {
        throw new Error(`GitHub API error: ${fileResponse.status} ${fileResponse.statusText}`);
      }
      
      const fileData = await fileResponse.json();
      
      const response = await fetch(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${fullPath}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Study-Abroad-Portal'
        },
        body: JSON.stringify({
          message: commitMessage,
          sha: fileData.sha,
          branch: this.config.branch
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${error.message}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error);
      throw error;
    }
  }
}

// GitHub content repository configuration 
// This will need to be replaced with actual values from environment variables
const defaultConfig: GithubContentConfig = {
  owner: process.env.GITHUB_OWNER || 'tarunpa1998',
  repo: process.env.GITHUB_REPO || 'Study-guru-backend',
  branch: process.env.GITHUB_BRANCH || 'main',
  contentPath: process.env.GITHUB_CONTENT_PATH || 'content',
  accessToken: process.env.GITHUB_ACCESS_TOKEN
};

// Create a singleton instance
export const githubContentService = new GitHubContentService(defaultConfig);
