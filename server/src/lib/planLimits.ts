export type Plan = "FREE" | "STARTER" | "SOLO" | "AGENCY";

export const PLAN_PROJECT_LIMITS: Record<Plan, number> = {
  FREE: 1,
  STARTER: 3,
  SOLO: 10,
  AGENCY: Infinity,
};

export const PLAN_MONTHLY_AI_REPORTS: Record<Plan, number> = {
  FREE: 0,
  STARTER: 10,
  SOLO: Infinity,
  AGENCY: Infinity,
};

type Feature =
  | "invoices"
  | "files"
  | "messaging"
  | "client_invites"
  | "ai_reports"
  | "github"
  | "scope_changes";

const PLAN_FEATURES: Record<Plan, Set<Feature>> = {
  FREE: new Set([]),
  STARTER: new Set(["invoices", "files", "messaging", "client_invites", "ai_reports"]),
  SOLO: new Set(["invoices", "files", "messaging", "client_invites", "ai_reports", "github", "scope_changes"]),
  AGENCY: new Set(["invoices", "files", "messaging", "client_invites", "ai_reports", "github", "scope_changes"]),
};

export function planHasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].has(feature);
}

export function getEffectivePlan(workspace: {
  plan: Plan;
  lsSubscriptionId: string | null;
  lsSubscriptionStatus: string | null;
  trialEndsAt: Date | null;
}): Plan {
  if (workspace.lsSubscriptionId) {
    return workspace.plan;
  }
  if (workspace.trialEndsAt && workspace.trialEndsAt > new Date()) {
    return "STARTER";
  }
  return "FREE";
}
