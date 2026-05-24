import { Router, Response, NextFunction } from "express";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

async function requireAdminEmail(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const allowedEmail = process.env.ADMIN_EMAIL;
  if (!allowedEmail) {
    res.status(503).json({ error: "ADMIN_EMAIL_NOT_CONFIGURED" });
    return;
  }
  try {
    const user = await db.user.findUnique({ where: { id: req.userId } });
    if (!user || user.email.toLowerCase().trim() !== allowedEmail.toLowerCase().trim()) {
      res.status(403).json({ error: "FORBIDDEN" });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

const adminGuard = [requireAuth, requireAdminEmail];

router.get("/stats", ...adminGuard, async (_req, res, next) => {
  try {
    const [
      userCount,
      workspaceCount,
      projectCount,
      activeProjectCount,
      reportCount,
      publishedReportCount,
      invoiceCount,
      paidInvoiceCount,
      paidInvoiceSum,
      clientCount,
      githubConnectionCount,
      scopeChangeCount,
      messageCount,
    ] = await Promise.all([
      db.user.count(),
      db.workspace.count(),
      db.project.count(),
      db.project.count({ where: { status: "ACTIVE" } }),
      db.report.count(),
      db.report.count({ where: { status: "PUBLISHED" } }),
      db.invoice.count(),
      db.invoice.count({ where: { status: "PAID" } }),
      db.invoice.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      db.client.count(),
      db.gitHubConnection.count(),
      db.scopeChange.count(),
      db.message.count(),
    ]);

    res.json({
      users: userCount,
      workspaces: workspaceCount,
      projects: projectCount,
      activeProjects: activeProjectCount,
      reports: reportCount,
      publishedReports: publishedReportCount,
      invoices: invoiceCount,
      paidInvoices: paidInvoiceCount,
      totalRevenue: Number(paidInvoiceSum._sum.amount ?? 0),
      clients: clientCount,
      githubConnections: githubConnectionCount,
      scopeChanges: scopeChangeCount,
      messages: messageCount,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/users", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          workspace: {
            include: {
              _count: { select: { projects: true, clients: true } },
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/projects", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const where = status ? { status: status as "ACTIVE" | "PAUSED" | "COMPLETED" } : {};

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          workspace: { select: { slug: true, name: true, agencyName: true } },
          _count: { select: { reports: true, invoices: true, clientAccess: true } },
        },
      }),
      db.project.count({ where }),
    ]);

    res.json({ projects, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/reports", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      db.report.findMany({
        skip,
        take: limit,
        orderBy: { generatedAt: "desc" },
        include: {
          project: {
            select: {
              name: true,
              workspace: { select: { slug: true, name: true } },
            },
          },
        },
      }),
      db.report.count(),
    ]);

    res.json({ reports, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/invoices", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const where = status ? { status: status as "UNPAID" | "PAID" | "OVERDUE" } : {};

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            select: {
              name: true,
              workspace: { select: { slug: true, name: true } },
            },
          },
        },
      }),
      db.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
