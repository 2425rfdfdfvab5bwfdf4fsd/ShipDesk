import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { errorHandler } from "./middleware/errorHandler.js";
import { defaultLimiter } from "./middleware/rateLimiter.js";

import workspaceRouter from "./routes/workspace.js";
import teamRouter from "./routes/team.js";
import projectsRouter from "./routes/projects.js";
import githubRouter from "./routes/github.js";
import reportsRouter from "./routes/reports.js";
import clientsRouter from "./routes/clients.js";
import filesRouter from "./routes/files.js";
import messagesRouter from "./routes/messages.js";
import invoicesRouter from "./routes/invoices.js";
import scopeChangesRouter from "./routes/scopeChanges.js";
import portalRouter from "./routes/portal.js";
import webhooksRouter from "./routes/webhooks.js";
import adminRouter from "./routes/admin.js";
import billingRouter from "./routes/billing.js";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  /^https:\/\/[a-z0-9-]+\.portal\.shipdesk\.io$/,
  /^https:\/\/shipdesk\.io$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/,
  /^https:\/\/[a-z0-9-]+\.onrender\.com$/,
  /^https:\/\/[a-z0-9-]+\.replit\.dev$/,
  /^https:\/\/[a-z0-9-]+\.repl\.co$/,
  ...(process.env.NODE_ENV === "development"
    ? [
        "http://localhost:5000",
        "http://localhost:5173",
        "http://localhost:5174",
        process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : undefined,
      ]
    : []),
].filter(Boolean) as (string | RegExp)[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Session-Token"],
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(cookieParser());

app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  webhooksRouter
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    next();
  });
}

app.get("/health", async (_req, res) => {
  try {
    await import("./lib/prisma.js").then((m) => m.db.$queryRaw`SELECT 1`);
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      db: "ok",
    });
  } catch (err) {
    console.error("Health check DB ping failed:", err);
    res.status(503).json({
      status: "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      db: "unreachable",
    });
  }
});

app.use(defaultLimiter);
app.use("/api/workspace/team", teamRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/projects", messagesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects", clientsRouter);
app.use("/api/projects", filesRouter);
app.use("/api/github", githubRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/scope-changes", scopeChangesRouter);
app.use("/api/portal", portalRouter);
app.use("/api/files", filesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/billing", billingRouter);

const clientDistPath = path.join(__dirname, "../../client/dist");
const clientDistExists = fs.existsSync(path.join(clientDistPath, "index.html"));

if (process.env.NODE_ENV === "production" && clientDistExists) {
  app.use(express.static(clientDistPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(errorHandler);

export default app;
