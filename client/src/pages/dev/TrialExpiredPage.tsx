import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { Lock, CheckCircle, ArrowRight, Zap, Star, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PLAN_FEATURES, PLAN_PRICES } from "@/lib/planFeatures";

const OTHER_PLANS = [
  {
    key: "SOLO" as const,
    name: "Solo",
    icon: Zap,
    features: PLAN_FEATURES.SOLO.slice(0, 4),
  },
  {
    key: "AGENCY" as const,
    name: "Agency",
    icon: Building2,
    features: PLAN_FEATURES.AGENCY.slice(0, 4),
  },
];

export function TrialExpiredPage() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [checkingOut, setCheckingOut] = useState<"STARTER" | "SOLO" | "AGENCY" | null>(null);

  const handleSubscribe = async (plan: "STARTER" | "SOLO" | "AGENCY") => {
    setCheckingOut(plan);
    try {
      const redirectUrl = `${window.location.origin}/billing?success=true`;
      const { data } = await api.post("/api/billing/checkout", { plan, redirectUrl });
      window.location.href = data.checkoutUrl;
    } catch {
      toast({
        title: "Checkout failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setCheckingOut(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080f] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#06080f]/90 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="ShipDesk" className="w-7 h-7" />
          <span className="font-bold tracking-tight">ShipDesk</span>
        </div>
        <button
          onClick={() => signOut()}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-14 pb-24">

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-10 max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <Lock className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Your free trial has ended
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Your 14-day Starter trial is over. Pay $10/month to continue with the Starter plan and keep all your projects, reports, and client data.
          </p>
        </div>

        {/* PRIMARY: Starter plan CTA */}
        <div
          data-testid="card-trial-plan-starter"
          className="w-full max-w-md rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/10 p-7 mb-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Star className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="font-bold text-lg leading-none">Starter</p>
                <p className="text-xs text-white/40 mt-0.5">Your trial plan</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">$10</p>
              <p className="text-xs text-white/40">/month</p>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {PLAN_FEATURES.STARTER.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            data-testid="button-trial-subscribe-starter"
            className="w-full h-11 bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30 font-semibold text-sm gap-2"
            onClick={() => handleSubscribe("STARTER")}
            disabled={checkingOut !== null}
          >
            {checkingOut === "STARTER" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue with Starter — {PLAN_PRICES.STARTER}/month
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* SECONDARY: other plans */}
        <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Or upgrade to a higher plan</p>
        <div className="w-full max-w-md grid sm:grid-cols-2 gap-4 mb-8">
          {OTHER_PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.key}
                data-testid={`card-trial-plan-${plan.key.toLowerCase()}`}
                className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-white/50" />
                  <span className="font-semibold text-sm">{plan.name}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold">{PLAN_PRICES[plan.key]}</span>
                  <span className="text-white/40 text-xs">/month</span>
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                      <CheckCircle className="h-3 w-3 text-emerald-400/70 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  data-testid={`button-trial-subscribe-${plan.key.toLowerCase()}`}
                  className="w-full h-9 bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs gap-1.5"
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={checkingOut !== null}
                >
                  {checkingOut === plan.key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      Choose {plan.name}
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-white/30 text-center">
          Cancel any time · Questions?{" "}
          <a href="mailto:support@shipdesk.io" className="underline hover:text-white/50 transition-colors">
            Contact support
          </a>
        </p>
        <Link href="/billing" className="mt-3 text-xs text-white/30 hover:text-white/50 transition-colors underline">
          View full billing details
        </Link>
      </div>
    </div>
  );
}
