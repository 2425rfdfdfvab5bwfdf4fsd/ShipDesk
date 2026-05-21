import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Edit2, Eye, Save, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Report } from "@/types";

interface ReportViewerProps {
  report: Report;
  onPublish?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  isPublishing?: boolean;
  canEdit?: boolean;
}

export function ReportViewer({ report, onPublish, onEdit, isPublishing, canEdit = false }: ReportViewerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState(
    typeof report.content === "object" && report.content !== null
      ? (report.content as { rawMarkdown?: string }).rawMarkdown || ""
      : ""
  );

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

  const handleSaveEdit = () => {
    onEdit?.(report.id, editedMarkdown);
    setEditMode(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg leading-tight">{report.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {report.status === "PUBLISHED" ? "Published" : "Draft"} ·{" "}
            {report.generatedBy === "MANUAL" ? "Manual" : "Scheduled"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
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
              {editMode ? <><Eye className="h-3.5 w-3.5" /> Preview</> : <><Edit2 className="h-3.5 w-3.5" /> Edit</>}
            </Button>
          )}
          {canEdit && editMode && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSaveEdit}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          )}
          {report.status === "DRAFT" && onPublish && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onPublish(report.id)}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing...</>
              ) : (
                <><CheckCircle className="h-3.5 w-3.5" /> Publish to Client</>
              )}
            </Button>
          )}
          {report.status === "PUBLISHED" && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" /> Published
            </Badge>
          )}
        </div>
      </div>

      {content?.generationWarning && (
        <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Generation warning</p>
            <p className="text-xs mt-0.5 opacity-80">{content.generationWarning}</p>
          </div>
        </div>
      )}

      {content?.summary && !editMode && (
        <div className="bg-muted/40 rounded-lg p-4">
          <p className="text-sm text-muted-foreground font-medium mb-1">Summary</p>
          <p className="text-sm">{content.summary}</p>
        </div>
      )}

      {content?.highlights && content.highlights.length > 0 && !editMode && (
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-2">Highlights</p>
          <ul className="space-y-1.5">
            {content.highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content?.nextSteps && content.nextSteps.length > 0 && !editMode && (
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-2">Next Steps</p>
          <ul className="space-y-1.5">
            {content.nextSteps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border rounded-lg p-4 bg-card">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Full Report</p>
        {editMode ? (
          <Textarea
            value={editedMarkdown}
            onChange={(e) => setEditedMarkdown(e.target.value)}
            className="font-mono text-sm resize-none min-h-[300px]"
            rows={16}
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{rawMarkdown || "*No content generated yet.*"}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
