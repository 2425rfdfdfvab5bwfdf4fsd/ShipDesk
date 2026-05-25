import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSEO } from "@/lib/seo";
import {
  CheckCircle, Zap, Building2, Loader2, ExternalLink,
  CreditCard, ArrowRight, Star, ShieldCheck, Timer
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PLAN_FEATURES, PLAN_PRICES } from "@/lib/planFeatures";
import type { Plan } from "@/types";

function daysLeft(date: string): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

interface BillingStatus {
  plan: Plan;
  adminPlanOverride: boolean;
  lsSubscriptionId: string | null;
  lsSubscriptionStatus: string | null;
  lsCustomerId: string | null;
  trialEndsAt: string | null;
}

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  active: { label: "Active", variant: "success" },
  on_trial: { label: "Trial", variant: "info" as "secondary" },
  paused: { label: "Paused", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  expired: { label: "Expired", variant: "destructive" },
  past_due: { label: "Past due", variant: "warning" },
};

function PlanCard({
  plan,
  currentPlan,
  hasActiveSubscription,
  isAdminGranted,
  onUpgrade,
  isLoading,
}: {
  plan: "STARTER" | "SOLO" | "AGENCY";
  currentPlan: "STARTER" | "SOLO" | "AGENCY";
  hasActiveSubscription: boolean;
  isAdminGranted: boolean;
  onUpgrade: (plan: "STARTER" | "SOLO" | "AGENCY") => void;
  isLoading: boolean;
}) {
  const isCurrentPlan = currentPlan === plan;
  const isPaidCurrentPlan = isCurrentPlan && hasActiveSubscription;
  const isAdminCurrentPlan = isCurrentPlan && isAdminGranted;
  const isHighlighted = plan === "AGENCY";
  const features = PLAN_FEATURES[plan];

  return (
    <div
      className={`relative rounded-2xl p-6 ${
        isHighlighted
          ? "bg-primary/10 border-2 border-primary/40 shadow-xl shadow-primary/10"
          : "bg-muted/30 border border-border"
      }`}
    >
      {isHighlighted && !isPaidCurrentPlan && !isAdminCurrentPlan && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Star className="h-3 w-3" /> Most popular
          </span>
        </div>
      )}
      {(isPaidCurrentPlan || isAdminCurrentPlan) && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          {isAdminCurrentPlan ? (
            <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Admin grant
            </span>
          ) : (
            <Badge variant="success" className="text-xs px-3 py-1">Current plan</Badge>
          )}
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          {plan === "STARTER" ? (
            <Star className="h-4 w-4 text-primary" />
          ) : plan === "SOLO" ? (
            <Zap className="h-4 w-4 text-primary" />
          ) : (
            <Building2 className="h-4 w-4 text-primary" />
          )}
          <h3 className="font-bold text-base">
            {plan === "STARTER" ? "Starter" : plan === "SOLO" ? "Solo" : "Agency"}
          </h3>
        </div>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-bold">{PLAN_PRICES[plan]}</span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        data-testid={`button-subscribe-${plan.toLowerCase()}`}
        className={`w-full h-10 ${
          isHighlighted && !isPaidCurrentPlan && !isAdminCurrentPlan
            ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            : ""
        }`}
        variant={isPaidCurrentPlan || isAdminCurrentPlan ? "outline" : isHighlighted ? "default" : "secondary"}
        disabled={isPaidCurrentPlan || isAdminCurrentPlan || isLoading}
        onClick={() => !isPaidCurrentPlan && !isAdminCurrentPlan && onUpgrade(plan)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isAdminCurrentPlan ? (
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin granted
          </span>
        ) : isPaidCurrentPlan ? (
          "Current plan"
        ) : (
          <>
            {hasActiveSubscription ? "Switch plan" : "Subscribe"}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </>
        )}
      </Button>
    </div>
  );
}

export function BillingPage() {
  useSEO({ title: "Billing | ShipDesk" });
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [checkingOut, setCheckingOut] = useState<"STARTER" | "SOLO" | "AGENCY" | null>(null);

  const { data: billing, isLoading, refetch } = useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: () => api.get("/api/billing/status").then((r) => r.data),
  });

  const portalMutation = useMutation({
    mutationFn: () => api.get("/api/billing/portal").then((r) => r.data as { portalUrl: string }),
    onSuccess: ({ portalUrl }) => {
      window.open(portalUrl, "_blank", "noopener,noreferrer");
    },
    onError: () => {
      toast({ title: "Could not open billing portal", variant: "destructive" });
    },
  });

  const handleUpgrade = async (plan: "STARTER" | "SOLO" | "AGENCY") => {
    setCheckingOut(plan);
    try {
      const redirectUrl = `${window.location.origin}/billing?success=true`;
      const { data } = await api.post("/api/billing/checkout", { plan, redirectUrl });
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({
        title: code === "ALREADY_SUBSCRIBED" ? "Already on this plan" : "Checkout failed",
        description: code === "ALREADY_SUBSCRIBED"
          ? "You're already subscribed to this plan."
          : "Please try again or contact support.",
        variant: "destructive",
      });
      setCheckingOut(null);
    }
  };

  const isAdminGranted = !!billing?.adminPlanOverride;
  const hasActiveSub = !!billing?.lsSubscriptionId;

  // Resolve the actual plan to display — admin override and paid subs both use the real plan
  const currentPlan: "STARTER" | "SOLO" | "AGENCY" =
    billing?.plan === "SOLO" || billing?.plan === "AGENCY" ? billing.plan : "STARTER";

  // Trial only applies to users without a subscription AND without an admin override
  const isOnTrial = !hasActiveSub && !isAdminGranted && !!billing?.trialEndsAt;
  const trialActive = isOnTrial && billing?.trialEndsAt != null && new Date(billing.trialEndsAt) > new Date();
  const trialDays = trialActive && billing?.trialEndsAt ? daysLeft(billing.trialEndsAt) : 0;
  // Trial progress: 14-day window, show % elapsed
  const TRIAL_TOTAL_DAYS = 14;
  const trialPercent = trialActive ? Math.max(4, Math.round(((TRIAL_TOTAL_DAYS - trialDays) / TRIAL_TOTAL_DAYS) * 100)) : 100;

  const subStatus = billing?.lsSubscriptionStatus;
  const statusInfo = subStatus ? STATUS_BADGE[subStatus] : null;

  const PLAN_LABELS = { FREE: "Free", STARTER: "Starter", SOLO: "Solo", AGENCY: "Agency" };
  const displayLabel = (isAdminGranted || hasActiveSub)
    ? PLAN_LABELS[currentPlan]
    : PLAN_LABELS[isOnTrial ? "STARTER" : currentPlan];

  const featuresForDisplay = (isAdminGranted || hasActiveSub)
    ? PLAN_FEATURES[currentPlan]
    : PLAN_FEATURES["STARTER"];

  const featuresLabel = isAdminGranted
    ? `What's included in your ${PLAN_LABELS[currentPlan]} plan`
    : isOnTrial
    ? "What's included in your Starter plan"
    : "What's included in your plan";

  const trialEndFormatted = billing?.trialEndsAt
    ? new Date(billing.trialEndsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "";

  const planDescription = hasActiveSub
    ? `${PLAN_PRICES[currentPlan]}/month`
    : isAdminGranted
    ? `All ${PLAN_LABELS[currentPlan]} features included · Admin granted access`
    : trialActive
    ? `All Starter features included · Ends ${trialEndFormatted}`
    : isOnTrial
    ? "Trial expired — choose a plan below to continue"
    : "";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-1">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and billing details.</p>
      </div>

      {/* Current plan status */}
      {!isLoading && (
        <div className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current plan</p>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-lg font-bold">{displayLabel}</span>
              {isAdminGranted && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Admin grant
                </Badge>
              )}
              {trialActive && !isAdminGranted && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 font-semibold"
                  data-testid="badge-trial-days"
                >
                  <Timer className="h-3 w-3" />
                  {trialDays} day{trialDays !== 1 ? "s" : ""} left
                </Badge>
              )}
              {isOnTrial && !trialActive && !isAdminGranted && (
                <Badge variant="destructive">Trial expired</Badge>
              )}
              {statusInfo && !isOnTrial && !isAdminGranted && (
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{planDescription}</p>
            {/* Trial progress bar */}
            {trialActive && (
              <div className="mt-2 max-w-xs">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${trialPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {TRIAL_TOTAL_DAYS - trialDays} of {TRIAL_TOTAL_DAYS} days used
                </p>
              </div>
            )}
          </div>

          {hasActiveSub && (
            <Button
              data-testid="button-manage-subscription"
              variant="outline"
              size="sm"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              )}
              Manage subscription
              <ExternalLink className="h-3 w-3 ml-1.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Plan cards */}
          <div>
            <h2 className="text-sm font-semibold mb-4">
              {hasActiveSub ? "Switch plan" : isAdminGranted ? "Available plans" : "Choose a plan"}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {(["STARTER", "SOLO", "AGENCY"] as const).map((plan) => (
                <PlanCard
                  key={plan}
                  plan={plan}
                  currentPlan={currentPlan}
                  hasActiveSubscription={hasActiveSub}
                  isAdminGranted={isAdminGranted}
                  onUpgrade={handleUpgrade}
                  isLoading={checkingOut === plan}
                />
              ))}
            </div>
            {isOnTrial && !isAdminGranted && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                No credit card required during trial · Cancel any time
              </p>
            )}
            {isAdminGranted && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Your plan has been granted by an administrator · Subscribe to manage billing yourself
              </p>
            )}
          </div>

          {/* What's included */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3">{featuresLabel}</h2>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {featuresForDisplay.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* FAQ */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Billing FAQ</h2>
            {[
              {
                q: "When will I be charged?",
                a: "Your 14-day free trial starts immediately. You'll only be billed after the trial ends.",
              },
              {
                q: "Can I cancel any time?",
                a: "Yes. Cancel before your trial ends and you won't be charged. Cancel any time after and your access continues until the end of the billing period.",
              },
              {
                q: "Can I switch plans?",
                a: "Yes. Upgrading takes effect immediately. Downgrading takes effect at the next billing cycle.",
              },
              {
                q: "Need help?",
                a: "Contact us at support@shipdesk.io and we'll get back to you within one business day.",
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="text-sm font-medium mb-0.5">{q}</p>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
