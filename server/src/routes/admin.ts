import { Router, Response, NextFunction } from "express";
import { createClerkClient } from "@clerk/backend";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Fallback so the panel works even if ADMIN_EMAIL isn't set in the environment.
// This matches the email hardcoded in AdminPage.tsx and AppShell.tsx.
const FALLBACK_ADMIN_EMAIL = "saifkhan13483@gmail.com";

let _clerkClient: ReturnType<typeof createClerkClient> | null = null;
function getClerkClient() {
  if (!_clerkClient) {
    _clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  }
  return _clerkClient;
}

async function requireAdminEmail(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const allowedEmail = (process.env.ADMIN_EMAIL ?? FALLBACK_ADMIN_EMAIL).toLowerCase().trim();
  try {
    // Ask Clerk directly for the user's current email — don't trust the DB cache.
    const clerkUser = await getClerkClient().users.getUser(req.clerkUserId!);
    const primaryAddr = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    );
    const userEmail = (
      primaryAddr?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      ""
    ).toLowerCase().trim();

    console.log(
      `[requireAdminEmail] clerkId=${req.clerkUserId} email="${userEmail}" allowed="${allowedEmail}" match=${userEmail === allowedEmail}`
    );

    if (!userEmail || userEmail !== allowedEmail) {
      res.status(403).json({ error: "FORBIDDEN", userEmail });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

const adminGuard = [requireAuth, requireAdminEmail];

// ── Stats ────────────────────────────────────────────────────────────────────
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
      onboardedCount,
      planDistributionRaw,
      linearConnectionCount,
      vercelConnectionCount,
      fileCount,
      teamMemberCount,
      githubEventCount,
      clientSessionCount,
      teamActivityCount,
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
      db.workspace.count({ where: { onboardingComplete: true } }),
      db.workspace.groupBy({ by: ["plan"], _count: { _all: true } }),
      db.linearConnection.count(),
      db.vercelConnection.count(),
      db.projectFile.count({ where: { deletedAt: null } }),
      db.workspaceMember.count(),
      db.gitHubEvent.count(),
      db.clientSession.count({ where: { expiresAt: { gt: new Date() } } }),
      db.teamActivity.count(),
    ]);

    const planDistribution: Record<string, number> = { FREE: 0, STARTER: 0, SOLO: 0, AGENCY: 0 };
    for (const row of planDistributionRaw) {
      planDistribution[row.plan] = row._count._all;
    }

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
      onboardedWorkspaces: onboardedCount,
      planDistribution,
      linearConnections: linearConnectionCount,
      vercelConnections: vercelConnectionCount,
      files: fileCount,
      teamMembers: teamMemberCount,
      githubEvents: githubEventCount,
      activeClientSessions: clientSessionCount,
      teamActivities: teamActivityCount,
    });
  } catch (err) {
    next(err);
  }
});

// ── Users ────────────────────────────────────────────────────────────────────
router.get("/users", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";
    const plan = (req.query.plan as string) || "";

    const validPlans = ["FREE", "STARTER", "SOLO", "AGENCY"];
    const planFilter = validPlans.includes(plan)
      ? { plan: plan as "FREE" | "STARTER" | "SOLO" | "AGENCY" }
      : {};

    const baseWhere = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const where =
      Object.keys(planFilter).length > 0
        ? { ...baseWhere, workspace: planFilter }
        : baseWhere;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          workspace: {
            include: {
              _count: { select: { projects: true, clients: true, members: true } },
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

// ── Projects ─────────────────────────────────────────────────────────────────
router.get("/projects", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const search = (req.query.search as string) || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { workspace: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          workspace: { select: { slug: true, name: true, agencyName: true } },
          _count: { select: { reports: true, invoices: true, clientAccess: true, messages: true, files: true } },
        },
      }),
      db.project.count({ where }),
    ]);

    res.json({ projects, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// ── Reports ───────────────────────────────────────────────────────────────────
router.get("/reports", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { project: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
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
      db.report.count({ where }),
    ]);

    res.json({ reports, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// ── Invoices ──────────────────────────────────────────────────────────────────
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

// ── Scope Changes ─────────────────────────────────────────────────────────────
router.get("/scope-changes", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const search = (req.query.search as string) || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { client: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [scopeChanges, total] = await Promise.all([
      db.scopeChange.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
        include: {
          project: {
            select: {
              name: true,
              workspace: { select: { slug: true, name: true, agencyName: true } },
            },
          },
          client: { select: { email: true, name: true } },
        },
      }),
      db.scopeChange.count({ where }),
    ]);

    res.json({ scopeChanges, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// ── Platform Activity Feed ────────────────────────────────────────────────────
router.get("/activity", ...adminGuard, async (_req, res, next) => {
  try {
    const LIMIT = 60;

    const [
      recentUsers,
      recentProjects,
      recentReports,
      recentMessages,
      recentScopeChanges,
      recentGithubEvents,
      recentInvoices,
      recentFiles,
      recentTeamActivities,
      recentClientSessions,
    ] = await Promise.all([
      db.user.findMany({
        take: LIMIT, orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      db.project.findMany({
        take: LIMIT, orderBy: { createdAt: "desc" },
        select: { id: true, name: true, createdAt: true, status: true, workspace: { select: { slug: true, name: true, agencyName: true } } },
      }),
      db.report.findMany({
        take: LIMIT, orderBy: { generatedAt: "desc" },
        select: { id: true, title: true, status: true, generatedBy: true, generatedAt: true, project: { select: { name: true, workspace: { select: { slug: true } } } } },
      }),
      db.message.findMany({
        take: LIMIT, orderBy: { createdAt: "desc" },
        select: { id: true, senderName: true, senderType: true, body: true, createdAt: true, project: { select: { name: true, workspace: { select: { slug: true } } } } },
      }),
      db.scopeChange.findMany({
        take: LIMIT, orderBy: { submittedAt: "desc" },
        select: { id: true, title: true, status: true, urgency: true, submittedAt: true, client: { select: { email: true, name: true } }, project: { select: { name: true, workspace: { select: { slug: true } } } } },
      }),
      db.gitHubEvent.findMany({
        take: LIMIT, orderBy: { receivedAt: "desc" },
        select: { id: true, eventType: true, repoFullName: true, status: true, receivedAt: true, project: { select: { name: true, workspace: { select: { slug: true } } } } },
      }),
      db.invoice.findMany({
        take: LIMIT, orderBy: { createdAt: "desc" },
        select: { id: true, title: true, amount: true, currency: true, status: true, createdAt: true, project: { select: { name: true, workspace: { select: { slug: true } } } } },
      }),
      db.projectFile.findMany({
        where: { deletedAt: null }, take: LIMIT, orderBy: { createdAt: "desc" },
        select: { id: true, fileName: true, fileSize: true, uploaderName: true, uploaderType: true, createdAt: true, project: { select: { name: true, workspace: { select: { slug: true } } } } },
      }),
      db.teamActivity.findMany({
        take: LIMIT, orderBy: { createdAt: "desc" },
        select: { id: true, actorName: true, event: true, targetEmail: true, targetName: true, createdAt: true, workspace: { select: { slug: true, name: true } } },
      }),
      db.clientSession.findMany({
        take: LIMIT, orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, expiresAt: true, client: { select: { email: true, name: true } }, workspaceId: true },
      }),
    ]);

    // Combine into a unified activity stream
    const events: {
      id: string; type: string; label: string; sublabel: string;
      meta: string; ts: Date; workspace?: string;
    }[] = [];

    recentUsers.forEach((u) => events.push({
      id: `user-${u.id}`, type: "user_joined",
      label: `${u.name} signed up`, sublabel: u.email,
      meta: "", ts: u.createdAt,
    }));

    recentProjects.forEach((p) => events.push({
      id: `project-${p.id}`, type: "project_created",
      label: `Project "${p.name}" created`,
      sublabel: p.workspace.agencyName || p.workspace.name,
      meta: p.status, ts: p.createdAt, workspace: p.workspace.slug,
    }));

    recentReports.forEach((r) => events.push({
      id: `report-${r.id}`, type: "report_generated",
      label: r.title,
      sublabel: `${r.project.name} · ${r.project.workspace.slug}`,
      meta: `${r.generatedBy === "SCHEDULED" ? "Auto" : "Manual"} · ${r.status}`,
      ts: r.generatedAt, workspace: r.project.workspace.slug,
    }));

    recentMessages.forEach((m) => events.push({
      id: `msg-${m.id}`, type: "message_sent",
      label: `${m.senderName} sent a message`,
      sublabel: m.body.slice(0, 80) + (m.body.length > 80 ? "…" : ""),
      meta: `${m.project.name} · ${m.project.workspace.slug}`,
      ts: m.createdAt, workspace: m.project.workspace.slug,
    }));

    recentScopeChanges.forEach((sc) => events.push({
      id: `scope-${sc.id}`, type: "scope_change",
      label: `Scope change: ${sc.title}`,
      sublabel: sc.client.name || sc.client.email,
      meta: `${sc.project.name} · ${sc.status} · ${sc.urgency}`,
      ts: sc.submittedAt, workspace: sc.project.workspace.slug,
    }));

    recentGithubEvents.forEach((g) => events.push({
      id: `gh-${g.id}`, type: "github_event",
      label: `GitHub ${g.eventType.replace("_", " ")}`,
      sublabel: g.repoFullName,
      meta: `${g.project.name} · ${g.status}`,
      ts: g.receivedAt, workspace: g.project.workspace.slug,
    }));

    recentInvoices.forEach((inv) => events.push({
      id: `inv-${inv.id}`, type: "invoice_created",
      label: `Invoice: ${inv.title}`,
      sublabel: `${inv.currency} ${Number(inv.amount).toFixed(2)}`,
      meta: `${inv.project.name} · ${inv.status}`,
      ts: inv.createdAt, workspace: inv.project.workspace.slug,
    }));

    recentFiles.forEach((f) => events.push({
      id: `file-${f.id}`, type: "file_uploaded",
      label: `${f.uploaderName} uploaded ${f.fileName}`,
      sublabel: `${(f.fileSize / 1024).toFixed(1)} KB`,
      meta: `${f.project.name} · ${f.project.workspace.slug}`,
      ts: f.createdAt, workspace: f.project.workspace.slug,
    }));

    recentTeamActivities.forEach((ta) => events.push({
      id: `team-${ta.id}`, type: "team_activity",
      label: `${ta.actorName} — ${ta.event.replace(/_/g, " ").toLowerCase()}`,
      sublabel: ta.targetEmail || ta.targetName || "",
      meta: ta.workspace.name,
      ts: ta.createdAt, workspace: ta.workspace.slug,
    }));

    recentClientSessions.forEach((cs) => events.push({
      id: `session-${cs.id}`, type: "client_login",
      label: `Client portal login`,
      sublabel: cs.client.name || cs.client.email,
      meta: `Expires ${new Date(cs.expiresAt).toLocaleDateString()}`,
      ts: cs.createdAt,
    }));

    // Sort all events newest-first, take top 100
    events.sort((a, b) => b.ts.getTime() - a.ts.getTime());
    const feed = events.slice(0, 100).map((e) => ({ ...e, ts: e.ts.toISOString() }));

    res.json({ feed });
  } catch (err) {
    next(err);
  }
});

// ── GitHub Events ─────────────────────────────────────────────────────────────
router.get("/github-events", ...adminGuard, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const eventType = req.query.eventType as string | undefined;

    const where = eventType ? { eventType: eventType as "push" | "pull_request" | "release" } : {};

    const [events, total] = await Promise.all([
      db.gitHubEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: "desc" },
        include: {
          project: {
            select: { name: true, workspace: { select: { slug: true, name: true } } },
          },
        },
      }),
      db.gitHubEvent.count({ where }),
    ]);

    res.json({ events, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// ── Plan change ───────────────────────────────────────────────────────────────
router.patch("/users/:id/plan", ...adminGuard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan } = req.body as { plan: string };

    const validPlans = ["FREE", "STARTER", "SOLO", "AGENCY"];
    if (!validPlans.includes(plan)) {
      res.status(400).json({ error: "INVALID_PLAN", validPlans });
      return;
    }

    const user = await db.user.findUnique({ where: { id }, include: { workspace: true } });
    if (!user || !user.workspace) {
      res.status(404).json({ error: "USER_OR_WORKSPACE_NOT_FOUND" });
      return;
    }

    const updated = await db.workspace.update({
      where: { id: user.workspace.id },
      data: { plan: plan as "FREE" | "STARTER" | "SOLO" | "AGENCY" },
    });

    res.json({ success: true, workspaceId: updated.id, plan: updated.plan });
  } catch (err) {
    next(err);
  }
});

export default router;
