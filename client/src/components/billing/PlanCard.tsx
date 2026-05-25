import { CheckCircle, Star, Zap, Building2, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_FEATURES, PLAN_PRICES } from "@/lib/planFeatures";

function daysLeft(date: string): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export interface PlanCardProps {
  plan: "STARTER" | "SOLO" | "AGENCY";
  currentPlan: "STARTER" | "SOLO" | "AGENCY";
  hasActiveSubscription: boolean;
  isAdminGranted: boolean;
  onUpgrade: (plan: "STARTER" | "SOLO" | "AGENCY") => void;
  isLoading: boolean;
  lsRenewsAt: string | null;
  lsEndsAt: string | null;
  lsSubscriptionStatus: string | null;
}

export function PlanCard({
  plan,
  currentPlan,
  hasActiveSubscription,
  isAdminGranted,
  onUpgrade,
  isLoading,
  lsRenewsAt,
  lsEndsAt,
  lsSubscriptionStatus,
}: PlanCardProps) {
  const isCurrentPlan = currentPlan === plan;
  const isPaidCurrentPlan = isCurrentPlan && hasActiveSubscription;
  const isAdminCurrentPlan = isCurrentPlan && isAdminGranted;
  const isHighlighted = plan === "AGENCY";
  const features = PLAN_FEATURES[plan];

  const isCancelled = lsSubscriptionStatus === "cancelled" || lsSubscriptionStatus === "expired";
  const dateForProgress = isPaidCurrentPlan ? (isCancelled ? lsEndsAt : lsRenewsAt) : null;
  const daysRemaining = dateForProgress ? daysLeft(dateForProgress) : null;
  const PERIOD = 30;
  const progressPct = daysRemaining !== null
    ? Math.max(3, Math.min(100, Math.round((daysRemaining / PERIOD) * 100)))
    : 0;
  const renewDateFormatted = dateForProgress
    ? new Date(dateForProgress).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";

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

        {isPaidCurrentPlan && daysRemaining !== null && (
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isCancelled && daysRemaining <= 7 ? "bg-red-400" : "bg-primary/60"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className={`text-[11px] font-medium ${
              isCancelled && daysRemaining <= 7
                ? "text-red-500 dark:text-red-400"
                : "text-muted-foreground"
            }`}>
              {isCancelled
                ? `Access ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} · ${renewDateFormatted}`
                : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining · renews ${renewDateFormatted}`}
            </p>
          </div>
        )}
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
            {hasActiveSubscription ? "Switch plan" : plan === "STARTER" ? "Free trial · 14 days" : "Get started"}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </>
        )}
      </Button>
    </div>
  );
}
