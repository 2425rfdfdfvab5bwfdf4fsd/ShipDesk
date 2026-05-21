import { useState } from "react";
import { motion } from "framer-motion";
import { GitMerge } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScopeChangeCard } from "@/components/scope/ScopeChangeCard";
import { QuoteForm } from "@/components/scope/QuoteForm";
import { useScopeChanges, useSubmitQuote, useMarkScopeChangePaid } from "@/hooks/useScopeChanges";
import { toast } from "@/hooks/use-toast";
import { ScopeChange } from "@/types";

const STATUSES = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "QUOTED", label: "Quoted" },
  { key: "APPROVED", label: "Approved" },
  { key: "DECLINED", label: "Declined" },
  { key: "PAID", label: "Paid" },
] as const;

export function ScopeChangesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [quoteTarget, setQuoteTarget] = useState<ScopeChange | null>(null);

  const { data: scopeChanges, isLoading } = useScopeChanges(
    undefined,
    statusFilter === "all" ? undefined : statusFilter
  );
  const submitQuote = useSubmitQuote();
  const markPaid = useMarkScopeChangePaid();

  const items = scopeChanges || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Scope Changes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Client-submitted change requests across all projects
        </p>
      </div>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              statusFilter === s.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-muted/30 rounded-xl border border-dashed"
        >
          <GitMerge className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">
            {statusFilter === "all"
              ? "No scope change requests yet."
              : `No ${statusFilter.toLowerCase()} scope changes.`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {items.map((sc, i) => (
            <motion.div
              key={sc.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ScopeChangeCard
                sc={sc}
                onWriteQuote={setQuoteTarget}
                onMarkPaid={(id) => {
                  markPaid.mutate(id);
                  toast({ title: "Marked as paid" });
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      <QuoteForm
        scopeChange={quoteTarget}
        onClose={() => setQuoteTarget(null)}
        onSubmit={async ({ id, quoteDescription, quotePrice, quoteCurrency }) => {
          await submitQuote.mutateAsync({ id, quoteDescription, quotePrice, quoteCurrency });
          setQuoteTarget(null);
          toast({ title: "Quote sent to client" });
        }}
      />
    </div>
  );
}
