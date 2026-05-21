import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/reports/ReportCard";
import { useClientReports } from "@/hooks/useClientPortal";

export function ClientReportsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: reports, isLoading } = useClientReports(id);

  return (
    <div>
      <Link
        href={`/projects/${id}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold mb-6">Project Updates</h1>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (reports || []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No reports published yet.</div>
      ) : (
        <div className="space-y-3">
          {(reports || []).map((r) => (
            <Link key={r.id} href={`/projects/${id}/reports/${r.id}`} className="block">
              <ReportCard report={r} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
