import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { createPaymentLink } from "../services/lemonSqueezyService.js";
import { sendInvoiceNotification } from "../services/emailService.js";

const router = Router();

const createInvoiceSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]),
  dueDate: z.string().datetime().optional(),
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
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      project: { workspaceId: ws.id },
    };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    res.json({ invoices, total });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const body = createInvoiceSchema.parse(req.body);

    const project = await db.project.findFirst({
      where: { id: body.projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const clientAccesses = await db.clientProjectAccess.findMany({
      where: { projectId: project.id, revokedAt: null },
      include: { client: true },
    });

    const firstClient = clientAccesses[0]?.client;

    let paymentUrl = "";
    try {
      paymentUrl = await createPaymentLink({
        title: body.title,
        amount: body.amount,
        currency: body.currency,
        buyerEmail: firstClient?.email || "",
        buyerName: firstClient?.name || null,
        customData: { projectId: project.id, workspaceId: ws.id },
      });
    } catch (err) {
      console.error("Lemon Squeezy checkout creation failed:", err);
      paymentUrl = "";
    }

    const invoice = await db.invoice.create({
      data: {
        projectId: project.id,
        title: body.title,
        description: body.description || null,
        amount: body.amount,
        currency: body.currency,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        paymentUrl,
      },
    });

    if (firstClient) {
      sendInvoiceNotification({
        to: firstClient.email,
        clientName: firstClient.name,
        invoiceTitle: body.title,
        amount: body.amount,
        currency: body.currency,
        paymentUrl,
        agencyName: ws.agencyName,
      }).catch(console.error);
    }

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const invoice = await db.invoice.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!invoice) throw new AppError("Invoice not found", 404, "NOT_FOUND");
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/mark-paid", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const invoice = await db.invoice.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!invoice) throw new AppError("Invoice not found", 404, "NOT_FOUND");

    const updated = await db.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const invoice = await db.invoice.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!invoice) throw new AppError("Invoice not found", 404, "NOT_FOUND");
    if (invoice.status === "PAID") {
      throw new AppError("Cannot delete paid invoice", 409, "CANNOT_DELETE_PAID_INVOICE");
    }
    await db.invoice.delete({ where: { id: invoice.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
