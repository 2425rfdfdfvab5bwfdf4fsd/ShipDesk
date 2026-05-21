import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { encrypt } from "../lib/crypto.js";
import * as githubService from "../services/githubService.js";

const router = Router();

router.get("/connect", requireAuth, (req: AuthRequest, res: Response) => {
  const state = jwt.sign(
    { userId: req.userId, nonce: crypto.randomBytes(8).toString("hex") },
    process.env.SESSION_SECRET || "secret",
    { expiresIn: "10m" }
  );

  res.cookie("gh_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
    sameSite: "lax",
  });

  const callbackUrl = process.env.GITHUB_OAUTH_CALLBACK_URL || `${process.env.BACKEND_URL}/api/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,read:user&state=${state}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
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

    res.redirect(`${process.env.FRONTEND_URL}/settings?github=connected`);
  } catch (err) {
    console.error("GitHub callback error:", err);
    res.redirect(`${process.env.FRONTEND_URL}/settings?github=error`);
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

    const body = connectRepoSchema.parse(req.body);

    const project = await db.project.findFirst({
      where: { id: body.projectId, workspaceId: workspace.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const ghConn = await db.gitHubConnection.findUnique({
      where: { workspaceId: workspace.id },
    });
    if (!ghConn) throw new AppError("GitHub not connected", 400, "GITHUB_NOT_CONNECTED");

    const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/github`;

    let webhookId: number | null = null;
    try {
      webhookId = await githubService.registerWebhook(
        ghConn.accessTokenEncrypted,
        body.repoFullName,
        webhookUrl
      );
    } catch (webhookErr: unknown) {
      const axiosErr = webhookErr as { response?: { status: number } };
      if (axiosErr.response?.status === 403) {
        console.warn(`Webhook registration failed for ${body.repoFullName} — insufficient permissions`);
      } else {
        throw webhookErr;
      }
    }

    const [owner, repoName] = body.repoFullName.split("/");
    const repoData = await import("axios").then((m) =>
      m.default.get(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: { Authorization: `token ${require("../lib/crypto").decrypt(ghConn.accessTokenEncrypted)}`, Accept: "application/vnd.github.v3+json" },
      }).catch(() => ({ data: { id: 0 } }))
    );

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
