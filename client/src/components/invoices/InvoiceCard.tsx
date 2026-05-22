import { DollarSign, CheckCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceCardProps {
  invoice: Invoice;
  onMarkPaid?: (id: string) => void;
  onDelete?: (id: string) => void;
  showPayButton?: boolean;
}

const STATUS_CONFIG = {
  UNPAID:  { label: "Unpaid",  variant: "warning"     as const, icon: Clock },
  PAID:    { label: "Paid",    variant: "success"     as const, icon: CheckCircle },
  OVERDUE: { label: "Overdue", variant: "destructive" as const, icon: AlertTriangle },
};

export function InvoiceCard({ invoice, onMarkPaid, onDelete, showPayButton }: InvoiceCardProps) {
  const config = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.UNPAID;
  const Icon = config.icon;

  return (
    <div className="border rounded-lg p-3 bg-card" data-testid={`invoice-card-${invoice.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{invoice.title}</h4>
          {invoice.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{invoice.description}</p>
          )}
        </div>
        <Badge variant={config.variant} className="gap-1 shrink-0 text-[10px] px-1.5 py-0.5">
          <Icon className="h-2.5 w-2.5" />
          {config.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-2.5 gap-2">
        <div>
          <p className="text-base font-bold leading-tight">
            {formatCurrency(invoice.amount, invoice.currency)}
          </p>
          {invoice.dueDate && (
            <p className="text-[10px] text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {showPayButton && invoice.status !== "PAID" && invoice.paymentUrl && (
            <Button size="sm" className="h-7 text-xs px-2.5" asChild>
              <a href={invoice.paymentUrl} target="_blank" rel="noopener noreferrer">Pay Now</a>
            </Button>
          )}
          {onMarkPaid && invoice.status !== "PAID" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => onMarkPaid(invoice.id)}
              data-testid={`button-mark-paid-${invoice.id}`}
            >
              Mark Paid
            </Button>
          )}
          {onDelete && invoice.status !== "PAID" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(invoice.id)}
              title="Delete invoice"
              data-testid={`button-delete-invoice-${invoice.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
