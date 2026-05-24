import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSEO } from "@/lib/seo";
import {
  CheckCircle, Zap, Building2, Loader2, ExternalLink,
  CreditCard, AlertTriangle, ArrowRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Plan = "FREE" | "STARTER" | "SOLO" | "AGENCY";

interface BillingStatus {
  plan: Plan;
  lsSubscriptionId: string | null;
  lsSubscriptionStatus: string | null;
  lsCustomerId: string | null;
  trialEndsAt: string | null;
}

const PLAN_FEATURES: Record<Plan, string[]> = {
  FREE: ["1 active project", "Manual reports only", "Basic client portal", "Community support"],
  STARTER: [
    "3 active projects",
    "10 AI reports/month",
    "Branded client portal",
    "Invoice + payment links",
    "File sharing",
    "Async messaging",
  ],
  SOLO: [
    "Up to 10 active projects",
    "Unlimited AI reports",
    "Branded client portal",
    "Invoice + payment links",
    "Scope change flow",
    "File sharing",
    "Async messaging",
  ],
  AGENCY: [
    "Unlimited projects",
    "Unlimited AI reports",
    "Custom domain portal",
    "Everything in Solo",
    "Priority support",
    "Team seats (coming soon)",
    "Linear & Vercel integration",
  ],
};

const PLAN_PRICES: Record<Plan, string> = {
  FREE: "$0",
  STARTER: "$5",
  SOLO: "$29",
  AGENCY: "$79",
};

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
  onUpgrade,
  isLoading,
}: {
  plan: "STARTER" | "SOLO" | "AGENCY";
  currentPlan: Plan;
  hasActiveSubscription: boolean;
  onUpgrade: (plan: "STARTER" | "SOLO" | "AGENCY") => void;
  isLoading: boolean;
}) {
  const isPaidCurrentPlan = currentPlan === plan && hasActiveSubscription;
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
      {isHighlighted && !isPaidCurrentPlan && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Star className="h-3 w-3" /> Most popular
          </span>
        </div>
      )}
      {isPaidCurrentPlan && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge variant="success" className="text-xs px-3 py-1">Current plan</Badge>
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
          isHighlighted && !isPaidCurrentPlan
            ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            : ""
        }`}
        variant={isPaidCurrentPlan ? "outline" : isHighlighted ? "default" : "secondary"}
        disabled={isPaidCurrentPlan || isLoading}
        onClick={() => !isPaidCurrentPlan && onUpgrade(plan)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
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

  const currentPlan = billing?.plan ?? "FREE";
  const subStatus = billing?.lsSubscriptionStatus;
  const statusInfo = subStatus ? STATUS_BADGE[subStatus] : null;
  const isOnTrial = !billing?.lsSubscriptionId && !!billing?.trialEndsAt;
  const trialActive = isOnTrial && billing?.trialEndsAt != null && new Date(billing.trialEndsAt) > new Date();

  const planLabel: Record<Plan, string> = {
    FREE: "Free",
    STARTER: "Starter",
    SOLO: "Solo",
    AGENCY: "Agency",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
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
              <span className="text-lg font-bold">{planLabel[currentPlan]}</span>
              {trialActive && (
                <Badge variant="secondary">Free Trial</Badge>
              )}
              {statusInfo && !isOnTrial && (
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {billing?.lsSubscriptionId
                ? `${PLAN_PRICES[currentPlan]}/month`
                : trialActive && billing?.trialEndsAt
                ? `Trial ends ${new Date(billing.trialEndsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : isOnTrial
                ? "Trial expired — choose a plan below"
                : ""}
            </p>
          </div>

          {billing?.lsSubscriptionId && (
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
          {(currentPlan === "FREE" || currentPlan !== "FREE") && (
            <div>
              <h2 className="text-sm font-semibold mb-4">
                {billing?.lsSubscriptionId ? "Switch plan" : "Choose a plan"}
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <PlanCard
                  plan="STARTER"
                  currentPlan={currentPlan}
                  hasActiveSubscription={!!billing?.lsSubscriptionId}
                  onUpgrade={handleUpgrade}
                  isLoading={checkingOut === "STARTER"}
                />
                <PlanCard
                  plan="SOLO"
                  currentPlan={currentPlan}
                  hasActiveSubscription={!!billing?.lsSubscriptionId}
                  onUpgrade={handleUpgrade}
                  isLoading={checkingOut === "SOLO"}
                />
                <PlanCard
                  plan="AGENCY"
                  currentPlan={currentPlan}
                  hasActiveSubscription={!!billing?.lsSubscriptionId}
                  onUpgrade={handleUpgrade}
                  isLoading={checkingOut === "AGENCY"}
                />
              </div>
              {isOnTrial && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  No credit card required during trial · Cancel any time
                </p>
              )}
            </div>
          )}

          {/* What's included for current plan */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3">What's included in your plan</h2>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {PLAN_FEATURES[currentPlan].map((feature) => (
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
