import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/types";

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "CAD", "AUD"];

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export function InvoiceForm({ open, onClose, defaultProjectId }: InvoiceFormProps) {
  const { data: projects } = useProjects();
  const createInvoice = useCreateInvoice();

  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [dueDate, setDueDate] = useState("");

  const parsedAmount = parseFloat(amount);
  const isValid = projectId && title.trim() && amount && !isNaN(parsedAmount) && parsedAmount > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await createInvoice.mutateAsync({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: parsedAmount,
        currency,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      toast({ title: "Invoice created", description: "Payment link generated via Lemon Squeezy." });
      handleClose();
    } catch {
      toast({ variant: "destructive", title: "Failed to create invoice" });
    }
  };

  const handleClose = () => {
    setProjectId(defaultProjectId || "");
    setTitle("");
    setDescription("");
    setAmount("");
    setCurrency("USD");
    setDueDate("");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="mb-4 pr-6">
          <SheetTitle>Create Invoice</SheetTitle>
          <SheetDescription>Add a new invoice and generate a payment link for your client.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!defaultProjectId && (
            <div className="space-y-1.5">
              <Label className="text-xs">Project *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger data-testid="select-invoice-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {(projects || []).filter((p) => p.status !== "COMPLETED").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="inv-title" className="text-xs">Title *</Label>
            <Input
              id="inv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Milestone 1 — Design & Architecture"
              maxLength={150}
              data-testid="input-invoice-title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-desc" className="text-xs">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="inv-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this invoice covers..."
              maxLength={1000}
              rows={3}
              className="resize-none"
              data-testid="input-invoice-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-amount" className="text-xs">Amount *</Label>
              <Input
                id="inv-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500.00"
                data-testid="input-invoice-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger data-testid="select-invoice-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {amount && !isNaN(parsedAmount) && parsedAmount > 0 && (
            <p className="text-sm font-semibold text-primary">
              Total: {formatCurrency(parsedAmount, currency)}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="inv-due" className="text-xs">Due Date <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="inv-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              data-testid="input-invoice-due-date"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t mt-4 shrink-0">
          <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createInvoice.isPending}
            className="flex-1"
            data-testid="button-submit-invoice"
          >
            {createInvoice.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</>
            ) : (
              "Create Invoice"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
