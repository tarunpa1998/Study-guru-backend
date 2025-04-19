import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import adminRouter from "./admin";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register admin routes
app.use('/api/admin', adminRouter);
log('Admin routes registered', 'server');

// API request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Register API routes
    log('Registering routes...', 'server');
    const server = await registerRoutes(app);
    log('Routes registered successfully', 'server');

    // Set up error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`, 'server');
      res.status(status).json({ message });
    });

    // Set up Vite for frontend
    log('Setting up Vite...', 'server');
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    log('Vite setup complete', 'server');

    // Start the server
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`Server running on port ${port}`, 'server');
      log(`Access the application at: http://localhost:${port}/`, 'server');
    });
  } catch (error) {
    log(`Server startup failed: ${error}`, 'server');
    process.exit(1);
  }
})();
