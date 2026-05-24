import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSEO } from "@/lib/seo";
import { Github, Palette, Globe, Shield, CreditCard, CheckCircle, ArrowRight, Star, Zap, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSettingsForm } from "@/components/workspace/WorkspaceSettingsForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { PLAN_FEATURES, PLAN_PRICES } from "@/lib/planFeatures";

const TABS = [
  { key: "workspace", label: "Workspace", icon: Globe },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "plan", label: "Plan", icon: CreditCard },
  { key: "integrations", label: "Integrations", icon: Github },
] as const;

type Tab = typeof TABS[number]["key"];

interface BillingStatus {
  plan: "FREE" | "STARTER" | "SOLO" | "AGENCY";
  lsSubscriptionId: string | null;
  lsSubscriptionStatus: string | null;
  trialEndsAt: string | null;
}

const PLAN_INFO = {
  FREE:    { label: "Free",    icon: Star,      color: "text-muted-foreground" },
  STARTER: { label: "Starter", icon: Star,      color: "text-indigo-500" },
  SOLO:    { label: "Solo",    icon: Zap,       color: "text-indigo-500" },
  AGENCY:  { label: "Agency",  icon: Building2, color: "text-indigo-500" },
} as const;

function daysLeft(date: string): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function PlanTab() {
  const [, navigate] = useLocation();
  const { data: billing, isLoading } = useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: () => api.get("/api/billing/status").then((r) => r.data),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const plan = billing?.plan ?? "FREE";
  const isOnTrial = !billing?.lsSubscriptionId && !!billing?.trialEndsAt;
  const trialActive = isOnTrial && new Date(billing!.trialEndsAt!) > new Date();
  const trialExpired = isOnTrial && !trialActive;
  const remaining = billing?.trialEndsAt && trialActive ? daysLeft(billing.trialEndsAt) : 0;

  // During trial, always show Starter features regardless of DB plan value
  const displayPlan = isOnTrial ? "STARTER" : plan;
  const info = PLAN_INFO[displayPlan];
  const PlanIcon = info.icon;
  const features = PLAN_FEATURES[displayPlan] ?? [];

  // The visible plan name: "Free Trial" while on trial, otherwise the real plan name
  const planName = trialActive ? "Free Trial" : trialExpired ? "Free Trial" : info.label;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold mb-0.5">Current Plan</h2>
        <p className="text-xs text-muted-foreground">Your active subscription and plan details.</p>
      </div>

      {/* Plan summary card */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <PlanIcon className={cn("h-5 w-5", info.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base">{planName}</span>
                {trialActive && (
                  <Badge variant="info" data-testid="badge-trial-active">
                    14-Day Trial
                  </Badge>
                )}
                {trialExpired && (
                  <Badge variant="destructive" data-testid="badge-trial-expired">
                    Expired
                  </Badge>
                )}
                {billing?.lsSubscriptionStatus === "active" && (
                  <Badge variant="success" data-testid="badge-plan-active">Active</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {billing?.lsSubscriptionId
                  ? `${PLAN_PRICES[displayPlan]}/month · All ${info.label} features included`
                  : trialActive
                  ? `Includes all Starter features · ${remaining} day${remaining !== 1 ? "s" : ""} remaining`
                  : trialExpired
                  ? "Your trial has ended — upgrade to continue"
                  : "Free plan"}
              </p>
            </div>
          </div>

          <Button
            data-testid="button-manage-plan"
            size="sm"
            onClick={() => navigate("/billing")}
            className="shrink-0"
          >
            {billing?.lsSubscriptionId ? "Manage subscription" : "Upgrade plan"}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>

        {/* Trial progress bar */}
        {trialActive && billing?.trialEndsAt && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Trial period</span>
              <span>Ends {new Date(billing.trialEndsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, ((14 - remaining) / 14) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {remaining} of 14 days remaining
            </p>
          </div>
        )}

        {/* Features included */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">What's included</p>
          <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA when on trial, expired, or on free plan with no trial */}
      {!billing?.lsSubscriptionId && (
        <div className={cn(
          "rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
          trialExpired ? "bg-destructive/5 border-destructive/30" : "bg-primary/5 border-primary/20"
        )}>
          <div>
            <p className="text-sm font-semibold">
              {trialExpired
                ? "Your trial has ended"
                : trialActive
                ? "Enjoying your trial?"
                : "Unlock more with a paid plan"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trialExpired
                ? "Upgrade now to regain full access to all your projects and data."
                : trialActive
                ? `You have ${remaining} day${remaining !== 1 ? "s" : ""} left. Upgrade any time to keep full access.`
                : "Get more projects, AI reports, payments, and a branded client portal."}
            </p>
          </div>
          <Button
            data-testid="button-upgrade-cta"
            size="sm"
            variant={trialExpired ? "destructive" : "default"}
            onClick={() => navigate("/billing")}
            className="shrink-0"
          >
            View plans
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold mb-0.5">Integrations</h2>
        <p className="text-xs text-muted-foreground">Connect third-party services to enhance your reports.</p>
      </div>

      {[
        {
          name: "GitHub",
          icon: Github,
          description: "Connect your GitHub account to enable AI report generation from commit history, PRs, and releases.",
          status: "configured",
          statusLabel: "Connect from Project Settings",
          statusVariant: "info",
          action: null,
        },
        {
          name: "Linear",
          icon: Shield,
          description: "Pull Linear issue activity into weekly reports alongside GitHub data.",
          status: "coming_soon",
          statusLabel: "Coming in v1.1",
          statusVariant: "secondary",
          action: null,
        },
        {
          name: "Vercel",
          icon: Globe,
          description: "Include deployment activity in your reports — show clients when new versions ship.",
          status: "coming_soon",
          statusLabel: "Coming in v1.1",
          statusVariant: "secondary",
          action: null,
        },
      ].map((integration) => {
        const Icon = integration.icon;
        return (
          <div key={integration.name} className="bg-card border rounded-xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-sm font-semibold">{integration.name}</p>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  integration.status === "configured" ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" :
                  "bg-muted text-muted-foreground"
                )}>
                  {integration.statusLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SettingsPage() {
  useSEO({ title: "Settings", noindex: true });
  const [activeTab, setActiveTab] = useState<Tab>("workspace");

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-5 sm:mb-7">
        <h1 className="text-lg sm:text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your workspace configuration and integrations.
        </p>
      </div>

      <div className="flex gap-0.5 sm:gap-1 mb-5 sm:mb-7 border-b overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              data-testid={`tab-settings-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "workspace" && <WorkspaceSettingsForm showBranding={false} />}
      {activeTab === "branding" && <WorkspaceSettingsForm showBrandingOnly />}
      {activeTab === "plan" && <PlanTab />}
      {activeTab === "integrations" && <IntegrationsTab />}
    </div>
  );
}
