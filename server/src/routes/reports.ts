import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { generateWeeklyReport, ReportContent } from "../services/geminiService.js";
import { notifyClientsOfPublishedReport } from "../services/reportScheduler.js";

const router = Router();

function getWeekBounds(now = new Date()): { start: Date; end: Date } {
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

async function getWorkspace(userId: string) {
  const ws = await db.workspace.findUnique({ where: { ownerId: userId } });
  if (!ws) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return ws;
}

async function assertProjectAccess(projectId: string, workspaceId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId },
  });
  if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
  return project;
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

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        select: {
          id: true, projectId: true, weekStartDate: true, weekEndDate: true,
          title: true, status: true, generatedAt: true, publishedAt: true, generatedBy: true,
        },
        orderBy: { generatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.report.count({ where }),
    ]);

    res.json({ reports, total });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const report = await db.report.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!report) throw new AppError("Report not found", 404, "NOT_FOUND");
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/generate/:projectId",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const ws = await getWorkspace(req.userId!);
      const project = await assertProjectAccess(req.params.projectId, ws.id);

      if (!project.githubRepoId) {
        throw new AppError("No GitHub repo linked", 400, "NO_GITHUB_REPO");
      }

      const today = new Date().toISOString().split("T")[0];
      const log = await db.rateLimitLog.upsert({
        where: {
          projectId_action_date: {
            projectId: project.id,
            action: "MANUAL_REPORT_GENERATION",
            date: today,
          },
        },
        update: { count: { increment: 1 } },
        create: {
          projectId: project.id,
          action: "MANUAL_REPORT_GENERATION",
          date: today,
          count: 1,
        },
      });

      if (log.count > 10) {
        const midnight = new Date();
        midnight.setUTCDate(midnight.getUTCDate() + 1);
        midnight.setUTCHours(0, 0, 0, 0);
        throw new AppError("Rate limit exceeded", 429, "RATE_LIMIT_EXCEEDED");
      }

      const { start, end } = getWeekBounds();
      const events = await db.gitHubEvent.findMany({
        where: { projectId: project.id, receivedAt: { gte: start } },
      });

      const weekStart = start.toISOString().split("T")[0];
      const weekEndShort = end.toISOString().split("T")[0];
      const title = `This Week in ${project.name} — ${weekStart} to ${weekEndShort}`;

      const content = await generateWeeklyReport({
        projectName: project.name,
        weekStartDate: start,
        weekEndDate: end,
        githubEvents: events,
      });

      const report = await db.report.create({
        data: {
          projectId: project.id,
          weekStartDate: start,
          weekEndDate: end,
          title,
          content: content as object,
          status: "DRAFT",
          generatedBy: "MANUAL",
        },
      });

      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  }
);

const updateReportSchema = z.object({
  content: z.object({
    summary: z.string().nullable().optional(),
    highlights: z.array(z.string()).nullable().optional(),
    nextSteps: z.array(z.string()).nullable().optional(),
    rawMarkdown: z.string().optional(),
    generationWarning: z.string().nullable().optional(),
  }).optional(),
  status: z.literal("PUBLISHED").optional(),
});

router.patch("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const report = await db.report.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!report) throw new AppError("Report not found", 404, "NOT_FOUND");

    const body = updateReportSchema.parse(req.body);
    const updateData: Record<string, unknown> = {};

    if (body.content) {
      updateData.content = { ...(report.content as object), ...body.content };
    }
    if (body.status === "PUBLISHED") {
      updateData.status = "PUBLISHED";
      updateData.publishedAt = new Date();
    }

    const updated = await db.report.update({
      where: { id: report.id },
      data: updateData,
    });

    if (body.status === "PUBLISHED") {
      notifyClientsOfPublishedReport(report.id).catch(console.error);
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const report = await db.report.findFirst({
      where: { id: req.params.id, project: { workspaceId: ws.id } },
    });
    if (!report) throw new AppError("Report not found", 404, "NOT_FOUND");
    if (report.status === "PUBLISHED") {
      throw new AppError("Cannot delete published report", 409, "CANNOT_DELETE_PUBLISHED_REPORT");
    }
    await db.report.delete({ where: { id: report.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
