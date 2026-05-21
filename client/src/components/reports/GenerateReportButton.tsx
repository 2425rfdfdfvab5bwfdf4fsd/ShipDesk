import { useState } from "react";
import { Zap, Check, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGenerateReport } from "@/hooks/useReports";
import { toast } from "@/hooks/use-toast";

interface GenerateReportButtonProps {
  projectId: string;
  hasGitHub?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

type Step = "idle" | "fetching" | "analyzing" | "writing" | "done" | "error";

const STEPS: { key: Step; label: string }[] = [
  { key: "fetching", label: "Fetching GitHub activity" },
  { key: "analyzing", label: "Analyzing commits & PRs" },
  { key: "writing", label: "Writing summary with AI" },
];

export function GenerateReportButton({ projectId, hasGitHub = true, variant = "default", size = "default" }: GenerateReportButtonProps) {
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
      toast({ title: "Report generated", description: "Your draft is ready to review in the Reports tab." });
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
        className="gap-2"
        onClick={() => setOpen(true)}
        disabled={!hasGitHub}
        title={!hasGitHub ? "Connect GitHub first" : undefined}
      >
        <Zap className="h-4 w-4" />
        Generate Report
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {step === "idle" ? "Generate Report" : step === "done" ? "Report Generated!" : step === "error" ? "Generation Failed" : "Generating Report..."}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-sm text-muted-foreground py-2">
                  ShipDesk will fetch this week's GitHub activity and use AI to write a polished plain-English status update. You can edit and publish it afterward.
                </p>
                {!hasGitHub && (
                  <div className="flex gap-2 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    Connect a GitHub repository in Settings to generate reports.
                  </div>
                )}
              </motion.div>
            )}

            {(["fetching", "analyzing", "writing"] as Step[]).includes(step) && (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 space-y-3">
                {STEPS.map((s, i) => {
                  const isDone = activeStepIndex > i;
                  const isActive = activeStepIndex === i;
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        {isDone ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : isActive ? (
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span className={`text-sm ${isActive ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Your draft report is ready in the Reports tab.</p>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3">
                <p className="text-sm text-destructive">Generation failed. Check your GitHub connection and Gemini API key, then try again.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter>
            {step === "idle" && (
              <>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleGenerate} className="gap-2" disabled={!hasGitHub}>
                  <Zap className="h-4 w-4" /> Generate
                </Button>
              </>
            )}
            {(step === "done" || step === "error") && (
              <Button onClick={handleClose}>{step === "done" ? "Done" : "Close"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
