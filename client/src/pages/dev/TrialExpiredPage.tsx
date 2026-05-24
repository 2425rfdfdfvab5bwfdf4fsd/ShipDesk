import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { Lock, CheckCircle, ArrowRight, Zap, Star, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "$5",
    icon: Star,
    features: [
      "3 client projects",
      "10 AI reports / month",
      "Magic link client portal",
      "Invoice + payment links",
      "File uploads & sharing",
      "Async client messaging",
    ],
    highlight: false,
  },
  {
    key: "SOLO" as const,
    name: "Solo",
    price: "$29",
    icon: Zap,
    features: [
      "Up to 10 client projects",
      "Unlimited AI reports",
      "GitHub webhook integration",
      "Branded portal + client invites",
      "Invoice + payment collection",
      "Scope change requests & quoting",
    ],
    highlight: false,
  },
  {
    key: "AGENCY" as const,
    name: "Agency",
    price: "$79",
    icon: Building2,
    features: [
      "Unlimited projects",
      "Unlimited AI reports",
      "Custom domain client portal",
      "GitHub integration + DNS verification",
      "Everything in Solo",
      "Priority support",
    ],
    highlight: true,
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
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-16 pb-24">
        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-12 max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <Lock className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Your free trial has ended
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Your 14-day trial is over. Choose a plan below to keep using ShipDesk and retain all your projects, reports, and client data.
          </p>
        </div>

        {/* Plan cards */}
        <div className="w-full max-w-4xl grid sm:grid-cols-3 gap-5 mb-8">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.key}
                data-testid={`card-trial-plan-${plan.key.toLowerCase()}`}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-indigo-500/10 border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/10"
                    : "bg-white/[0.03] border border-white/10"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-indigo-400" />
                    <span className="font-bold text-base">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-white/40 text-sm">/month</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  data-testid={`button-trial-subscribe-${plan.key.toLowerCase()}`}
                  className={`w-full h-10 gap-1.5 ${
                    plan.highlight
                      ? "bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/25 text-white"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                  }`}
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={checkingOut !== null}
                >
                  {checkingOut === plan.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Subscribe to {plan.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-white/30 text-center">
          No credit card required during trial · Cancel any time · Questions?{" "}
          <a href="mailto:support@shipdesk.io" className="underline hover:text-white/50 transition-colors">
            Contact support
          </a>
        </p>

        <Link href="/billing" className="mt-4 text-xs text-white/30 hover:text-white/50 transition-colors underline">
          View full billing details
        </Link>
      </div>
    </div>
  );
}
