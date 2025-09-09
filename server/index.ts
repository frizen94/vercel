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
          } catch (error) {
            log(`❌ Reconnection failed: ${error.message}`);
          }
        }, 30000);
      }
    } catch (error) {
      log(`❌ Database initialization error: ${error}`);
    }
  }, 2000); // Wait 2 seconds after server starts
})();