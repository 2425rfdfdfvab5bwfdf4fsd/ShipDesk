import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sanitizeHtml from "sanitize-html";
import { db } from "../lib/prisma.js";
import { requireClientAuth, ClientAuthRequest } from "../middleware/clientAuth.js";
import { AppError } from "../lib/errors.js";
import { brandingLimiter, magicLinkLimiter, messageLimiter } from "../middleware/rateLimiter.js";
import { generateUploadSignature, deleteAsset } from "../services/cloudinaryService.js";
import { createPaymentLink } from "../services/lemonSqueezyService.js";
import { sendMessageNotification, sendScopeChangeNotification } from "../services/emailService.js";

const router = Router();

const ALLOWED_HTML = {
  allowedTags: ["b", "strong", "i", "em", "u", "ul", "ol", "li", "p", "br"],
  allowedAttributes: {},
};

router.get("/:workspaceSlug/branding", brandingLimiter, async (req, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { slug: req.params.workspaceSlug },
      select: { logoUrl: true, primaryColor: true, agencyName: true },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
    res.json(workspace);
  } catch (err) {
    next(err);
  }
});

router.post("/auth/magic", magicLinkLimiter, async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);

    let decoded: { clientId: string; projectId: string; workspaceId: string };
    try {
      decoded = jwt.verify(token, process.env.SESSION_SECRET || "secret") as typeof decoded;
    } catch {
      throw new AppError("Magic link expired or invalid", 401, "LINK_EXPIRED");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const invitation = await db.clientInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation) throw new AppError("Link superseded", 401, "LINK_SUPERSEDED");
    if (new Date() > invitation.expiresAt) {
      throw new AppError("Link expired", 401, "LINK_EXPIRED");
    }

    const access = await db.clientProjectAccess.findFirst({
      where: {
        clientId: decoded.clientId,
        projectId: decoded.projectId,
        revokedAt: null,
      },
    });
    if (!access) throw new AppError("Access revoked", 401, "ACCESS_REVOKED");

    await db.clientInvitation.update({
      where: { tokenHash },
      data: { acceptedAt: new Date() },
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await db.clientSession.create({
      data: {
        clientId: decoded.clientId,
        workspaceId: decoded.workspaceId,
        expiresAt,
      },
    });

    const allAccess = await db.clientProjectAccess.findMany({
      where: { clientId: decoded.clientId, revokedAt: null },
      select: { projectId: true },
    });

    res.cookie("shipdesk_client_session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    });

    res.json({
      clientId: decoded.clientId,
      projectIds: allAccess.map((a) => a.projectId),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await db.clientSession.delete({ where: { id: req.sessionId! } });
    res.clearCookie("shipdesk_client_session");
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get("/projects", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    const accesses = await db.clientProjectAccess.findMany({
      where: { clientId: req.clientId!, revokedAt: null },
      include: { project: true },
    });
    res.json(accesses.map((a) => a.project));
  } catch (err) {
    next(err);
  }
});

async function assertClientProjectAccess(clientId: string, projectId: string) {
  const access = await db.clientProjectAccess.findFirst({
    where: { clientId, projectId, revokedAt: null },
  });
  if (!access) throw new AppError("Forbidden", 403, "FORBIDDEN");
  return access;
}

router.get("/projects/:id", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const project = await db.project.findUnique({ where: { id: req.params.id } });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id/reports", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const reports = await db.report.findMany({
      where: { projectId: req.params.id, status: "PUBLISHED" },
      select: {
        id: true, projectId: true, weekStartDate: true, weekEndDate: true,
        title: true, status: true, generatedAt: true, publishedAt: true, generatedBy: true,
      },
      orderBy: { publishedAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id/reports/:reportId", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const report = await db.report.findFirst({
      where: { id: req.params.reportId, projectId: req.params.id },
    });
    if (!report || report.status !== "PUBLISHED") {
      throw new AppError("Report not found", 404, "NOT_FOUND");
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id/files", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const files = await db.projectFile.findMany({
      where: { projectId: req.params.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    res.json(files);
  } catch (err) {
    next(err);
  }
});

const fileRecordSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  cloudinaryPublicId: z.string(),
  cloudinarySecureUrl: z.string().url(),
});

router.post("/projects/:id/files", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const fileCount = await db.projectFile.count({
      where: { projectId: req.params.id, deletedAt: null },
    });
    if (fileCount >= 500) throw new AppError("File limit reached", 422, "FILE_LIMIT_REACHED");

    const body = fileRecordSchema.parse(req.body);
    const client = await db.client.findUnique({ where: { id: req.clientId! } });

    const file = await db.projectFile.create({
      data: {
        projectId: req.params.id,
        uploadedBy: req.clientId!,
        uploaderType: "CLIENT",
        uploaderName: client?.name || client?.email || "Client",
        ...body,
      },
    });
    res.status(201).json(file);
  } catch (err) {
    next(err);
  }
});

router.delete("/projects/:id/files/:fileId", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const file = await db.projectFile.findFirst({
      where: { id: req.params.fileId, projectId: req.params.id, deletedAt: null },
    });
    if (!file) throw new AppError("File not found", 404, "NOT_FOUND");
    if (file.uploadedBy !== req.clientId || file.uploaderType !== "CLIENT") {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    await deleteAsset(file.cloudinaryPublicId).catch(console.error);
    await db.projectFile.update({
      where: { id: file.id },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id/messages", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string | undefined;

    const where: Record<string, unknown> = { projectId: req.params.id };
    if (before) where.createdAt = { lt: new Date(before) };

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? result[result.length - 1].createdAt.toISOString() : null;

    res.json({ messages: result, nextCursor });
  } catch (err) {
    next(err);
  }
});

router.post("/projects/:id/messages", requireClientAuth, messageLimiter, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const body = z.object({ body: z.string().min(1).max(5000) }).parse(req.body);
    const client = await db.client.findUnique({ where: { id: req.clientId! } });

    const message = await db.message.create({
      data: {
        projectId: req.params.id,
        senderId: req.clientId!,
        senderType: "CLIENT",
        senderName: client?.name || client?.email || "Client",
        body: body.body.replace(/<[^>]*>/g, ""),
      },
    });

    const project = await db.project.findUnique({
      where: { id: req.params.id },
      include: { workspace: { include: { owner: true } } },
    });

    if (project) {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const notifLog = await db.messageNotificationLog.findFirst({
        where: {
          projectId: req.params.id,
          recipientType: "DEVELOPER",
          recipientId: project.workspace.ownerId,
        },
      });

      if (!notifLog || notifLog.lastNotificationSentAt < fiveMinutesAgo) {
        const portalBase = process.env.FRONTEND_URL || "https://app.shipdesk.io";
        sendMessageNotification({
          to: project.workspace.owner.email,
          recipientName: project.workspace.owner.name,
          projectName: project.name,
          senderName: client?.name || client?.email || "Client",
          portalUrl: `${portalBase}/projects/${project.id}/messages`,
        }).catch(console.error);

        db.messageNotificationLog.upsert({
          where: {
            projectId_recipientType_recipientId: {
              projectId: req.params.id,
              recipientType: "DEVELOPER",
              recipientId: project.workspace.ownerId,
            },
          },
          update: { lastNotificationSentAt: now },
          create: {
            projectId: req.params.id,
            recipientType: "DEVELOPER",
            recipientId: project.workspace.ownerId,
            lastNotificationSentAt: now,
          },
        }).catch(console.error);
      }
    }

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

router.patch("/projects/:id/messages/read", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const result = await db.message.updateMany({
      where: { projectId: req.params.id, readByClientAt: null, senderType: "DEVELOPER" },
      data: { readByClientAt: new Date() },
    });
    res.json({ updated: result.count });
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id/invoices", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const invoices = await db.invoice.findMany({
      where: { projectId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id/scope-changes", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const scopeChanges = await db.scopeChange.findMany({
      where: { projectId: req.params.id, clientId: req.clientId! },
      orderBy: { createdAt: "desc" },
    });
    res.json(scopeChanges);
  } catch (err) {
    next(err);
  }
});

const scopeChangeSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(2000),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

router.post("/projects/:id/scope-changes", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    await assertClientProjectAccess(req.clientId!, req.params.id);
    const body = scopeChangeSchema.parse(req.body);

    const sc = await db.scopeChange.create({
      data: {
        projectId: req.params.id,
        clientId: req.clientId!,
        title: body.title,
        description: body.description.replace(/<[^>]*>/g, ""),
        urgency: body.urgency,
      },
    });

    const project = await db.project.findUnique({
      where: { id: req.params.id },
      include: { workspace: { include: { owner: true } } },
    });
    if (project) {
      const portalBase = process.env.FRONTEND_URL || "https://app.shipdesk.io";
      sendScopeChangeNotification({
        to: project.workspace.owner.email,
        recipientName: project.workspace.owner.name,
        projectName: project.name,
        scopeChangeTitle: body.title,
        portalUrl: `${portalBase}/scope-changes`,
        type: "new_request",
      }).catch(console.error);
    }

    res.status(201).json(sc);
  } catch (err) {
    next(err);
  }
});

router.patch("/scope-changes/:id/respond", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    const sc = await db.scopeChange.findUnique({ where: { id: req.params.id } });
    if (!sc) throw new AppError("Scope change not found", 404, "NOT_FOUND");
    if (sc.clientId !== req.clientId) throw new AppError("Forbidden", 403, "FORBIDDEN");

    const { decision } = z.object({ decision: z.enum(["APPROVED", "DECLINED"]) }).parse(req.body);

    const updateData: Record<string, unknown> = {
      status: decision,
      respondedAt: new Date(),
    };

    if (decision === "APPROVED" && sc.quotePrice) {
      try {
        const client = await db.client.findUnique({ where: { id: req.clientId! } });
        const paymentUrl = await createPaymentLink({
          title: sc.title,
          amount: Number(sc.quotePrice),
          currency: sc.quoteCurrency || "USD",
          buyerEmail: client?.email || "",
          buyerName: client?.name || null,
          customData: { scopeChangeId: sc.id, projectId: sc.projectId },
        });
        updateData.paymentUrl = paymentUrl;
      } catch (err) {
        console.error("Failed to create Lemon Squeezy payment link:", err);
      }
    }

    const updated = await db.scopeChange.update({
      where: { id: sc.id },
      data: updateData,
    });

    const project = await db.project.findUnique({
      where: { id: sc.projectId },
      include: { workspace: { include: { owner: true } } },
    });
    if (project) {
      const portalBase = process.env.FRONTEND_URL || "https://app.shipdesk.io";
      sendScopeChangeNotification({
        to: project.workspace.owner.email,
        recipientName: project.workspace.owner.name,
        projectName: project.name,
        scopeChangeTitle: sc.title,
        portalUrl: `${portalBase}/scope-changes`,
        type: decision === "APPROVED" ? "approved" : "declined",
      }).catch(console.error);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get("/files/upload-signature", requireClientAuth, async (req: ClientAuthRequest, res, next) => {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) throw new AppError("projectId required", 400, "VALIDATION_ERROR");
    await assertClientProjectAccess(req.clientId!, projectId);
    const signature = generateUploadSignature(`shipdesk/files/${projectId}/`);
    res.json(signature);
  } catch (err) {
    next(err);
  }
});

export default router;
