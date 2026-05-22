import { useState } from "react";
import { Zap, Check, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGenerateReport } from "@/hooks/useReports";
import { toast } from "@/hooks/use-toast";

interface GenerateReportButtonProps {
  projectId: string;
  hasGitHub?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  iconOnly?: boolean;
}

type Step = "idle" | "fetching" | "analyzing" | "writing" | "done" | "error";

const STEPS: { key: Step; label: string }[] = [
  { key: "fetching",  label: "Fetching GitHub activity" },
  { key: "analyzing", label: "Analyzing commits & PRs" },
  { key: "writing",   label: "Writing summary with AI" },
];

export function GenerateReportButton({ projectId, hasGitHub = true, variant = "default", size = "default", iconOnly = false }: GenerateReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const generate = useGenerateReport();

  const activeStepIndex = STEPS.findIndex((s) => s.key === step);

  const handleGenerate = async () => {
    for (const s of STEPS) {
      setStep(s.key);
      await new Promise((r) => setTimeout(r, 1000));
    }
    try {
      await generate.mutateAsync(projectId);
      setStep("done");
      await new Promise((r) => setTimeout(r, 1400));
      setOpen(false);
      setStep("idle");
      toast({ title: "Report generated", description: "Your draft is ready in the Reports tab." });
    } catch {
      setStep("error");
      toast({ variant: "destructive", title: "Generation failed", description: "Check your GitHub connection and try again." });
    }
  };

  const handleClose = () => {
    if (step === "idle" || step === "done" || step === "error") {
      setOpen(false);
      setStep("idle");
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={iconOnly ? "h-7 w-7 p-0" : "gap-1.5"}
        onClick={() => setOpen(true)}
        disabled={!hasGitHub}
        title={!hasGitHub ? "Connect GitHub first" : "Generate Report"}
        data-testid="button-generate-report"
      >
        <Zap className={iconOnly ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
        {!iconOnly && "Report"}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {step === "idle" ? "Generate Report" : step === "done" ? "Report Generated!" : step === "error" ? "Generation Failed" : "Generating Report…"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {step === "idle" ? "AI-powered weekly status report from GitHub activity" : step === "done" ? "Your draft report is ready to review" : step === "error" ? "Report generation encountered an error" : "Fetching GitHub activity and generating report"}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-xs text-muted-foreground py-2">
                  ShipDesk will fetch this week's GitHub activity and write a polished plain-English status update. You can edit and publish it afterward.
                </p>
                {!hasGitHub && (
                  <div className="flex gap-2 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Connect a GitHub repository in Settings to generate reports.
                  </div>
                )}
              </motion.div>
            )}

            {(["fetching", "analyzing", "writing"] as Step[]).includes(step) && (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 space-y-2.5">
                {STEPS.map((s, i) => {
                  const isDone = activeStepIndex > i;
                  const isActive = activeStepIndex === i;
                  return (
                    <div key={s.key} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {isDone ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span className={`text-xs ${isActive ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-3 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2.5">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">Your draft report is ready in the Reports tab.</p>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2">
                <p className="text-xs text-destructive">Generation failed. Check your GitHub connection and Gemini API key, then try again.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter>
            {step === "idle" && (
              <>
                <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
                <Button size="sm" onClick={handleGenerate} className="gap-1.5" disabled={!hasGitHub}>
                  <Zap className="h-3.5 w-3.5" /> Generate
                </Button>
              </>
            )}
            {(step === "done" || step === "error") && (
              <Button size="sm" onClick={handleClose}>{step === "done" ? "Done" : "Close"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
