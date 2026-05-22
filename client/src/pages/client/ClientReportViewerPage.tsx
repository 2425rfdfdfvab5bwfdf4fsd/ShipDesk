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
      <div className="space-y-4 px-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="px-1">
        <Link
          href={`/projects/${id}/reports`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <p className="text-muted-foreground text-sm">Report not found.</p>
      </div>
    );
  }

  const content = report.content;

  return (
    <div className="min-w-0 w-full space-y-5 pb-8">
      {/* Back link */}
      <Link
        href={`/projects/${id}/reports`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" /> Back to Reports
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-lg font-bold leading-snug break-words sm:text-xl">
          {report.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDate(report.weekStartDate)} – {formatDate(report.weekEndDate)}
        </p>
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
        <div className="bg-card border rounded-lg p-3 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Summary</p>
          <p className="text-sm leading-relaxed break-words">{content.summary}</p>
        </div>
      )}

      {/* Key Highlights */}
      {content.highlights && content.highlights.length > 0 && (
        <div>
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
        <div>
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
      <div className="border-t pt-5 overflow-x-hidden">
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
    </div>
  );
}
