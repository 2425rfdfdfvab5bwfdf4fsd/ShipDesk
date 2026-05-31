import { Router, Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { verifyToken } from "@clerk/backend";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { encrypt } from "../lib/crypto.js";
import * as linearService from "../services/linearService.js";

const router = Router();

function getAppBase(req: Request): string {
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return (process.env.FRONTEND_URL || "http://localhost:5000").replace(/\/$/, "");
}

function getCallbackUrl(req: Request): string {
  if (process.env.LINEAR_OAUTH_CALLBACK_URL) return process.env.LINEAR_OAUTH_CALLBACK_URL;
  const apiBase = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : (process.env.BACKEND_URL || `http://localhost:3000`).replace(/\/$/, "");
  return `${apiBase}/api/linear/callback`;
}

router.get("/status", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
      include: { linearConn: true },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    if (!workspace.linearConn) {
      res.json({ connected: false, organizationName: null });
      return;
    }

    let organizationName: string | null = null;
    try {
      const teams = await linearService.fetchLinearTeams(workspace.linearConn.accessTokenEncrypted);
      organizationName = workspace.linearConn.linearOrganizationId ? (teams.length > 0 ? workspace.linearConn.linearOrganizationId : null) : null;
    } catch {
      organizationName = null;
    }

    res.json({
      connected: true,
      linearUserId: workspace.linearConn.linearUserId,
      linearOrganizationId: workspace.linearConn.linearOrganizationId,
      organizationName: workspace.linearConn.linearOrganizationId,
      connectedAt: workspace.linearConn.connectedAt,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/teams", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
      include: { linearConn: true },
    });
    if (!workspace?.linearConn) throw new AppError("Linear not connected", 400, "NOT_CONNECTED");

    const teams = await linearService.fetchLinearTeams(workspace.linearConn.accessTokenEncrypted);
    res.json({ teams });
  } catch (err) {
    next(err);
  }
});

router.get("/connect", async (req: Request, res: Response) => {
  const clientId = process.env.LINEAR_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: "LINEAR_CLIENT_ID not configured" });
    return;
  }

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

  // Agency plan enforcement
  const connectWorkspace = await db.workspace.findUnique({
    where: { ownerId: userId },
    select: { plan: true, lsSubscriptionId: true, adminPlanOverride: true },
  });
  const isConnectAgency =
    connectWorkspace?.adminPlanOverride ||
    (connectWorkspace?.plan === "AGENCY" && !!connectWorkspace.lsSubscriptionId);
  if (!isConnectAgency) {
    res.redirect(`${getAppBase(req)}/settings?tab=integrations&linear=error`);
    return;
  }

  const state = jwt.sign(
    { userId, nonce: crypto.randomBytes(8).toString("hex") },
    process.env.SESSION_SECRET || "secret",
    { expiresIn: "10m" }
  );

  const isHttps =
    req.secure ||
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0].trim() === "https";

  res.cookie("linear_oauth_state", state, {
    httpOnly: true,
    secure: isHttps,
    maxAge: 10 * 60 * 1000,
    sameSite: "lax",
  });

  const callbackUrl = getCallbackUrl(req);
  const url = linearService.getLinearAuthUrl(clientId, callbackUrl, state);
  res.redirect(url);
});

router.get("/callback", async (req: Request, res: Response) => {
  const appBase = getAppBase(req);

  try {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (error || !code || !state) {
      res.redirect(`${appBase}/settings?tab=integrations&linear=error`);
      return;
    }

    const cookieState = req.cookies?.linear_oauth_state;
    if (!cookieState || cookieState !== state) {
      res.redirect(`${appBase}/settings?tab=integrations&linear=error`);
      return;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(state, process.env.SESSION_SECRET || "secret") as { userId: string };
    } catch {
      res.redirect(`${appBase}/settings?tab=integrations&linear=error`);
      return;
    }

    res.clearCookie("linear_oauth_state");

    const tokenData = await linearService.exchangeCodeForToken(code);
    const accessToken = tokenData.access_token;

    const viewer = await linearService.getLinearViewer(accessToken);

    const encryptedAccess = encrypt(accessToken);
    const encryptedRefresh = encrypt(tokenData.refresh_token || "");
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const workspace = await db.workspace.findUnique({ where: { ownerId: decoded.userId } });
    if (!workspace) {
      res.redirect(`${appBase}/settings?tab=integrations&linear=error`);
      return;
    }

    // Agency plan enforcement (double-check at callback to prevent replay)
    const isCallbackAgency =
      workspace.adminPlanOverride ||
      (workspace.plan === "AGENCY" && !!workspace.lsSubscriptionId);
    if (!isCallbackAgency) {
      res.redirect(`${appBase}/settings?tab=integrations&linear=error`);
      return;
    }

    await db.linearConnection.upsert({
      where: { workspaceId: workspace.id },
      update: {
        linearUserId: viewer.id,
        linearOrganizationId: viewer.organizationId,
        accessTokenEncrypted: encryptedAccess,
        refreshTokenEncrypted: encryptedRefresh,
        tokenExpiresAt: expiresAt,
      },
      create: {
        workspaceId: workspace.id,
        linearUserId: viewer.id,
        linearOrganizationId: viewer.organizationId,
        accessTokenEncrypted: encryptedAccess,
        refreshTokenEncrypted: encryptedRefresh,
        tokenExpiresAt: expiresAt,
      },
    });

    res.redirect(`${appBase}/settings?tab=integrations&linear=connected`);
  } catch (err) {
    console.error("Linear callback error:", err);
    res.redirect(`${appBase}/settings?tab=integrations&linear=error`);
  }
});

router.delete("/disconnect", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({ where: { ownerId: req.userId! } });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    await db.linearConnection.deleteMany({ where: { workspaceId: workspace.id } });

    await db.project.updateMany({
      where: { workspaceId: workspace.id },
      data: { linearTeamId: null },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
