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
        id: true,
        plan: true,
        lsSubscriptionId: true,
        lsSubscriptionStatus: true,
        lsCustomerId: true,
        trialEndsAt: true,
      },
    });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    const now = new Date();
    const trialActive =
      workspace.plan === "STARTER" &&
      !workspace.lsSubscriptionId &&
      workspace.trialEndsAt != null &&
      workspace.trialEndsAt > now;

    const trialExpired =
      workspace.plan === "STARTER" &&
      !workspace.lsSubscriptionId &&
      workspace.trialEndsAt != null &&
      workspace.trialEndsAt <= now;

    if (trialExpired) {
      await db.workspace.update({
        where: { id: workspace.id },
        data: { plan: "FREE" },
      });
      workspace.plan = "FREE";
    }

    const trialDaysLeft = trialActive && workspace.trialEndsAt
      ? Math.max(0, Math.ceil((workspace.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    res.json({
      plan: workspace.plan,
      lsSubscriptionId: workspace.lsSubscriptionId,
      lsSubscriptionStatus: workspace.lsSubscriptionStatus,
      lsCustomerId: workspace.lsCustomerId,
      trialEndsAt: workspace.trialEndsAt,
      isTrialActive: trialActive,
      trialDaysLeft,
    });
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

    if (workspace.plan === plan) {
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
    if (!workspace.lsSubscriptionId || workspace.plan === "FREE") {
      throw new AppError("No active subscription", 400, "NO_SUBSCRIPTION");
    }

    const portalUrl = await getSubscriptionPortalUrl(workspace.lsSubscriptionId);
    res.json({ portalUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
