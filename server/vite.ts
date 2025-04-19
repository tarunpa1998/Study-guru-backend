import express, { Express } from 'express';
import path from 'path';
import { Server } from 'http';

/**
 * Simple logging utility
 */
export function log(message: string, context: string = 'app'): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${context}] ${message}`);
}

/**
 * Setup Vite for development
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
  log('Setting up Vite for development', 'vite');
  
  // In a real implementation, this would integrate with Vite
  // For now, we'll just serve static files
  app.use(express.static('public'));
  
  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('public', 'index.html'));
  });
}

/**
 * Serve static files for production
 */
export function serveStatic(app: Express): void {
  log('Setting up static file serving for production', 'vite');
  
  // Serve static files
  app.use(express.static('dist'));
  
  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist', 'index.html'));
  });
}
