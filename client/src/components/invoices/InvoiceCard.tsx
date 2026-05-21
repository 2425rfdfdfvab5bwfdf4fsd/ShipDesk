import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
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
  UNPAID: { label: "Unpaid", variant: "warning" as const, icon: Clock },
  PAID: { label: "Paid", variant: "success" as const, icon: CheckCircle },
  OVERDUE: { label: "Overdue", variant: "destructive" as const, icon: AlertTriangle },
};

export function InvoiceCard({ invoice, onMarkPaid, onDelete, showPayButton }: InvoiceCardProps) {
  const config = STATUS_CONFIG[invoice.status];
  const Icon = config.icon;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{invoice.title}</h4>
          {invoice.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{invoice.description}</p>
          )}
        </div>
        <Badge variant={config.variant} className="gap-1 flex-shrink-0">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-lg font-bold">
            {formatCurrency(invoice.amount, invoice.currency)}
          </p>
          {invoice.dueDate && (
            <p className="text-xs text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
          )}
        </div>

        <div className="flex gap-2">
          {showPayButton && invoice.status !== "PAID" && invoice.paymentUrl && (
            <Button size="sm" asChild>
              <a href={invoice.paymentUrl} target="_blank" rel="noopener noreferrer">
                Pay Now
              </a>
            </Button>
          )}
          {onMarkPaid && invoice.status !== "PAID" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkPaid(invoice.id)}
            >
              Mark Paid
            </Button>
          )}
          {onDelete && invoice.status !== "PAID" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(invoice.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
