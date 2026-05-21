import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { sendMagicLink } from "../services/emailService.js";

const router = Router({ mergeParams: true });

async function getWorkspace(userId: string) {
  const ws = await db.workspace.findUnique({ where: { ownerId: userId } });
  if (!ws) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return ws;
}

router.get("/:projectId/clients", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const accesses = await db.clientProjectAccess.findMany({
      where: { projectId: project.id },
      include: {
        client: true,
        project: { include: { invitations: { where: { projectId: project.id } } } },
      },
    });

    const now = new Date();
    const result = await Promise.all(
      accesses.map(async (access) => {
        const invitation = await db.clientInvitation.findFirst({
          where: { clientId: access.clientId, projectId: project.id },
        });
        let status: "PENDING" | "ACTIVE" | "EXPIRED";
        if (access.revokedAt) {
          status = "EXPIRED";
        } else if (invitation?.acceptedAt) {
          status = "ACTIVE";
        } else if (invitation && now > invitation.expiresAt) {
          status = "EXPIRED";
        } else {
          status = "PENDING";
        }
        return { ...access.client, status };
      })
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

const inviteSchema = z.object({ email: z.string().email() });

router.post("/:projectId/invite", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const { email } = inviteSchema.parse(req.body);

    let client = await db.client.findFirst({
      where: { workspaceId: ws.id, email },
    });
    if (!client) {
      client = await db.client.create({
        data: { workspaceId: ws.id, email },
      });
    }

    await db.clientProjectAccess.upsert({
      where: { clientId_projectId: { clientId: client.id, projectId: project.id } },
      update: { revokedAt: null },
      create: { clientId: client.id, projectId: project.id },
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tokenPayload = {
      clientId: client.id,
      projectId: project.id,
      workspaceId: ws.id,
      nonce: crypto.randomBytes(16).toString("hex"),
    };
    const token = jwt.sign(tokenPayload, process.env.SESSION_SECRET || "secret", {
      expiresIn: "7d",
    });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invitation = await db.clientInvitation.upsert({
      where: { clientId_projectId: { clientId: client.id, projectId: project.id } },
      update: { tokenHash, sentAt: new Date(), expiresAt, acceptedAt: null },
      create: { clientId: client.id, projectId: project.id, tokenHash, expiresAt },
    });

    const portalBase = process.env.CLIENT_PORTAL_BASE_URL || "https://portal.shipdesk.io";
    const domain = portalBase.replace("https://", "").replace("http://", "");
    const magicLinkUrl = `https://${ws.slug}.${domain}/auth/magic?token=${token}`;

    await sendMagicLink({
      to: email,
      clientName: client.name,
      magicLinkUrl,
      workspaceName: ws.name,
      agencyName: ws.agencyName,
    });

    res.json({ success: true, invitationId: invitation.id });
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/:projectId/clients/:clientId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const ws = await getWorkspace(req.userId!);
      const project = await db.project.findFirst({
        where: { id: req.params.projectId, workspaceId: ws.id },
      });
      if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

      await db.clientProjectAccess.updateMany({
        where: { clientId: req.params.clientId, projectId: project.id },
        data: { revokedAt: new Date() },
      });

      await db.clientSession.deleteMany({
        where: { clientId: req.params.clientId, workspaceId: ws.id },
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
