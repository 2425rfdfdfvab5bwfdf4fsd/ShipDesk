import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { sendTeamInvite } from "../services/emailService.js";
import { TeamActivityEvent } from "@prisma/client";

const router = Router();

const AGENCY_SEAT_LIMIT = 5;

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new AppError("SESSION_SECRET not configured", 500, "SERVER_ERROR");
  return s;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getEffectivePlan(plan: string, lsSub: string | null, trialEndsAt: Date | null): string {
  // Admin-set plans always take precedence over subscription/trial state
  if (plan === "SOLO" || plan === "AGENCY") return plan;
  if (lsSub) return plan;
  if (trialEndsAt && new Date(trialEndsAt) > new Date()) return "STARTER";
  return "FREE";
}

async function getWorkspaceForRequest(req: AuthRequest) {
  if (!req.workspaceId) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  const workspace = await db.workspace.findUnique({ where: { id: req.workspaceId } });
  if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return workspace;
}

async function logActivity(
  workspaceId: string,
  actorId: string,
  actorName: string,
  event: TeamActivityEvent,
  targetEmail?: string,
  targetName?: string
) {
  try {
    await db.teamActivity.create({
      data: { workspaceId, actorId, actorName, event, targetEmail, targetName },
    });
  } catch {
    // non-fatal — don't let logging failures break the request
  }
}

// ─── GET / ────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await getWorkspaceForRequest(req);

    const [members, invitations] = await Promise.all([
      db.workspaceMember.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { joinedAt: "asc" },
      }),
      db.teamInvitation.findMany({
        where: { workspaceId: workspace.id, status: "PENDING" },
        orderBy: { invitedAt: "desc" },
      }),
    ]);

    const memberUserIds = members.map((m) => m.userId);
    const memberUsers = memberUserIds.length
      ? await db.user.findMany({ where: { id: { in: memberUserIds } } })
      : [];
    const userMap = Object.fromEntries(memberUsers.map((u) => [u.id, u]));
    const ownerUser = await db.user.findUnique({ where: { id: workspace.ownerId } });

    const currentMember = members.find((m) => m.userId === req.userId);
    const currentUserRole =
      workspace.ownerId === req.userId ? "OWNER" : currentMember?.role ?? null;

    res.json({
      owner: ownerUser
        ? {
            id: ownerUser.id,
            name: ownerUser.name,
            email: ownerUser.email,
            avatarUrl: ownerUser.avatarUrl,
            role: "OWNER",
            title: null,
            joinedAt: ownerUser.createdAt,
          }
        : null,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: userMap[m.userId]?.name ?? "Unknown",
        email: userMap[m.userId]?.email ?? "",
        avatarUrl: userMap[m.userId]?.avatarUrl ?? null,
        role: m.role,
        title: m.title ?? null,
        joinedAt: m.joinedAt,
      })),
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        invitedAt: inv.invitedAt,
        expiresAt: inv.expiresAt,
      })),
      seatLimit: AGENCY_SEAT_LIMIT,
      currentUserRole,
      currentMemberId: currentMember?.id ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /activity ────────────────────────────────────────────────────────────
router.get("/activity", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await getWorkspaceForRequest(req);
    const activities = await db.teamActivity.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

// ─── POST /invite ─────────────────────────────────────────────────────────────
router.post("/invite", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await getWorkspaceForRequest(req);
    if (workspace.ownerId !== req.userId) {
      throw new AppError("Only the workspace owner can invite members", 403, "FORBIDDEN");
    }

    const effectivePlan = getEffectivePlan(workspace.plan, workspace.lsSubscriptionId, workspace.trialEndsAt);
    if (effectivePlan !== "AGENCY" || !workspace.lsSubscriptionId) {
      throw new AppError("Team seats require the Agency plan", 403, "PLAN_REQUIRED");
    }

    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const ownerUser = await db.user.findUnique({ where: { id: req.userId! } });
    if (ownerUser?.email === normalizedEmail) {
      throw new AppError("You cannot invite yourself", 400, "CANNOT_INVITE_SELF");
    }

    const memberCount = await db.workspaceMember.count({ where: { workspaceId: workspace.id } });
    if (memberCount + 1 >= AGENCY_SEAT_LIMIT) {
      throw new AppError(`Workspace is at the ${AGENCY_SEAT_LIMIT}-seat limit`, 422, "SEAT_LIMIT_REACHED");
    }

    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      const existingMember = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: existingUser.id } },
      });
      if (existingMember) throw new AppError("This person is already a member", 409, "ALREADY_MEMBER");
    }

    // check if there was already a pending invite (resend scenario)
    const existingInvite = await db.teamInvitation.findUnique({
      where: { workspaceId_email: { workspaceId: workspace.id, email: normalizedEmail } },
    });
    const isResend = !!existingInvite;

    const jwtPayload = { email: normalizedEmail, workspaceId: workspace.id, type: "team_invite" };
    const signedToken = jwt.sign(jwtPayload, getSessionSecret(), { expiresIn: "7d" });
    const signedHash = hashToken(signedToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.teamInvitation.upsert({
      where: { workspaceId_email: { workspaceId: workspace.id, email: normalizedEmail } },
      update: { tokenHash: signedHash, invitedBy: req.userId!, expiresAt, status: "PENDING", invitedAt: new Date(), acceptedAt: null },
      create: { workspaceId: workspace.id, email: normalizedEmail, tokenHash: signedHash, invitedBy: req.userId!, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;
    const joinUrl = `${frontendUrl}/team/join?token=${encodeURIComponent(signedToken)}`;

    await sendTeamInvite({
      to: normalizedEmail,
      inviterName: ownerUser?.name ?? workspace.name,
      workspaceName: workspace.name,
      agencyName: workspace.agencyName,
      joinUrl,
    });

    await logActivity(
      workspace.id,
      req.userId!,
      ownerUser?.name ?? "Owner",
      isResend ? "INVITE_RESENT" : "INVITE_SENT",
      normalizedEmail
    );

    res.status(201).json({ ok: true, isResend });
  } catch (err) {
    next(err);
  }
});

// ─── POST /invite-link ────────────────────────────────────────────────────────
// Generate an invite link without sending an email (owner can share manually)
router.post("/invite-link", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await getWorkspaceForRequest(req);
    if (workspace.ownerId !== req.userId) {
      throw new AppError("Only the workspace owner can generate invite links", 403, "FORBIDDEN");
    }

    const effectivePlan = getEffectivePlan(workspace.plan, workspace.lsSubscriptionId, workspace.trialEndsAt);
    if (effectivePlan !== "AGENCY" || !workspace.lsSubscriptionId) {
      throw new AppError("Team seats require the Agency plan", 403, "PLAN_REQUIRED");
    }

    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const ownerUser = await db.user.findUnique({ where: { id: req.userId! } });
    if (ownerUser?.email === normalizedEmail) {
      throw new AppError("You cannot invite yourself", 400, "CANNOT_INVITE_SELF");
    }

    const memberCount = await db.workspaceMember.count({ where: { workspaceId: workspace.id } });
    if (memberCount + 1 >= AGENCY_SEAT_LIMIT) {
      throw new AppError(`Workspace is at the ${AGENCY_SEAT_LIMIT}-seat limit`, 422, "SEAT_LIMIT_REACHED");
    }

    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      const existingMember = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: existingUser.id } },
      });
      if (existingMember) throw new AppError("This person is already a member", 409, "ALREADY_MEMBER");
    }

    const jwtPayload = { email: normalizedEmail, workspaceId: workspace.id, type: "team_invite" };
    const signedToken = jwt.sign(jwtPayload, getSessionSecret(), { expiresIn: "7d" });
    const signedHash = hashToken(signedToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.teamInvitation.upsert({
      where: { workspaceId_email: { workspaceId: workspace.id, email: normalizedEmail } },
      update: { tokenHash: signedHash, invitedBy: req.userId!, expiresAt, status: "PENDING", invitedAt: new Date(), acceptedAt: null },
      create: { workspaceId: workspace.id, email: normalizedEmail, tokenHash: signedHash, invitedBy: req.userId!, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;
    const joinUrl = `${frontendUrl}/team/join?token=${encodeURIComponent(signedToken)}`;

    await logActivity(workspace.id, req.userId!, ownerUser?.name ?? "Owner", "INVITE_SENT", normalizedEmail);

    res.status(201).json({ joinUrl });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /members/:memberId/title ───────────────────────────────────────────
router.patch("/members/:memberId/title", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await getWorkspaceForRequest(req);
    const member = await db.workspaceMember.findUnique({ where: { id: req.params.memberId } });
    if (!member || member.workspaceId !== workspace.id) {
      throw new AppError("Member not found", 404, "NOT_FOUND");
    }

    // owner can set any member's title; members can only update their own
    if (workspace.ownerId !== req.userId && member.userId !== req.userId) {
      throw new AppError("You can only update your own title", 403, "FORBIDDEN");
    }

    const { title } = z.object({ title: z.string().max(60).nullable() }).parse(req.body);
    const updated = await db.workspaceMember.update({
      where: { id: req.params.memberId },
      data: { title: title ?? null },
    });
    res.json({ ok: true, title: updated.title });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /members/:memberId ────────────────────────────────────────────────
router.delete("/members/:memberId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await getWorkspaceForRequest(req);
    if (workspace.ownerId !== req.userId) {
      throw new AppError("Only the workspace owner can remove members", 403, "FORBIDDEN");
    }

    const member = await db.workspaceMember.findUnique({ where: { id: req.params.memberId } });
    if (!member || member.workspaceId !== workspace.id) {
      throw new AppError("Member not found", 404, "NOT_FOUND");
    }

    const removedUser = await db.user.findUnique({ where: { id: member.userId } });
    const actorUser = await db.user.findUnique({ where: { id: req.userId! } });

    await db.workspaceMember.delete({ where: { id: req.params.memberId } });

    await logActivity(
      workspace.id,
      req.userId!,
      actorUser?.name ?? "Owner",
      "MEMBER_REMOVED",
      removedUser?.email,
      removedUser?.name
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /invitations/:invitationId ───────────────────────────────────────
router.delete("/invitations/:invitationId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await getWorkspaceForRequest(req);
    if (workspace.ownerId !== req.userId) {
      throw new AppError("Only the workspace owner can cancel invitations", 403, "FORBIDDEN");
    }

    const invitation = await db.teamInvitation.findUnique({ where: { id: req.params.invitationId } });
    if (!invitation || invitation.workspaceId !== workspace.id) {
      throw new AppError("Invitation not found", 404, "NOT_FOUND");
    }

    const actorUser = await db.user.findUnique({ where: { id: req.userId! } });
    await db.teamInvitation.update({
      where: { id: req.params.invitationId },
      data: { status: "REVOKED" },
    });

    await logActivity(
      workspace.id,
      req.userId!,
      actorUser?.name ?? "Owner",
      "INVITE_CANCELLED",
      invitation.email
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /leave ────────────────────────────────────────────────────────────
// Members can voluntarily leave the workspace
router.delete("/leave", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await getWorkspaceForRequest(req);
    if (workspace.ownerId === req.userId) {
      throw new AppError("Workspace owners cannot leave their own workspace", 400, "CANNOT_LEAVE");
    }

    const member = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: req.userId! } },
    });
    if (!member) throw new AppError("You are not a member of this workspace", 404, "NOT_FOUND");

    const leavingUser = await db.user.findUnique({ where: { id: req.userId! } });
    await db.workspaceMember.delete({ where: { id: member.id } });

    await logActivity(
      workspace.id,
      req.userId!,
      leavingUser?.name ?? "Member",
      "MEMBER_LEFT",
      leavingUser?.email,
      leavingUser?.name
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── POST /join ───────────────────────────────────────────────────────────────
router.post("/join", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);

    let payload: { email: string; workspaceId: string; type: string };
    try {
      payload = jwt.verify(token, getSessionSecret()) as typeof payload;
    } catch {
      throw new AppError("Invalid or expired invite link", 401, "INVALID_TOKEN");
    }

    if (payload.type !== "team_invite") {
      throw new AppError("Invalid token type", 401, "INVALID_TOKEN");
    }

    const tokenHash = hashToken(token);
    const invitation = await db.teamInvitation.findUnique({ where: { tokenHash } });
    if (!invitation || invitation.status !== "PENDING") {
      throw new AppError("This invite link has already been used or revoked", 401, "LINK_USED");
    }
    if (new Date() > invitation.expiresAt) {
      throw new AppError("This invite link has expired", 401, "LINK_EXPIRED");
    }

    const currentUser = await db.user.findUnique({ where: { id: req.userId! } });
    if (!currentUser) throw new AppError("User not found", 404, "NOT_FOUND");
    if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new AppError("This invite was sent to a different email address", 403, "EMAIL_MISMATCH");
    }

    const existing = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: req.userId! } },
    });
    if (!existing) {
      await db.workspaceMember.create({
        data: { workspaceId: invitation.workspaceId, userId: req.userId!, role: invitation.role },
      });
    }

    await db.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    await logActivity(
      invitation.workspaceId,
      req.userId!,
      currentUser.name,
      "MEMBER_JOINED",
      currentUser.email,
      currentUser.name
    );

    res.json({ ok: true, workspaceId: invitation.workspaceId });
  } catch (err) {
    next(err);
  }
});

export default router;
