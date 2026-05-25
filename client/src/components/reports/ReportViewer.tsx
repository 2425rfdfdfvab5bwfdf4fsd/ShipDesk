import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Edit2, Eye, Save, Loader2, Trash2, Copy, Check, GitCommit, GitMerge, Tag, FileText, MessageSquare, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Report } from "@/types";

interface ReportContent {
  summary?: string | null;
  highlights?: string[] | null;
  nextSteps?: string[] | null;
  rawMarkdown?: string;
  generationWarning?: string | null;
  tone?: "formal" | "friendly" | "brief";
  stats?: {
    pushEvents: number;
    totalCommits: number;
    prsOpened: number;
    prsMerged: number;
    prsClosed: number;
    releases: number;
  };
  customContext?: string | null;
}

interface ReportViewerProps {
  report: Report;
  clientName?: string | null;
  onPublish?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  isPublishing?: boolean;
  canEdit?: boolean;
}

const TONE_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  formal:   { label: "Formal",   icon: FileText },
  friendly: { label: "Friendly", icon: MessageSquare },
  brief:    { label: "Brief",    icon: Minimize2 },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      title="Copy report to clipboard"
      data-testid="button-copy-report"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
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

export function ReportViewer({ report, clientName, onPublish, onEdit, onDelete, isPublishing, canEdit = false }: ReportViewerProps) {
  const [editMode, setEditMode] = useState(false);

  const content = typeof report.content === "object" && report.content !== null
    ? report.content as ReportContent
    : null;

  const rawMarkdown = content?.rawMarkdown || (typeof report.content === "string" ? report.content : "");

  const displayMarkdown = clientName
    ? rawMarkdown.replace(/^Hi,(\r?\n)/m, `Hi ${clientName},$1`)
    : rawMarkdown;

  const [editedMarkdown, setEditedMarkdown] = useState(rawMarkdown);

  const handleSaveEdit = () => {
    onEdit?.(report.id, editedMarkdown);
    setEditMode(false);
  };

  const stats = content?.stats;
  const tone = content?.tone;
  const toneConfig = tone ? TONE_LABELS[tone] : null;

  const hasStats = stats && (stats.totalCommits > 0 || stats.prsMerged > 0 || stats.releases > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 min-w-0 w-full"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg leading-tight break-words pr-1">
            {report.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {report.status === "PUBLISHED" ? "Published" : "Draft"} ·{" "}
              {report.generatedBy === "MANUAL" ? "Manual" : "Scheduled"}
            </p>
            {toneConfig && (
              <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5">
                <toneConfig.icon className="h-2.5 w-2.5" />
                {toneConfig.label}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <CopyButton text={displayMarkdown} />

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs sm:text-sm"
              onClick={() => {
                if (editMode) {
                  setEditMode(false);
                  setEditedMarkdown(rawMarkdown);
                } else {
                  setEditedMarkdown(rawMarkdown);
                  setEditMode(true);
                }
              }}
            >
              {editMode
                ? <><Eye className="h-3.5 w-3.5" /> Preview</>
                : <><Edit2 className="h-3.5 w-3.5" /> Edit</>}
            </Button>
          )}
          {canEdit && editMode && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs sm:text-sm" onClick={handleSaveEdit}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          )}
          {report.status === "DRAFT" && onPublish && (
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs sm:text-sm"
              onClick={() => onPublish(report.id)}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing…</>
              ) : (
                <><CheckCircle className="h-3.5 w-3.5" /> Publish to Client</>
              )}
            </Button>
          )}
          {canEdit && report.status === "DRAFT" && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-8 text-xs sm:text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (window.confirm("Delete this draft report? This cannot be undone.")) {
                  onDelete(report.id);
                }
              }}
              data-testid="button-delete-draft-report"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Draft
            </Button>
          )}
          {report.status === "PUBLISHED" && (
            <Badge variant="success" className="gap-1 text-xs">
              <CheckCircle className="h-3 w-3" /> Published
            </Badge>
          )}
        </div>
      </div>

      {/* Generation warning */}
      {content?.generationWarning && (
        <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium">Generation warning</p>
            <p className="text-xs mt-0.5 opacity-80 break-words">{content.generationWarning}</p>
          </div>
        </div>
      )}

      {/* Activity stats bar */}
      {hasStats && !editMode && (
        <div className="flex flex-wrap gap-2">
          <StatPill icon={GitCommit} label="commits" value={stats!.totalCommits} color="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400" />
          <StatPill icon={GitMerge} label="PRs merged" value={stats!.prsMerged} color="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-400" />
          <StatPill icon={Tag} label="release" value={stats!.releases} color="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400" />
          {stats!.prsOpened > 0 && (
            <StatPill icon={GitMerge} label="PRs open" value={stats!.prsOpened} color="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-400" />
          )}
        </div>
      )}

      {/* Summary */}
      {content?.summary && !editMode && (
        <div className="bg-muted/40 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">AI Summary</p>
          <p className="text-sm leading-relaxed break-words">{content.summary}</p>
        </div>
      )}

      {/* Highlights */}
      {content?.highlights && content.highlights.length > 0 && !editMode && (
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Highlights</p>
          <ul className="space-y-1.5">
            {content.highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span className="break-words min-w-0">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {content?.nextSteps && content.nextSteps.length > 0 && !editMode && (
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Next Steps</p>
          <ul className="space-y-1.5">
            {content.nextSteps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                <span className="break-words min-w-0">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Custom context note */}
      {content?.customContext && !editMode && (
        <div className="flex gap-2 p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground mb-0.5">Developer notes included</p>
            <p className="break-words">{content.customContext}</p>
          </div>
        </div>
      )}

      {/* Full report / edit area */}
      <div className="border rounded-lg p-3 sm:p-4 bg-card overflow-hidden">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Full Report</p>
        {editMode ? (
          <Textarea
            value={editedMarkdown}
            onChange={(e) => setEditedMarkdown(e.target.value)}
            className="font-mono text-xs sm:text-sm resize-none min-h-[260px] w-full"
            rows={16}
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none
            overflow-x-hidden
            [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:text-xs
            [&_code]:break-words [&_code]:text-xs
            [&_p]:break-words [&_li]:break-words
            [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm
            [&_table]:w-full [&_table]:text-xs [&_td]:p-1 [&_th]:p-1">
            <ReactMarkdown>{displayMarkdown || "*No content generated yet.*"}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
