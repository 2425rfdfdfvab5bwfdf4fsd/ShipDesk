import { useState } from "react";
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

export function OnboardingChecklist() {
  const { data: status, isLoading } = useOnboardingStatus();
  const completeOnboarding = useCompleteOnboarding();
  const [showConfetti, setShowConfetti] = useState(false);

  if (isLoading || !status) return null;

  const allComplete = STEPS.every((s) => status[s.key]);

  if (allComplete && !showConfetti) {
    return null;
  }

  const completedCount = STEPS.filter((s) => status[s.key]).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="bg-card border rounded-lg shadow-sm p-4 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Get started with ShipDesk</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedCount} of {STEPS.length} completed
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => completeOnboarding.mutate()}
          >
            <X className="h-4 w-4" />
          </Button>
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
