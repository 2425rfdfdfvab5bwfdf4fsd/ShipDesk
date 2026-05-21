import app from "./app.js";
import { startScheduler } from "./services/reportScheduler.js";
import { db } from "./lib/prisma.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`ShipDesk server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  if (process.env.NODE_ENV === "production") {
    startScheduler();
  }
});

async function gracefulShutdown(signal: string) {
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
