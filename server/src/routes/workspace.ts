import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { generateUploadSignature } from "../services/cloudinaryService.js";
import { subdomainCheckLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const RESERVED_SLUGS = new Set([
  "www", "api", "app", "admin", "portal", "mail", "static", "assets",
  "health", "shipdesk", "support", "help", "billing",
]);

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  agencyName: z.string().max(80).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  agencyName: z.string().max(80).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  customDomain: z.string().nullable().optional(),
});

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
    res.json(workspace);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const existing = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
    });
    if (existing) {
      throw new AppError("Workspace already exists", 409, "WORKSPACE_ALREADY_EXISTS");
    }

    const body = createWorkspaceSchema.parse(req.body);
    const slug = body.slug.toLowerCase();

    if (RESERVED_SLUGS.has(slug)) {
      throw new AppError("This subdomain is reserved", 409, "SLUG_TAKEN");
    }

    const taken = await db.workspace.findUnique({ where: { slug } });
    if (taken) throw new AppError("Slug already taken", 409, "SLUG_TAKEN");

    const workspace = await db.workspace.create({
      data: {
        ownerId: req.userId!,
        name: body.name,
        slug,
        agencyName: body.agencyName || null,
        logoUrl: body.logoUrl || null,
        primaryColor: body.primaryColor || "#6366F1",
      },
    });

    res.status(201).json(workspace);
  } catch (err) {
    next(err);
  }
});

router.patch("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = updateWorkspaceSchema.parse(req.body);
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    const updated = await db.workspace.update({
      where: { id: workspace.id },
      data: body,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/check-subdomain",
  subdomainCheckLimiter,
  async (req, res, next) => {
    try {
      const slug = (req.query.slug as string)?.toLowerCase();
      if (!slug || !/^[a-z0-9-]{3,30}$/.test(slug)) {
        res.json({ available: false });
        return;
      }
      if (RESERVED_SLUGS.has(slug)) {
        res.json({ available: false });
        return;
      }
      const existing = await db.workspace.findUnique({ where: { slug } });
      res.json({ available: !existing });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/onboarding-status",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const workspace = await db.workspace.findUnique({
        where: { ownerId: req.userId! },
      });
      if (!workspace) {
        res.json({
          hasGitHubConnected: false,
          hasClientInvited: false,
          hasReportPublished: false,
          hasInvoiceCreated: false,
        });
        return;
      }

      const [ghConn, invitation, report, invoice] = await Promise.all([
        db.gitHubConnection.findUnique({ where: { workspaceId: workspace.id } }),
        db.clientInvitation.findFirst({
          where: { project: { workspaceId: workspace.id } },
        }),
        db.report.findFirst({
          where: { status: "PUBLISHED", project: { workspaceId: workspace.id } },
        }),
        db.invoice.findFirst({
          where: { project: { workspaceId: workspace.id } },
        }),
      ]);

      res.json({
        hasGitHubConnected: !!ghConn,
        hasClientInvited: !!invitation,
        hasReportPublished: !!report,
        hasInvoiceCreated: !!invoice,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/onboarding-complete",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const workspace = await db.workspace.findUnique({
        where: { ownerId: req.userId! },
      });
      if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

      await db.workspace.update({
        where: { id: workspace.id },
        data: { onboardingComplete: true },
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/logo-upload-signature",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const workspace = await db.workspace.findUnique({
        where: { ownerId: req.userId! },
      });

      const folder = workspace
        ? `shipdesk/logos/${workspace.id}/`
        : `shipdesk/logos/tmp/${req.clerkUserId}/`;

      const signature = generateUploadSignature(folder);
      res.json(signature);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
