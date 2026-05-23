import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Edit2, Eye, Save, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Report } from "@/types";

interface ReportViewerProps {
  report: Report;
  clientName?: string | null;
  onPublish?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  isPublishing?: boolean;
  canEdit?: boolean;
}

export function ReportViewer({ report, clientName, onPublish, onEdit, isPublishing, canEdit = false }: ReportViewerProps) {
  const [editMode, setEditMode] = useState(false);

  const content = typeof report.content === "object" && report.content !== null
    ? report.content as {
        summary?: string | null;
        highlights?: string[] | null;
        nextSteps?: string[] | null;
        rawMarkdown?: string;
        generationWarning?: string | null;
      }
    : null;

  const rawMarkdown = content?.rawMarkdown || (typeof report.content === "string" ? report.content : "");

  const displayMarkdown = clientName
    ? rawMarkdown.replace(/^Hi,(\r?\n)/m, `Hi ${clientName},\$1`)
    : rawMarkdown;

  const [editedMarkdown, setEditedMarkdown] = useState(rawMarkdown);

  const handleSaveEdit = () => {
    onEdit?.(report.id, editedMarkdown);
    setEditMode(false);
  };

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
          <p className="text-sm text-muted-foreground mt-0.5">
            {report.status === "PUBLISHED" ? "Published" : "Draft"} ·{" "}
            {report.generatedBy === "MANUAL" ? "Manual" : "Scheduled"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
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

      {/* Summary */}
      {content?.summary && !editMode && (
        <div className="bg-muted/40 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Summary</p>
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
