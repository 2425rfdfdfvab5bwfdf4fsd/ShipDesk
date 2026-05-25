import app from "./app.js";
import { startScheduler } from "./services/reportScheduler.js";
import { db } from "./lib/prisma.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

// --- Resilient error handlers --------------------------------------------------
// Keep the process alive on unhandled rejections: just log them.
// In Node ≥15, an explicit handler PREVENTS the automatic exit, so we must NOT
// call process.exit(1) here — that would kill the server on any stray rejected
// promise (e.g. a transient DB timeout on first request).
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection] Caught unhandled promise rejection:", reason);
  // Do NOT exit. Let the request fail with a 500 via the error handler.
});

process.on("uncaughtException", (err) => {
  // Uncaught synchronous exceptions ARE fatal — log and exit cleanly.
  console.error("[uncaughtException] Fatal:", err);
  process.exit(1);
});

// --- Startup DB check ---------------------------------------------------------
// Verify the database is reachable before we accept traffic. This surfaces
// connection problems in Railway's deploy logs, not silently on first request.
async function checkDatabase(): Promise<void> {
  try {
    await db.$connect();
    await db.$queryRaw`SELECT 1`;
    console.log("Database connection verified.");
  } catch (err) {
    console.error("Database connectivity check FAILED:", err);
    console.error(
      "DATABASE_URL present:",
      !!process.env.DATABASE_URL,
    );
    // Exit so Railway shows a clear deploy failure instead of a zombie server.
    process.exit(1);
  }
}

// --- Boot sequence ------------------------------------------------------------
async function start(): Promise<void> {
  await checkDatabase();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`ShipDesk server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `Env vars present: DATABASE_URL=${!!process.env.DATABASE_URL} CLERK_SECRET_KEY=${!!process.env.CLERK_SECRET_KEY} SESSION_SECRET=${!!process.env.SESSION_SECRET} ADMIN_EMAIL=${!!process.env.ADMIN_EMAIL}`,
    );
    if (!process.env.ADMIN_EMAIL) {
      console.warn("NOTE: ADMIN_EMAIL is not set — using built-in fallback admin email.");
    }

    if (process.env.NODE_ENV === "production") {
      startScheduler();
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use.`);
    } else if (err.code === "EACCES") {
      console.error(`Permission denied binding to port ${PORT}.`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });

  async function gracefulShutdown(signal: string): Promise<void> {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await db.$disconnect();
        console.log("Database connection closed.");
      } catch (err) {
        console.error("Error disconnecting from database:", err);
      }
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Graceful shutdown timed out. Forcing exit.");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
