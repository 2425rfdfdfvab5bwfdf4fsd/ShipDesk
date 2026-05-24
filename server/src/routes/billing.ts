import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import {
  createSubscriptionCheckout,
  getSubscriptionPortalUrl,
} from "../services/lemonSqueezyService.js";

const router = Router();

const PLAN_LABELS: Record<string, string> = {
  SOLO: "Solo",
  AGENCY: "Agency",
};

const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "SOLO", "AGENCY"]),
  redirectUrl: z.string().url().optional(),
});

router.get("/status", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
      select: {
        plan: true,
        lsSubscriptionId: true,
        lsSubscriptionStatus: true,
        lsCustomerId: true,
        trialEndsAt: true,
      },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
    res.json(workspace);
  } catch (err) {
    next(err);
  }
});

router.post("/checkout", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { plan, redirectUrl } = checkoutSchema.parse(req.body);

    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
      include: { owner: true },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    if (workspace.plan === plan && workspace.lsSubscriptionId) {
      throw new AppError("Already subscribed to this plan", 409, "ALREADY_SUBSCRIBED");
    }

    const checkoutUrl = await createSubscriptionCheckout({
      plan,
      workspaceId: workspace.id,
      email: workspace.owner.email,
      name: workspace.owner.name,
      redirectUrl: redirectUrl || `${process.env.FRONTEND_URL || ""}/billing?success=true`,
    });

    res.json({ checkoutUrl });
  } catch (err) {
    next(err);
  }
});

router.get("/portal", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({
      where: { ownerId: req.userId! },
      select: { lsSubscriptionId: true, plan: true },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");
    if (!workspace.lsSubscriptionId) {
      throw new AppError("No active subscription", 400, "NO_SUBSCRIPTION");
    }

    const portalUrl = await getSubscriptionPortalUrl(workspace.lsSubscriptionId);
    res.json({ portalUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
