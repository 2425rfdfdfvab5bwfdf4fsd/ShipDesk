import { useState } from "react";
import { Link } from "wouter";
import { Zap, Check, Loader2, AlertTriangle, Lock, ArrowRight, ChevronDown, FileText, MessageSquare, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateReport, ReportTone, GenerateReportOptions } from "@/hooks/useReports";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GenerateReportButtonProps {
  projectId: string;
  hasGitHub?: boolean;
  canUseAiReports?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  iconOnly?: boolean;
  existingDraftThisWeek?: boolean;
}

type Step = "idle" | "fetching" | "analyzing" | "writing" | "done" | "error";

type DatePreset = "this-week" | "last-week" | "last-2-weeks" | "last-month" | "custom";

interface ToneOption {
  value: ReportTone;
  label: string;
  description: string;
  icon: typeof FileText;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    value: "formal",
    label: "Formal",
    description: "Professional, structured update with clear sections",
    icon: FileText,
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and conversational — like an update from a trusted teammate",
    icon: MessageSquare,
  },
  {
    value: "brief",
    label: "Brief",
    description: "3–5 bullets only — for busy clients who want the quick version",
    icon: Minimize2,
  },
];

const PROCESS_STEPS: { key: Step; label: string }[] = [
  { key: "fetching",  label: "Fetching GitHub activity" },
  { key: "analyzing", label: "Analyzing commits & PRs" },
  { key: "writing",   label: "Writing summary with AI" },
];

function getDateRange(preset: DatePreset, customFrom: string, customTo: string): { dateFrom: string; dateTo: string } | null {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "custom") {
    if (!customFrom || !customTo) return null;
    return { dateFrom: customFrom, dateTo: customTo };
  }

  if (preset === "this-week") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { dateFrom: fmt(monday), dateTo: fmt(sunday) };
  }

  if (preset === "last-week") {
    const day = now.getDay();
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(thisMonday);
    lastSunday.setDate(thisMonday.getDate() - 1);
    return { dateFrom: fmt(lastMonday), dateTo: fmt(lastSunday) };
  }

  if (preset === "last-2-weeks") {
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return { dateFrom: fmt(twoWeeksAgo), dateTo: fmt(yesterday) };
  }

  if (preset === "last-month") {
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return { dateFrom: fmt(monthAgo), dateTo: fmt(yesterday) };
  }

  return null;
}

export function GenerateReportButton({ projectId, hasGitHub = true, canUseAiReports = true, variant = "default", size = "default", iconOnly = false, existingDraftThisWeek = false }: GenerateReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");

  const [datePreset, setDatePreset] = useState<DatePreset>("this-week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tone, setTone] = useState<ReportTone>("formal");
  const [customContext, setCustomContext] = useState("");
  const [showContext, setShowContext] = useState(false);

  const generate = useGenerateReport();

  if (!canUseAiReports) {
    return (
      <Button
        asChild
        variant={variant}
        size={size}
        className={iconOnly ? "h-7 w-7 p-0" : "gap-1.5"}
        title="Upgrade to Starter to generate AI reports"
        data-testid="button-generate-report-locked"
      >
        <Link href="/billing">
          <Lock className="h-3.5 w-3.5" />
          {!iconOnly && <><span>Upgrade</span><ArrowRight className="h-3 w-3" /></>}
        </Link>
      </Button>
    );
  }

  const activeStepIndex = PROCESS_STEPS.findIndex((s) => s.key === step);

  const handleGenerate = async () => {
    if (existingDraftThisWeek && datePreset === "this-week") {
      toast({
        title: "Draft already exists for this week",
        description: "Generating a new one anyway.",
      });
    }

    const range = getDateRange(datePreset, customFrom, customTo);
    if (datePreset === "custom" && !range) {
      toast({ variant: "destructive", title: "Please enter both a start and end date." });
      return;
    }

    const options: GenerateReportOptions = {
      tone,
      ...(range ?? {}),
      ...(customContext.trim() ? { customContext: customContext.trim() } : {}),
    };

    for (const s of PROCESS_STEPS) {
      setStep(s.key);
      await new Promise((r) => setTimeout(r, 1000));
    }

    try {
      await generate.mutateAsync({ projectId, options });
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

  const DATE_PRESETS: { value: DatePreset; label: string }[] = [
    { value: "this-week",   label: "This week" },
    { value: "last-week",   label: "Last week" },
    { value: "last-2-weeks", label: "Past 2 weeks" },
    { value: "last-month",  label: "Past 30 days" },
    { value: "custom",      label: "Custom range" },
  ];

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={iconOnly ? "h-7 w-7 p-0" : "gap-1.5"}
        onClick={() => setOpen(true)}
        disabled={!hasGitHub}
        title={!hasGitHub ? "Connect GitHub first" : "Generate AI Report"}
        data-testid="button-generate-report"
      >
        <Zap className="h-3.5 w-3.5" />
        {!iconOnly && "Report"}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {step === "idle" ? "Generate AI Report" : step === "done" ? "Report Generated!" : step === "error" ? "Generation Failed" : "Generating Report…"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              AI-powered status report from GitHub activity
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Date Range */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Date range</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DATE_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setDatePreset(p.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs border transition-colors",
                          datePreset === p.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {datePreset === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex gap-2 items-center"
                    >
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Writing style</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TONE_OPTIONS.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTone(t.value)}
                          title={t.description}
                          className={cn(
                            "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs transition-colors",
                            tone === t.value
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="font-medium">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    {TONE_OPTIONS.find((t) => t.value === tone)?.description}
                  </p>
                </div>

                {/* Custom context */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => setShowContext((v) => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown className={cn("h-3 w-3 transition-transform", showContext && "rotate-180")} />
                    Add context the AI can't see from GitHub
                  </button>
                  {showContext && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <Textarea
                        placeholder="e.g. Had a strategy call with client on Tuesday. Resolved a critical production issue with the payment gateway. Spent time on infrastructure planning."
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        maxLength={2000}
                        rows={3}
                        className="text-xs resize-none"
                        data-testid="input-report-custom-context"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        These notes will be woven into the AI-generated report. {customContext.length}/2000
                      </p>
                    </motion.div>
                  )}
                </div>

                {!hasGitHub && (
                  <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Connect a GitHub repository in Settings to generate reports.
                  </div>
                )}
              </motion.div>
            )}

            {(["fetching", "analyzing", "writing"] as Step[]).includes(step) && (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 space-y-2.5">
                {PROCESS_STEPS.map((s, i) => {
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
                      <span className={cn("text-xs", isActive ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/40")}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground pt-1">This usually takes 15–30 seconds…</p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-3 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2.5">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">Your draft is ready in the Reports tab. Review and publish when ready.</p>
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
