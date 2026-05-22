import { motion } from "framer-motion";
import { Clock, DollarSign, AlertTriangle, CheckCircle, XCircle, HelpCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScopeChange } from "@/types";
import { formatRelative, formatCurrency } from "@/lib/utils";

interface ScopeChangeCardProps {
  sc: ScopeChange;
  onWriteQuote?: (sc: ScopeChange) => void;
  onMarkPaid?: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "info" | "success" | "destructive" | "secondary"; icon: React.ElementType }> = {
  PENDING:  { label: "Pending",  variant: "warning",     icon: Clock },
  QUOTED:   { label: "Quoted",   variant: "info",        icon: HelpCircle },
  APPROVED: { label: "Approved", variant: "success",     icon: CheckCircle },
  DECLINED: { label: "Declined", variant: "destructive", icon: XCircle },
  PAID:     { label: "Paid",     variant: "success",     icon: DollarSign },
};

const URGENCY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW:    { label: "Low",    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  MEDIUM: { label: "Medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  HIGH:   { label: "High",   className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function ScopeChangeCard({ sc, onWriteQuote, onMarkPaid }: ScopeChangeCardProps) {
  const status = STATUS_CONFIG[sc.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const urgency = URGENCY_CONFIG[sc.urgency] ?? URGENCY_CONFIG.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-3 bg-card"
      data-testid={`scope-card-${sc.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-snug truncate">{sc.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sc.description}</p>
        </div>
        <Badge variant={status.variant} className="gap-1 shrink-0 text-[10px] px-1.5 py-0.5">
          <StatusIcon className="h-2.5 w-2.5" />
          {status.label}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${urgency.className}`}>
          {sc.urgency === "HIGH" && <AlertTriangle className="h-2.5 w-2.5" />}
          {urgency.label}
        </span>
        <span className="text-[10px] text-muted-foreground">{formatRelative(sc.submittedAt)}</span>
        {sc.quotePrice && (
          <span className="text-[10px] font-semibold text-primary ml-auto">
            {formatCurrency(Number(sc.quotePrice), sc.quoteCurrency || "USD")}
          </span>
        )}
      </div>

      {sc.quoteDescription && (
        <div className="mt-2.5 p-2.5 bg-muted/40 rounded">
          <p className="text-[10px] text-muted-foreground font-medium mb-1">Your quote</p>
          <div className="text-xs" dangerouslySetInnerHTML={{ __html: sc.quoteDescription }} />
        </div>
      )}

      {sc.status === "APPROVED" && sc.paymentUrl && (
        <div className="mt-2">
          <a
            href={sc.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-2.5 w-2.5" /> Payment link
          </a>
        </div>
      )}

      {(sc.status === "PENDING" || sc.status === "APPROVED") && (
        <div className="mt-2.5 flex justify-end gap-1.5">
          {sc.status === "PENDING" && onWriteQuote && (
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => onWriteQuote(sc)}>
              Write Quote
            </Button>
          )}
          {sc.status === "APPROVED" && onMarkPaid && (
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => onMarkPaid(sc.id)}>
              Mark Paid
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
