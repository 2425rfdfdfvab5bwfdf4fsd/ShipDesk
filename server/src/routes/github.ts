import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";
import { verifyToken } from "@clerk/backend";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import * as githubService from "../services/githubService.js";
import { getEffectivePlan, planHasFeature } from "../lib/planLimits.js";

const router = Router();

// Returns whether the workspace has a GitHub OAuth connection.
router.get("/status", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
      include: { githubConn: true },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
    res.json({
      connected: !!workspace.githubConn,
      login: workspace.githubConn?.githubLogin ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// Accepts auth via Bearer header (API calls) OR ?token= query param (browser redirects).
// Browser navigations cannot set Authorization headers, so the frontend passes the
// Clerk session token as a query param when navigating here for GitHub OAuth.
router.get("/connect", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const rawToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : (req.query.token as string | undefined);

  if (!rawToken) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  let userId: string;
  try {
    const { sub: clerkUserId } = await verifyToken(rawToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const user = await db.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) throw new Error("User not found");
    userId = user.id;
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const state = jwt.sign(
    { userId, nonce: crypto.randomBytes(8).toString("hex") },
    process.env.SESSION_SECRET || "secret",
    { expiresIn: "10m" }
  );

  // Use secure:true whenever the request arrived over HTTPS (Replit always does).
  const isHttps =
    req.secure ||
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0].trim() === "https";

  res.cookie("gh_oauth_state", state, {
    httpOnly: true,
    secure: isHttps,
    maxAge: 10 * 60 * 1000,
    sameSite: "lax",
  });

  // Do NOT include redirect_uri — GitHub uses the URL registered in the OAuth App settings.
  // Sending a redirect_uri that differs even slightly from the registered one causes a
  // "Be careful!" block page from GitHub.
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,read:user&state=${state}`;
  res.redirect(url);
});

router.get("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const cookieState = req.cookies?.gh_oauth_state;

    if (!cookieState || cookieState !== state) {
      res.status(400).send("Invalid OAuth state");
      return;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(state, process.env.SESSION_SECRET || "secret") as {
        userId: string;
      };
    } catch {
      res.status(400).send("OAuth state expired or invalid");
      return;
    }

    res.clearCookie("gh_oauth_state");

    const tokenData = await githubService.exchangeCodeForToken(code);
    const encrypted = encrypt(tokenData.access_token);

    const tempConn = { accessTokenEncrypted: encrypted };
    const ghUser = await githubService.getAuthenticatedUser(encrypted);

    const workspace = await db.workspace.findUnique({
      where: { ownerId: decoded.userId },
    });
    if (!workspace) {
      res.redirect(`${process.env.FRONTEND_URL}/onboarding`);
      return;
    }

    await db.gitHubConnection.upsert({
      where: { workspaceId: workspace.id },
      update: {
        githubUserId: ghUser.id,
        githubLogin: ghUser.login,
        accessTokenEncrypted: encrypted,
        scopes: tokenData.scope,
      },
      create: {
        workspaceId: workspace.id,
        githubUserId: ghUser.id,
        githubLogin: ghUser.login,
        accessTokenEncrypted: encrypted,
        scopes: tokenData.scope,
      },
    });

    const appBase = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : (process.env.FRONTEND_URL || "http://localhost:5000").replace(/\/$/, "");
    res.redirect(`${appBase}/settings?github=connected`);
  } catch (err) {
    console.error("GitHub callback error:", err);
    const appBase = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : (process.env.FRONTEND_URL || "http://localhost:5000").replace(/\/$/, "");
    res.redirect(`${appBase}/settings?github=error`);
  }
});

router.get("/repos", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    const ghConn = await db.gitHubConnection.findUnique({
      where: { workspaceId: workspace.id },
    });
    if (!ghConn) throw new AppError("GitHub not connected", 404, "GITHUB_NOT_CONNECTED");

    const repos = await githubService.listUserRepos(
      ghConn.accessTokenEncrypted,
      req.query.q as string | undefined
    );
    res.json(repos);
  } catch (err) {
    next(err);
  }
});

const connectRepoSchema = z.object({
  projectId: z.string().uuid(),
  repoFullName: z.string(),
});

router.post("/connect-repo", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    const effectivePlan = getEffectivePlan(workspace);
    if (!planHasFeature(effectivePlan, "github")) {
      throw new AppError("GitHub integration requires the Solo plan or higher", 403, "PLAN_FEATURE_REQUIRED");
    }

    const body = connectRepoSchema.parse(req.body);

    const project = await db.project.findFirst({
      where: { id: body.projectId, workspaceId: workspace.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const ghConn = await db.gitHubConnection.findUnique({
      where: { workspaceId: workspace.id },
    });
    if (!ghConn) throw new AppError("GitHub not connected", 400, "GITHUB_NOT_CONNECTED");

    // Webhook URL must point to this running server.
    // On Replit, REPLIT_DEV_DOMAIN is the live public domain — always use it here.
    // In production without Replit, fall back to BACKEND_URL then FRONTEND_URL.
    const serverBase = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : (process.env.BACKEND_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const webhookUrl = `${serverBase}/api/webhooks/github`;

    let webhookId: number | null = null;
    try {
      webhookId = await githubService.registerWebhook(
        ghConn.accessTokenEncrypted,
        body.repoFullName,
        webhookUrl
      );
    } catch (webhookErr: unknown) {
      // Webhook registration is best-effort — repo linking should always succeed.
      // Common non-fatal codes: 403 (no admin perms), 422 (hook already exists).
      const axiosErr = webhookErr as { response?: { status: number }; message?: string };
      console.warn(
        `Webhook registration skipped for ${body.repoFullName} — ` +
        `status=${axiosErr.response?.status ?? "unknown"} msg=${axiosErr.message ?? ""}`
      );
    }

    const [owner, repoName] = body.repoFullName.split("/");
    const repoData = await axios
      .get(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: {
          Authorization: `token ${decrypt(ghConn.accessTokenEncrypted)}`,
          Accept: "application/vnd.github.v3+json",
        },
      })
      .catch(() => ({ data: { id: 0 } }));

    const updated = await db.project.update({
      where: { id: project.id },
      data: {
        githubRepoFullName: body.repoFullName,
        githubRepoId: (repoData.data as { id: number }).id || null,
        githubWebhookId: webhookId,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post("/reregister-webhook/:projectId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({ where: { ownerId: req.userId! } });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: workspace.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
    if (!project.githubRepoFullName) throw new AppError("No repo linked", 400, "NO_REPO");

    const ghConn = await db.gitHubConnection.findUnique({ where: { workspaceId: workspace.id } });
    if (!ghConn) throw new AppError("GitHub not connected", 400, "GITHUB_NOT_CONNECTED");

    // Delete old webhook if one exists
    if (project.githubWebhookId) {
      try {
        await githubService.deleteWebhook(ghConn.accessTokenEncrypted, project.githubRepoFullName, project.githubWebhookId);
      } catch {
        // Old webhook may already be gone — continue
      }
    }

    const serverBase = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : (process.env.BACKEND_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const webhookUrl = `${serverBase}/api/webhooks/github`;

    const webhookId = await githubService.registerWebhook(ghConn.accessTokenEncrypted, project.githubRepoFullName, webhookUrl);

    await db.project.update({
      where: { id: project.id },
      data: { githubWebhookId: webhookId },
    });

    res.json({ success: true, webhookId, webhookUrl });
  } catch (err) {
    next(err);
  }
});

// Returns the number of commits stored for this week + webhook health info.
router.get("/week-activity/:projectId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({ where: { ownerId: req.userId! } });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: workspace.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const now = new Date();
    const day = now.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + mondayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const events = await db.gitHubEvent.findMany({
      where: { projectId: project.id, receivedAt: { gte: weekStart, lte: weekEnd } },
      select: { payload: true, eventType: true },
    });

    let commitCount = 0;
    for (const ev of events) {
      if (ev.eventType === "push") {
        const p = ev.payload as Record<string, unknown>;
        const commits = (p.commits as unknown[]) || [];
        commitCount += commits.length;
      }
    }

    const backendUrl = process.env.BACKEND_URL || "";
    const webhookConfigured = !!backendUrl && !backendUrl.includes("vercel.app");
    const webhookUrl = backendUrl ? `${backendUrl.replace(/\/$/, "")}/api/webhooks/github` : null;

    res.json({
      commitCount,
      eventCount: events.length,
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
      webhookConfigured,
      webhookUrl,
    });
  } catch (err) {
    next(err);
  }
});

function getCurrentWeekBounds() {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() + mondayOffset);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

router.post("/sync-commits/:projectId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({ where: { ownerId: req.userId! } });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: workspace.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
    if (!project.githubRepoFullName) throw new AppError("No GitHub repo linked", 400, "NO_REPO");

    const ghConn = await db.gitHubConnection.findUnique({ where: { workspaceId: workspace.id } });
    if (!ghConn) throw new AppError("GitHub not connected", 400, "GITHUB_NOT_CONNECTED");

    const { weekStart, weekEnd } = getCurrentWeekBounds();

    // Fetch commits from ALL branches this week (deduped by SHA)
    const allCommits = await githubService.fetchAllBranchCommits(
      ghConn.accessTokenEncrypted,
      project.githubRepoFullName,
      weekStart,
      weekEnd
    );

    if (allCommits.length === 0) {
      res.json({ synced: 0, message: "No commits found this week on any branch." });
      return;
    }

    // Collect SHAs already present in webhook-delivered events (status=RECEIVED)
    // so we never duplicate work GitHub already delivered.
    const existingEvents = await db.gitHubEvent.findMany({
      where: { projectId: project.id, receivedAt: { gte: weekStart, lte: weekEnd }, status: "RECEIVED" },
      select: { payload: true },
    });
    const existingShas = new Set<string>();
    for (const ev of existingEvents) {
      const p = ev.payload as Record<string, unknown>;
      const payloadCommits = (p.commits as { id?: string }[]) || [];
      for (const c of payloadCommits) {
        if (c.id) existingShas.add(c.id);
      }
    }

    // Wipe previously API-synced events this week to avoid stacking duplicates
    await db.gitHubEvent.deleteMany({
      where: { projectId: project.id, receivedAt: { gte: weekStart, lte: weekEnd }, status: "PROCESSED" },
    });

    // Group commits by branch, skip SHAs already covered by webhooks
    const byBranch = new Map<string, typeof allCommits>();
    for (const c of allCommits) {
      if (existingShas.has(c.sha)) continue;
      if (!byBranch.has(c.branch)) byBranch.set(c.branch, []);
      byBranch.get(c.branch)!.push(c);
    }

    if (byBranch.size === 0) {
      res.json({ synced: 0, message: "All commits already synced via webhook." });
      return;
    }

    // Create one push event per branch, using actual commit dates for receivedAt
    let totalSynced = 0;
    for (const [branch, commits] of byBranch) {
      const pusher = commits[0].login || commits[0].authorName;
      // Use the date of the most recent commit as the event timestamp
      const receivedAt = commits[commits.length - 1].authorDate;

      await db.gitHubEvent.create({
        data: {
          projectId: project.id,
          eventType: "push",
          payload: {
            ref: `refs/heads/${branch}`,
            pusher: { name: pusher },
            commits: commits.map((c) => ({
              id: c.sha,
              message: c.message,
              author: { name: c.authorName },
              timestamp: c.authorDate.toISOString(),
              distinct: true,
            })),
            _apiSync: true,
          } as object,
          repoFullName: project.githubRepoFullName,
          status: "PROCESSED",
          receivedAt,
        },
      });
      totalSynced += commits.length;
    }

    res.json({
      synced: totalSynced,
      branches: byBranch.size,
      message: `Synced ${totalSynced} commit(s) across ${byBranch.size} branch(es).`,
    });
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/disconnect-repo/:projectId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const workspace = await db.workspace.findUnique({
        where: { ownerId: req.userId! },
      });
      if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

      const project = await db.project.findFirst({
        where: { id: req.params.projectId, workspaceId: workspace.id },
      });
      if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

      if (project.githubRepoFullName && project.githubWebhookId) {
        const ghConn = await db.gitHubConnection.findUnique({
          where: { workspaceId: workspace.id },
        });
        if (ghConn) {
          try {
            await githubService.deleteWebhook(
              ghConn.accessTokenEncrypted,
              project.githubRepoFullName,
              project.githubWebhookId
            );
          } catch (err) {
            console.error("Failed to delete GitHub webhook:", err);
          }
        }
      }

      await db.project.update({
        where: { id: project.id },
        data: {
          githubRepoId: null,
          githubRepoFullName: null,
          githubWebhookId: null,
        },
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
