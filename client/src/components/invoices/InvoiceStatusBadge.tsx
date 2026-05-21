import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type InvoiceStatus = "UNPAID" | "PAID" | "OVERDUE";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const CONFIG: Record<InvoiceStatus, { label: string; variant: "warning" | "success" | "destructive"; icon: React.ElementType }> = {
  UNPAID: { label: "Unpaid", variant: "warning", icon: Clock },
  PAID: { label: "Paid", variant: "success", icon: CheckCircle },
  OVERDUE: { label: "Overdue", variant: "destructive", icon: AlertTriangle },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const { label, variant, icon: Icon } = CONFIG[status] ?? CONFIG.UNPAID;
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
