import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { CheckCircle, ArrowRight, Zap, Building2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShipDeskLogo } from "@/components/ui/ShipDeskLogo";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PLAN_FEATURES, PLAN_PRICES } from "@/lib/planFeatures";

const OTHER_PLANS = [
  {
    key: "SOLO" as const,
    name: "Solo",
    icon: Zap,
    color: "indigo",
    features: PLAN_FEATURES.SOLO.slice(0, 5),
  },
  {
    key: "AGENCY" as const,
    name: "Agency",
    icon: Building2,
    color: "violet",
    features: PLAN_FEATURES.AGENCY.slice(0, 5),
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
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm px-6 h-14 flex items-center justify-between">
        <ShipDeskLogo variant="onDark" markClassName="w-7 h-7" textClassName="text-white font-bold tracking-tight text-sm" />
        <button
          onClick={() => signOut()}
          className="text-xs text-white/35 hover:text-white/60 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          Sign out
        </button>
      </header>

      {/* Body */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-16 pb-24">

        {/* Badge */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1 rounded-full mb-8">
          <Sparkles className="h-3 w-3" />
          Trial ended
        </div>

        {/* Heading */}
        <div className="text-center mb-12 max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
            Your free trial has ended
          </h1>
          <p className="text-white/45 text-base leading-relaxed">
            Subscribe to keep all your projects, AI reports, and client data.
            <br className="hidden sm:block" /> No setup required — pick up exactly where you left off.
          </p>
        </div>

        {/* PRIMARY: Starter CTA */}
        <div
          data-testid="card-trial-plan-starter"
          className="w-full max-w-[440px] rounded-2xl bg-gradient-to-b from-indigo-500/[0.12] to-indigo-500/[0.06] border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 p-7 mb-5"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Most popular</span>
              </div>
              <p className="text-2xl font-bold leading-none">Starter</p>
              <p className="text-xs text-white/35 mt-1">Your trial plan · Keep everything</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold tracking-tight">$10</p>
              <p className="text-xs text-white/35 mt-0.5">per month</p>
            </div>
          </div>

          <ul className="space-y-2.5 mb-7">
            {PLAN_FEATURES.STARTER.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/65">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            data-testid="button-trial-subscribe-starter"
            className="w-full h-12 bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25 font-semibold text-sm gap-2 rounded-xl transition-all duration-200"
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

        {/* Divider */}
        <div className="flex items-center gap-3 w-full max-w-[440px] mb-5">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[11px] text-white/25 uppercase tracking-widest font-medium">Or upgrade</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* SECONDARY: Solo + Agency */}
        <div className="w-full max-w-[440px] grid sm:grid-cols-2 gap-3 mb-10">
          {OTHER_PLANS.map((plan) => {
            const Icon = plan.icon;
            const accentClass = plan.color === "violet" ? "text-violet-400" : "text-indigo-400";
            const borderClass = plan.color === "violet" ? "border-violet-500/20 hover:border-violet-500/35" : "border-indigo-500/20 hover:border-indigo-500/35";
            const bgClass = plan.color === "violet" ? "hover:bg-violet-500/[0.06]" : "hover:bg-indigo-500/[0.06]";
            const btnClass = plan.color === "violet"
              ? "bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20"
              : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20";

            return (
              <div
                key={plan.key}
                data-testid={`card-trial-plan-${plan.key.toLowerCase()}`}
                className={`rounded-xl bg-white/[0.02] border ${borderClass} ${bgClass} p-5 flex flex-col transition-all duration-200`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <Icon className={`h-3.5 w-3.5 ${accentClass}`} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm">{plan.name}</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">{PLAN_PRICES[plan.key]}</span>
                  <span className="text-white/35 text-xs">/mo</span>
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-white/45 leading-relaxed">
                      <CheckCircle className="h-3 w-3 text-emerald-400/60 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  data-testid={`button-trial-subscribe-${plan.key.toLowerCase()}`}
                  className={`w-full h-9 text-xs font-semibold gap-1.5 rounded-lg ${btnClass}`}
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

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-white/25">
            Cancel any time · No contracts · Instant access
          </p>
          <p className="text-xs text-white/25">
            Questions?{" "}
            <a href="mailto:support@shipdesk.io" className="text-white/40 hover:text-white/60 underline underline-offset-2 transition-colors">
              Contact support
            </a>
          </p>
          <Link href="/billing" className="block text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2">
            View full billing details
          </Link>
        </div>
      </div>
    </div>
  );
}
