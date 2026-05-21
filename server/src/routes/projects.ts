import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
});

const STATUS_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ["PAUSED", "COMPLETED"],
  PAUSED: ["ACTIVE", "COMPLETED"],
  COMPLETED: [],
};

async function getWorkspace(userId: string) {
  const ws = await db.workspace.findUnique({ where: { ownerId: userId } });
  if (!ws) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return ws;
}

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const statusFilter = req.query.status as string | undefined;

    const projects = await db.project.findMany({
      where: {
        workspaceId: ws.id,
        status: statusFilter
          ? (statusFilter as "ACTIVE" | "PAUSED" | "COMPLETED")
          : { not: "COMPLETED" },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const body = createProjectSchema.parse(req.body);

    const activeCount = await db.project.count({
      where: { workspaceId: ws.id, status: { not: "COMPLETED" } },
    });
    if (activeCount >= 50) {
      throw new AppError(
        "Active project limit reached",
        422,
        "ACTIVE_PROJECT_LIMIT_REACHED"
      );
    }

    const project = await db.project.create({
      data: {
        workspaceId: ws.id,
        name: body.name,
        description: body.description || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        status: body.status || "ACTIVE",
      },
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.id, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const body = updateProjectSchema.parse(req.body);

    const project = await db.project.findFirst({
      where: { id: req.params.id, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    if (body.status && body.status !== project.status) {
      const allowed = STATUS_TRANSITIONS[project.status] || [];
      if (!allowed.includes(body.status)) {
        throw new AppError(
          "Invalid status transition",
          422,
          "CANNOT_REACTIVATE_COMPLETED_PROJECT"
        );
      }
    }

    const updated = await db.project.update({
      where: { id: project.id },
      data: body,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.id, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const paidInvoice = await db.invoice.findFirst({
      where: { projectId: project.id, status: "PAID" },
    });
    if (paidInvoice) {
      throw new AppError(
        "Cannot delete project with paid invoices",
        409,
        "PROJECT_HAS_PAID_INVOICES"
      );
    }

    await db.project.delete({ where: { id: project.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
