import { useState } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import {
  ArrowLeft, AlertTriangle, Clock, GitCommit, GitMerge, Tag,
  TrendingUp, TrendingDown, Minus, Check, Printer, Share2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientReport, useClientProject } from "@/hooks/useClientPortal";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { PortalErrorBanner } from "@/components/layout/PortalErrorBanner";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { printReport } from "@/lib/printReport";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWorkspaceSlug(): string | null {
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length >= 3 && parts[1] === "portal") return parts[0];
  const match = window.location.pathname.match(/^\/portal\/([a-z0-9-]+)/);
  return match ? match[1] : null;
}

interface ReportStats {
  pushEvents: number;
  totalCommits: number;
  prsOpened: number;
  prsMerged: number;
  prsClosed: number;
  releases: number;
}

type ReactionKey = "great" | "questions" | "approved";

const REACTIONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: "great",     emoji: "👍", label: "Looks great"   },
  { key: "questions", emoji: "🤔", label: "Have questions" },
  { key: "approved",  emoji: "✅", label: "Approved"       },
];

function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function computeHealth(stats: ReportStats | undefined): {
  label: string; color: string; icon: typeof TrendingUp; description: string;
} {
  if (!stats) return { label: "Unknown", color: "text-muted-foreground border-border bg-muted/30", icon: Minus, description: "No activity data" };
  const { totalCommits, prsMerged, releases } = stats;
  if (releases >= 1 || prsMerged >= 3 || totalCommits >= 10)
    return { label: "High Activity", color: "text-green-700 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/40", icon: TrendingUp, description: "Strong momentum this week" };
  if (prsMerged >= 1 || totalCommits >= 3)
    return { label: "Moderate Activity", color: "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/40", icon: TrendingUp, description: "Steady progress this week" };
  return { label: "Low Activity", color: "text-slate-500 border-slate-200 bg-slate-50 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-900/40", icon: TrendingDown, description: "Quiet week — less GitHub activity recorded" };
}

function StatPill({ icon: Icon, label, value, color }: { icon: typeof GitCommit; label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${color}`}>
      <Icon className="h-3 w-3" />
      <span className="font-medium">{value}</span>
      <span className="text-[10px] opacity-70">{label}</span>
    </div>
  );
}

function ReactionBar({ reportId }: { reportId: string }) {
  const storageKey = `reaction_${reportId}`;
  const [selected, setSelected] = useState<ReactionKey | null>(() => {
    try { return localStorage.getItem(storageKey) as ReactionKey | null; }
    catch { return null; }
  });

  const handleReact = (key: ReactionKey) => {
    const next = selected === key ? null : key;
    setSelected(next);
    try {
      if (next) localStorage.setItem(storageKey, next);
      else localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-col gap-2 pt-5 border-t" data-testid="section-reactions">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your reaction</p>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ key, emoji, label }) => (
          <button
            key={key}
            onClick={() => handleReact(key)}
            data-testid={`button-reaction-${key}`}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm
              transition-all duration-150 select-none
              ${selected === key
                ? "bg-primary/10 border-primary/40 text-primary font-medium scale-105"
                : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/50"}
            `}
          >
            <span className="text-base leading-none">{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground"
        >
          Thanks for your feedback! Reach out via the messages tab if you have any questions.
        </motion.p>
      )}
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 h-8 text-xs"
      onClick={handleCopy}
      data-testid="button-copy-link"
      title="Copy link to this report"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy Link"}
    </Button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ClientReportViewerPage() {
  const { id, reportId } = useParams<{ id: string; reportId: string }>();
  const workspaceSlug = getWorkspaceSlug();

  const { data: report,   isLoading: reportLoading,  isError } = useClientReport(id, reportId);
  const { data: project,  isLoading: projectLoading          } = useClientProject(id);
  const { data: branding                                      } = usePortalBranding(workspaceSlug ?? "");

  const isLoading = reportLoading || projectLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 px-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-1 space-y-4">
        <Link href={`/projects/${id}/reports`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <PortalErrorBanner />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="px-1">
        <Link href={`/projects/${id}/reports`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <p className="text-muted-foreground text-sm">Report not found.</p>
      </div>
    );
  }

  const content = report.content;
  const stats = (content as { stats?: ReportStats }).stats;
  const hasStats = stats && (stats.totalCommits > 0 || stats.prsMerged > 0 || stats.releases > 0);
  const health = computeHealth(stats);
  const HealthIcon = health.icon;
  const readTime = content.rawMarkdown ? readingTime(content.rawMarkdown) : null;

  const handlePrint = () => {
    printReport({
      title:         report.title,
      weekStartDate: report.weekStartDate,
      weekEndDate:   report.weekEndDate,
      projectName:   project?.name ?? undefined,
      summary:       content.summary,
      highlights:    content.highlights,
      nextSteps:     content.nextSteps,
      rawMarkdown:   content.rawMarkdown,
      stats:         stats,
      branding:      branding
        ? { agencyName: branding.agencyName, logoUrl: branding.logoUrl, primaryColor: branding.primaryColor }
        : undefined,
      generatedDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    });
  };

  return (
    <div className="min-w-0 w-full space-y-5 pb-10">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Link href={`/projects/${id}/reports`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 shrink-0" /> Back to Reports
        </Link>
        <div className="flex items-center gap-2">
          <CopyLinkButton />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handlePrint}
            data-testid="button-print-report"
            title="Open print-ready PDF preview"
          >
            <Printer className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Title + meta */}
      <div>
        <h1 className="text-lg font-bold leading-snug break-words sm:text-xl">{report.title}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          <p className="text-sm text-muted-foreground">
            {formatDate(report.weekStartDate)} – {formatDate(report.weekEndDate)}
          </p>
          {readTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-reading-time">
              <Clock className="h-3 w-3" />{readTime}
            </span>
          )}
        </div>
      </div>

      {/* Health + stats */}
      <div className="flex flex-wrap items-center gap-2" data-testid="section-stats">
        <div
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${health.color}`}
          title={health.description}
          data-testid="badge-health"
        >
          <HealthIcon className="h-3 w-3" />
          {health.label}
        </div>
        {hasStats && (
          <>
            <StatPill icon={GitCommit} label="commits"   value={stats!.totalCommits} color="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400" />
            <StatPill icon={GitMerge}  label="PRs merged" value={stats!.prsMerged}    color="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-400" />
            <StatPill icon={Tag}       label="release"    value={stats!.releases}     color="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400" />
            {stats!.prsOpened > 0 && (
              <StatPill icon={GitMerge} label="PRs open" value={stats!.prsOpened} color="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-400" />
            )}
          </>
        )}
      </div>

      {/* Generation warning */}
      {content.generationWarning && (
        <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Report formatting may be incomplete.</span>
        </div>
      )}

      {/* Summary */}
      {content.summary && (
        <div className="bg-card border rounded-lg p-3 sm:p-4" data-testid="section-summary">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Summary</p>
          <p className="text-sm leading-relaxed break-words">{content.summary}</p>
        </div>
      )}

      {/* Key Highlights */}
      {content.highlights && content.highlights.length > 0 && (
        <div data-testid="section-highlights">
          <h3 className="font-semibold text-sm mb-2.5">Key Highlights</h3>
          <ul className="space-y-2">
            {content.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span className="break-words min-w-0">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {content.nextSteps && content.nextSteps.length > 0 && (
        <div data-testid="section-next-steps">
          <h3 className="font-semibold text-sm mb-2.5">Next Steps</h3>
          <ul className="space-y-2">
            {content.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                <span className="break-words min-w-0">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full report markdown */}
      <div className="border-t pt-5 overflow-x-hidden" data-testid="section-full-report">
        <div className="prose prose-sm dark:prose-invert max-w-none
          [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:text-xs
          [&_code]:break-words [&_code]:text-xs
          [&_p]:break-words [&_li]:break-words
          [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm
          [&_table]:w-full [&_table]:text-xs [&_td]:p-1 [&_th]:p-1
          [&_strong]:font-semibold">
          <ReactMarkdown>{content.rawMarkdown}</ReactMarkdown>
        </div>
      </div>

      {/* Emoji reactions */}
      <ReactionBar reportId={reportId} />
    </div>
  );
}
