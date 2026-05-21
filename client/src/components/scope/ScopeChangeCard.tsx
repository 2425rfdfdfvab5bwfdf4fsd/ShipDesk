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
  PENDING: { label: "Pending", variant: "warning", icon: Clock },
  QUOTED: { label: "Quoted", variant: "info", icon: HelpCircle },
  APPROVED: { label: "Approved", variant: "success", icon: CheckCircle },
  DECLINED: { label: "Declined", variant: "destructive", icon: XCircle },
  PAID: { label: "Paid", variant: "success", icon: DollarSign },
};

const URGENCY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  MEDIUM: { label: "Medium", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  HIGH: { label: "High", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function ScopeChangeCard({ sc, onWriteQuote, onMarkPaid }: ScopeChangeCardProps) {
  const status = STATUS_CONFIG[sc.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const urgency = URGENCY_CONFIG[sc.urgency] ?? URGENCY_CONFIG.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-4 bg-card"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-snug">{sc.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sc.description}</p>
        </div>
        <Badge variant={status.variant} className="gap-1 flex-shrink-0">
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${urgency.className}`}>
          {sc.urgency === "HIGH" && <AlertTriangle className="h-3 w-3" />}
          {urgency.label} urgency
        </span>
        <span className="text-xs text-muted-foreground">{formatRelative(sc.submittedAt)}</span>

        {sc.quotePrice && (
          <span className="text-xs font-semibold text-primary ml-auto">
            Quote: {formatCurrency(Number(sc.quotePrice), sc.quoteCurrency || "USD")}
          </span>
        )}
      </div>

      {sc.quoteDescription && (
        <div className="mt-3 p-3 bg-muted/40 rounded-md">
          <p className="text-xs text-muted-foreground font-medium mb-1">Your quote</p>
          <div
            className="text-xs prose-xs"
            dangerouslySetInnerHTML={{ __html: sc.quoteDescription }}
          />
        </div>
      )}

      {(sc.status === "APPROVED" && sc.paymentUrl) && (
        <div className="mt-3 flex items-center gap-2">
          <a
            href={sc.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Payment link
          </a>
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        {sc.status === "PENDING" && onWriteQuote && (
          <Button size="sm" variant="outline" onClick={() => onWriteQuote(sc)}>
            Write Quote
          </Button>
        )}
        {sc.status === "APPROVED" && onMarkPaid && (
          <Button size="sm" variant="outline" onClick={() => onMarkPaid(sc.id)}>
            Mark Paid
          </Button>
        )}
      </div>
    </motion.div>
  );
}
