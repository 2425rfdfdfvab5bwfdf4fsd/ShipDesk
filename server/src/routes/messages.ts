import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { messageLimiter } from "../middleware/rateLimiter.js";
import { sendMessageNotification } from "../services/emailService.js";

const router = Router({ mergeParams: true });

const sendMessageSchema = z.object({
  body: z.string().min(1).max(5000).transform((s) => s.replace(/<[^>]*>/g, "")),
});

async function getWorkspace(userId: string) {
  const ws = await db.workspace.findUnique({ where: { ownerId: userId } });
  if (!ws) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return ws;
}

router.get("/:projectId/messages", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string | undefined;

    const where: Record<string, unknown> = { projectId: project.id };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore
      ? result[result.length - 1].createdAt.toISOString()
      : null;

    res.json({ messages: result, nextCursor });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:projectId/messages",
  requireAuth,
  messageLimiter,
  async (req: AuthRequest, res, next) => {
    try {
      const ws = await getWorkspace(req.userId!);
      const project = await db.project.findFirst({
        where: { id: req.params.projectId, workspaceId: ws.id },
        include: { workspace: true },
      });
      if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

      const body = sendMessageSchema.parse(req.body);
      const user = await db.user.findUnique({ where: { id: req.userId! } });

      const message = await db.message.create({
        data: {
          projectId: project.id,
          senderId: req.userId!,
          senderType: "DEVELOPER",
          senderName: user?.name || "Developer",
          body: body.body,
        },
      });

      const clientAccesses = await db.clientProjectAccess.findMany({
        where: { projectId: project.id, revokedAt: null },
        include: { client: true },
      });

      const portalBase = process.env.CLIENT_PORTAL_BASE_URL || "https://portal.shipdesk.io";
      const domain = portalBase.replace("https://", "").replace("http://", "");

      for (const access of clientAccesses) {
        const now = new Date();
        const notifLog = await db.messageNotificationLog.findFirst({
          where: {
            projectId: project.id,
            recipientType: "CLIENT",
            recipientId: access.client.id,
          },
        });

        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        if (!notifLog || notifLog.lastNotificationSentAt < fiveMinutesAgo) {
          try {
            await sendMessageNotification({
              to: access.client.email,
              recipientName: access.client.name,
              projectName: project.name,
              senderName: user?.name || "Developer",
              portalUrl: `https://${ws.slug}.${domain}/projects/${project.id}/messages`,
            });
            await db.messageNotificationLog.upsert({
              where: {
                projectId_recipientType_recipientId: {
                  projectId: project.id,
                  recipientType: "CLIENT",
                  recipientId: access.client.id,
                },
              },
              update: { lastNotificationSentAt: now },
              create: {
                projectId: project.id,
                recipientType: "CLIENT",
                recipientId: access.client.id,
                lastNotificationSentAt: now,
              },
            });
          } catch (err) {
            console.error("Failed to send message notification:", err);
          }
        }
      }

      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/:projectId/messages/read", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const result = await db.message.updateMany({
      where: {
        projectId: project.id,
        readByDeveloperAt: null,
        senderType: "CLIENT",
      },
      data: { readByDeveloperAt: new Date() },
    });

    res.json({ updated: result.count });
  } catch (err) {
    next(err);
  }
});

export default router;
