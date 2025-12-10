import express from "express";
import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { globalErrorHandler, csrfProtection, globalApiRateLimit, sanitizeInput } from "./middlewares";
import { setupVite, serveStatic } from "./vite";
import { initializeDatabase } from "./database";
import { runSeeder } from "./seeder";

const app = express();

// Configurar trust proxy para Railway/Vercel/Railway
app.set('trust proxy', 1);

// Detectar ambiente de produção
const isProduction = process.env.NODE_ENV === 'production';

// Configuração de segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"], // Adiciona blob: para preview de imagens
      // Em produção: bloqueia unsafe-inline e unsafe-eval para máxima segurança contra XSS
      // Em desenvolvimento: permite para compatibilidade com Vite HMR
      scriptSrc: isProduction 
        ? ["'self'"] 
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "ws:", "wss:"], // Para WebSocket do Vite HMR
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Para compatibilidade
}));

// Log da configuração CSP aplicada
if (isProduction) {
  console.log("🔒 [SEGURANÇA] CSP em modo PRODUÇÃO: unsafe-inline e unsafe-eval BLOQUEADOS");
} else {
  console.log("🔧 [DEV] CSP em modo DESENVOLVIMENTO: unsafe-inline e unsafe-eval permitidos para Vite HMR");
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sanitizar todas as entradas
app.use(sanitizeInput);

// Aplicar limitação de taxa global a todas as rotas da API
app.use("/api/", globalApiRateLimit);

// CSRF será configurado após as sessões nas rotas

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

  // Log adicional para debugging em produção
  if (process.env.NODE_ENV === "production" && req.path.startsWith("/api")) {
    console.log(`📥 [${req.method}] ${req.path} - IP: ${req.ip} - Headers: ${JSON.stringify({
      'user-agent': req.headers['user-agent']?.substring(0, 50),
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'authorization': req.headers['authorization'] ? 'present' : 'none',
      'cookie': req.headers['cookie'] ? 'present' : 'none'
    })}`);
  }

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

  // Aplicar global error handler para tratamento seguro de erros
  app.use(globalErrorHandler);

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server immediately on Railway's expected port
  const port = parseInt(process.env.PORT || "8080");
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
        const { runOverdueCheck } = await import('./overdue-tasks');
        setInterval(async () => {
          try {
            log("🕐 Verificando tarefas atrasadas...");
            const created = await runOverdueCheck();
            log(`✅ Verificação de tarefas atrasadas concluída. ${created} notificações criadas.`);
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