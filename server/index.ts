import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { initializeDatabase } from "./database";
import { runSeeder } from "./seeder";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Middleware para logging de requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any = undefined;

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
  // Start server first to pass Railway health checks
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server immediately on Railway's expected port
  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Server running on port ${port}`);
  });

  // Initialize database in background after server is running
  setTimeout(async () => {
    try {
      log("🔄 Initializing database...");
      let dbInitialized = await initializeDatabase();
      
      if (dbInitialized) {
        log("✅ Database connected, running seeder...");
        await runSeeder();
        log("🎉 Application fully initialized!");
        
        // Iniciar verificação periódica de tarefas atrasadas (a cada 6 horas)
        setInterval(async () => {
          try {
            log("🕐 Verificando tarefas atrasadas...");
            const response = await fetch('http://localhost:5000/api/check-overdue-tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const result = await response.json();
              log(`✅ Verificação de tarefas atrasadas concluída. ${result.notificationsCreated} notificações criadas.`);
            } else {
              log("⚠️ Falha na verificação de tarefas atrasadas");
            }
          } catch (error) {
            log(`❌ Erro na verificação automática de tarefas atrasadas: ${error}`);
          }
        }, 6 * 60 * 60 * 1000); // 6 horas
        
      } else {
        log("⚠️ Database connection failed, will retry...");
        // Retry every 30 seconds
        const reconnectInterval = setInterval(async () => {
          try {
            log("🔄 Retrying database connection...");
            dbInitialized = await initializeDatabase();
            if (dbInitialized) {
              log("✅ Database reconnected!");
              clearInterval(reconnectInterval);
              await runSeeder();
              log("✅ Seeder completed!");
            }
          } catch (error: any) {
            log(`❌ Reconnection failed: ${error.message}`);
          }
        }, 30000);
      }
    } catch (error) {
      log(`❌ Database initialization error: ${error}`);
    }
  }, 2000); // Wait 2 seconds after server starts
})();