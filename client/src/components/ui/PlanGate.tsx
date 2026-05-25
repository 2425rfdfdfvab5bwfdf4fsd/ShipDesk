import { Link } from "wouter";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Plan = "STARTER" | "SOLO" | "AGENCY";

interface PlanGateProps {
  allowed: boolean;
  requiredPlan: Plan;
  featureName: string;
  children?: React.ReactNode;
}

const PLAN_LABELS: Record<Plan, string> = {
  STARTER: "Starter",
  SOLO: "Solo",
  AGENCY: "Agency",
};

export function PlanGate({ allowed, requiredPlan, featureName, children }: PlanGateProps) {
  if (allowed) return <>{children}</>;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[220px] rounded-xl border border-dashed bg-muted/20 p-8 text-center select-none">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <Lock className="h-4.5 w-4.5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold mb-1">{featureName}</p>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs leading-relaxed">
        This feature is available on the <span className="font-medium text-foreground">{PLAN_LABELS[requiredPlan]}</span> plan and above.
      </p>
      <Button asChild size="sm" className="h-7 gap-1 px-3 text-xs">
        <Link href="/billing">
          Upgrade to {PLAN_LABELS[requiredPlan]} <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}
