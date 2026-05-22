import { CalendarDays, Zap, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportMeta } from "@/types";
import { formatDate, formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ReportCardProps {
  report: ReportMeta;
  onClick?: () => void;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-lg p-3 bg-card transition-colors",
        onClick && "cursor-pointer hover:bg-accent/40 active:bg-accent/60"
      )}
      data-testid={`report-card-${report.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-snug truncate">{report.title}</h4>
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-2.5 w-2.5" />
              {formatDate(report.weekStartDate)} – {formatDate(report.weekEndDate)}
            </span>
            <span className="flex items-center gap-1">
              {report.generatedBy === "MANUAL" ? <Zap className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
              {report.generatedBy === "MANUAL" ? "Manual" : "Scheduled"}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          {report.status === "PUBLISHED" ? (
            <Badge variant="success" className="gap-1 text-[10px] px-1.5 py-0.5">
              <CheckCircle className="h-2.5 w-2.5" /> Published
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Draft</Badge>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">
        Generated {formatRelative(report.generatedAt)}
      </p>
    </div>
  );
}
