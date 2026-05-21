import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";
import { defaultLimiter } from "./middleware/rateLimiter.js";

import healthRouter from "./routes/health.js";
import workspaceRouter from "./routes/workspace.js";
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

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  /^https:\/\/[a-z0-9-]+\.portal\.shipdesk\.io$/,
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

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.use(defaultLimiter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects", clientsRouter);
app.use("/api/projects", filesRouter);
app.use("/api/projects", messagesRouter);
app.use("/api/github", githubRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/scope-changes", scopeChangesRouter);
app.use("/api/portal", portalRouter);
app.use("/api/files", filesRouter);

app.use(errorHandler);

export default app;
