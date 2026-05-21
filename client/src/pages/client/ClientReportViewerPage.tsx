import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientReport } from "@/hooks/useClientPortal";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export function ClientReportViewerPage() {
  const { id, reportId } = useParams<{ id: string; reportId: string }>();
  const { data: report, isLoading } = useClientReport(id, reportId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <Link
          href={`/projects/${id}/reports`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <p className="text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  const content = report.content;

  return (
    <div>
      <Link
        href={`/projects/${id}/reports`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Reports
      </Link>

      <h1 className="text-xl font-bold mb-1">{report.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {formatDate(report.weekStartDate)} – {formatDate(report.weekEndDate)}
      </p>

      {content.generationWarning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300 mb-4">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Report formatting may be incomplete.
        </div>
      )}

      {content.summary && (
        <div className="bg-card border rounded-lg p-4 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Summary</p>
          <p className="text-sm leading-relaxed">{content.summary}</p>
        </div>
      )}

      {content.highlights && content.highlights.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Key Highlights</h3>
          <ul className="space-y-1.5">
            {content.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-6">
        <ReactMarkdown>{content.rawMarkdown}</ReactMarkdown>
      </div>
    </div>
  );
}
