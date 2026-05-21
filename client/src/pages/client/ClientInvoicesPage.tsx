import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceCard } from "@/components/invoices/InvoiceCard";
import { useClientInvoices } from "@/hooks/useClientPortal";

export function ClientInvoicesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoices, isLoading } = useClientInvoices(id);

  return (
    <div>
      <Link
        href={`/projects/${id}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold mb-6">Invoices</h1>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (invoices || []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No invoices yet.</div>
      ) : (
        <div className="space-y-3">
          {(invoices || []).map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} showPayButton />
          ))}
        </div>
      )}
    </div>
  );
}
