import { useState } from "react";
import { useSEO } from "@/lib/seo";
import { Plus, Receipt, CheckCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { useInvoices, useMarkInvoicePaid, useDeleteInvoice } from "@/hooks/useInvoices";
import { useProjects } from "@/hooks/useProjects";
import { usePlan } from "@/hooks/usePlan";
import { PlanGate } from "@/components/ui/PlanGate";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "UNPAID", label: "Unpaid" },
  { key: "PAID", label: "Paid" },
  { key: "OVERDUE", label: "Overdue" },
] as const;

const STATUS_CONFIG = {
  UNPAID:  { label: "Unpaid",  variant: "warning"     as const, icon: Clock },
  PAID:    { label: "Paid",    variant: "success"     as const, icon: CheckCircle },
  OVERDUE: { label: "Overdue", variant: "destructive" as const, icon: AlertTriangle },
};

export function InvoicesPage() {
  useSEO({ title: "Invoices", noindex: true });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  const { capabilities } = usePlan();
  const { data: projectsData } = useProjects();
  const { data, isLoading } = useInvoices(
    projectFilter === "all" ? undefined : projectFilter,
    statusFilter === "all" ? undefined : statusFilter
  );
  const markPaid = useMarkInvoicePaid();
  const deleteInvoice = useDeleteInvoice();

  const invoices = data?.invoices || [];
  const projects = projectsData || [];

  if (capabilities && !capabilities.canUseInvoices) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-8">
        <PlanGate allowed={false} requiredPlan="STARTER" featureName="Invoices & Payments" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Sticky header + filters ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 sm:px-6 py-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold leading-tight">Invoices</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 shrink-0 h-8"
            onClick={() => setShowCreate(true)}
            data-testid="button-create-invoice"
          >
            <Plus className="h-3.5 w-3.5" /> New Invoice
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                  statusFilter === tab.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                }`}
                data-testid={`tab-status-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {projects.length > 0 && (
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-7 text-xs w-[160px]" data-testid="select-project-filter">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 sm:px-6 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-11 rounded" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <Receipt className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              {statusFilter !== "all" || projectFilter !== "all"
                ? "No invoices match the current filters."
                : "No invoices yet. Create one to get started."}
            </p>
            {statusFilter === "all" && projectFilter === "all" && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Create your first invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden bg-card overflow-x-auto">
            <Table className="min-w-[480px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="hidden sm:table-cell">Project</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Due</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const config = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.UNPAID;
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={inv.id} data-testid={`invoice-row-${inv.id}`}>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[140px]">
                        <span className="truncate block">{inv.projectName || "—"}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="font-medium text-sm leading-tight truncate">{inv.title}</p>
                        {inv.projectName && (
                          <p className="sm:hidden text-xs text-muted-foreground truncate mt-0.5">{inv.projectName}</p>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-sm whitespace-nowrap">
                        {formatCurrency(inv.amount, inv.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1 text-[10px] px-1.5 py-0.5 whitespace-nowrap">
                          <StatusIcon className="h-2.5 w-2.5" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(inv.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {inv.status !== "PAID" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => {
                                markPaid.mutate(inv.id);
                                toast({ title: "Marked as paid" });
                              }}
                              data-testid={`button-mark-paid-${inv.id}`}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {inv.status !== "PAID" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                deleteInvoice.mutate(inv.id);
                                toast({ title: "Invoice deleted" });
                              }}
                              title="Delete invoice"
                              data-testid={`button-delete-invoice-${inv.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {inv.status === "PAID" && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {inv.paidAt ? formatDate(inv.paidAt) : "Paid"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <InvoiceForm open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
