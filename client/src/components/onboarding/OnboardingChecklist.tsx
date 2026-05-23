import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, X, Github, Users, FileText, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useOnboardingStatus, useCompleteOnboarding } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    key: "hasGitHubConnected" as const,
    title: "Connect a GitHub repository",
    description: "Link your GitHub account to start syncing commits",
    icon: Github,
    href: "/settings/workspace",
  },
  {
    key: "hasClientInvited" as const,
    title: "Invite your first client",
    description: "Send a magic link to give a client portal access",
    icon: Users,
    href: "/dashboard",
  },
  {
    key: "hasReportPublished" as const,
    title: "Generate and publish a report",
    description: "Create your first AI-generated weekly update",
    icon: FileText,
    href: "/dashboard",
  },
  {
    key: "hasInvoiceCreated" as const,
    title: "Create an invoice",
    description: "Send a payment request to a client",
    icon: DollarSign,
    href: "/invoices",
  },
];

const CONFETTI_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#f43f5e", "#84cc16",
];

function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const startX = Math.random() * 100;
  const rotation = Math.random() * 720 - 360;
  const size = Math.random() * 6 + 4;
  const isCircle = Math.random() > 0.5;

  return (
    <motion.div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${startX}%`,
        width: size,
        height: size * (isCircle ? 1 : 1.6),
        borderRadius: isCircle ? "50%" : "1px",
        backgroundColor: color,
      }}
      initial={{ y: -10, opacity: 1, rotate: 0, x: 0 }}
      animate={{
        y: ["-10%", "110%"],
        opacity: [1, 1, 0],
        rotate: rotation,
        x: [(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 120],
      }}
      transition={{
        duration: 2.5 + Math.random() * 0.8,
        delay: Math.random() * 0.6,
        ease: "easeIn",
      }}
    />
  );
}

export function OnboardingChecklist() {
  const { data: status, isLoading } = useOnboardingStatus();
  const completeOnboarding = useCompleteOnboarding();
  const [showConfetti, setShowConfetti] = useState(false);
  const [visible, setVisible] = useState(true);
  const prevAllComplete = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allComplete = STEPS.every((s) => status?.[s.key]);

  useEffect(() => {
    if (!allComplete || prevAllComplete.current) return;
    prevAllComplete.current = true;
    setShowConfetti(true);
    dismissTimer.current = setTimeout(() => {
      setShowConfetti(false);
      setVisible(false);
      completeOnboarding.mutate();
    }, 3000);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [allComplete]);

  if (isLoading || !status) return null;
  if (!visible) return null;

  const completedCount = STEPS.filter((s) => status[s.key]).length;

  return (
    <AnimatePresence>
      <motion.div
        key="checklist"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative bg-card border rounded-lg shadow-sm p-4 mb-6 overflow-hidden"
      >
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <ConfettiParticle key={i} index={i} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">
              {allComplete ? "You're all set! 🎉" : "Get started with ShipDesk"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allComplete
                ? "All steps complete — collapsing in a moment…"
                : `${completedCount} of ${STEPS.length} completed`}
            </p>
          </div>
          {!allComplete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setVisible(false);
                completeOnboarding.mutate();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = status[step.key];
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  href={step.href}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md transition-colors group",
                    done
                      ? "opacity-60 pointer-events-none"
                      : "hover:bg-accent cursor-pointer"
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2",
                      done
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        done && "line-through text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    <p className={cn("text-xs text-muted-foreground", done && "line-through")}>
                      {step.description}
                    </p>
                  </div>
                  {!done && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
