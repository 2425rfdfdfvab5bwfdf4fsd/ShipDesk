import { Router } from "express";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { createPaymentLink } from "../services/lemonSqueezyService.js";

const router = Router();

const ALLOWED_HTML = {
  allowedTags: ["b", "strong", "i", "em", "u", "ul", "ol", "li", "p", "br"],
  allowedAttributes: {},
};

const quoteSchema = z.object({
  quoteDescription: z.string().min(1).max(10000),
  quotePrice: z.number().positive(),
  quoteCurrency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]),
});

async function getWorkspace(userId: string) {
  const ws = await db.workspace.findUnique({ where: { ownerId: userId } });
  if (!ws) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return ws;
}

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const projectId = req.query.projectId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {
      project: { workspaceId: ws.id },
    };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const scopeChanges = await db.scopeChange.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(scopeChanges);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const sc = await db.scopeChange.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!sc) throw new AppError("Scope change not found", 404, "NOT_FOUND");
    res.json(sc);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/quote", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const sc = await db.scopeChange.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!sc) throw new AppError("Scope change not found", 404, "NOT_FOUND");

    const body = quoteSchema.parse(req.body);
    const sanitized = sanitizeHtml(body.quoteDescription, ALLOWED_HTML);

    const updated = await db.scopeChange.update({
      where: { id: sc.id },
      data: {
        status: "QUOTED",
        quotedAt: new Date(),
        quoteDescription: sanitized,
        quotePrice: body.quotePrice,
        quoteCurrency: body.quoteCurrency,
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/mark-paid", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const sc = await db.scopeChange.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!sc) throw new AppError("Scope change not found", 404, "NOT_FOUND");

    const updated = await db.scopeChange.update({
      where: { id: sc.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
