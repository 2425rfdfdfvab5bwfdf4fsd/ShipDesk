import { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceCard } from "@/components/invoices/InvoiceCard";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { useInvoices, useMarkInvoicePaid, useDeleteInvoice } from "@/hooks/useInvoices";
import { toast } from "@/hooks/use-toast";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "UNPAID", label: "Unpaid" },
  { key: "PAID", label: "Paid" },
  { key: "OVERDUE", label: "Overdue" },
] as const;

export function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useInvoices(
    undefined,
    statusFilter === "all" ? undefined : statusFilter
  );
  const markPaid = useMarkInvoicePaid();
  const deleteInvoice = useDeleteInvoice();

  const invoices = data?.invoices || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button className="gap-1.5" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              statusFilter === tab.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : invoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-muted/30 rounded-xl border border-dashed"
        >
          <Receipt className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            {statusFilter === "all"
              ? "No invoices yet. Create one to get started."
              : `No ${statusFilter.toLowerCase()} invoices.`}
          </p>
          {statusFilter === "all" && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Create your first invoice
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <InvoiceCard
                invoice={inv}
                onMarkPaid={(id) => {
                  markPaid.mutate(id);
                  toast({ title: "Marked as paid" });
                }}
                onDelete={(id) => {
                  deleteInvoice.mutate(id);
                  toast({ title: "Invoice deleted" });
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      <InvoiceForm open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
