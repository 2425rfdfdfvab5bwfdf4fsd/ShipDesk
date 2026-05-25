import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";

type Plan = "FREE" | "STARTER" | "SOLO" | "AGENCY";

interface BillingStatus {
  plan: Plan;
  lsSubscriptionId: string | null;
  lsSubscriptionStatus: string | null;
  trialEndsAt: string | null;
}

export interface PlanCapabilities {
  plan: Plan;
  effectivePlan: Plan;
  projectLimit: number;
  monthlyAiReports: number;
  canUseInvoices: boolean;
  canUseFiles: boolean;
  canUseMessaging: boolean;
  canUseClientInvites: boolean;
  canUseAiReports: boolean;
  canUseGitHub: boolean;
  canUseScopeChanges: boolean;
}

const PROJECT_LIMITS: Record<Plan, number> = {
  FREE: 1,
  STARTER: 3,
  SOLO: 10,
  AGENCY: Infinity,
};

const MONTHLY_AI_REPORTS: Record<Plan, number> = {
  FREE: 0,
  STARTER: 10,
  SOLO: Infinity,
  AGENCY: Infinity,
};

function getEffectivePlan(billing: BillingStatus): Plan {
  if (billing.lsSubscriptionId) return billing.plan;
  if (billing.trialEndsAt && new Date(billing.trialEndsAt) > new Date()) return "STARTER";
  return "FREE";
}

function buildCapabilities(billing: BillingStatus): PlanCapabilities {
  const effectivePlan = getEffectivePlan(billing);

  const starterOrAbove = effectivePlan !== "FREE";
  const soloOrAbove = effectivePlan === "SOLO" || effectivePlan === "AGENCY";

  return {
    plan: billing.plan,
    effectivePlan,
    projectLimit: PROJECT_LIMITS[effectivePlan],
    monthlyAiReports: MONTHLY_AI_REPORTS[effectivePlan],
    canUseInvoices: starterOrAbove,
    canUseFiles: starterOrAbove,
    canUseMessaging: starterOrAbove,
    canUseClientInvites: starterOrAbove,
    canUseAiReports: starterOrAbove,
    canUseGitHub: soloOrAbove,
    canUseScopeChanges: soloOrAbove,
  };
}

export function usePlan(): { capabilities: PlanCapabilities | null; isLoading: boolean } {
  const { isSignedIn } = useAuth();

  const { data: billing, isLoading } = useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: () => api.get("/api/billing/status").then((r) => r.data),
    enabled: !!isSignedIn,
    staleTime: 60_000,
  });

  if (!billing) return { capabilities: null, isLoading };

  return { capabilities: buildCapabilities(billing), isLoading };
}
