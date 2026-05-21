import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "border rounded-lg p-4 bg-card hover:shadow-md transition-shadow",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-snug">{report.title}</h4>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(report.weekStartDate)} – {formatDate(report.weekEndDate)}
            </span>
            <span className="flex items-center gap-1">
              {report.generatedBy === "MANUAL" ? (
                <Zap className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {report.generatedBy === "MANUAL" ? "Manual" : "Scheduled"}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {report.status === "PUBLISHED" ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Published
            </Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Generated {formatRelative(report.generatedAt)}
      </p>
    </motion.div>
  );
}
