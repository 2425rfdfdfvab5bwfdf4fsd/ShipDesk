import { useState } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientScopeChanges, useSubmitClientScopeChange, useRespondToScopeChange } from "@/hooks/useClientPortal";
import { toast } from "@/hooks/use-toast";
import { formatRelative, formatCurrency } from "@/lib/utils";

const STATUS_COLORS: Record<string, "warning" | "info" | "success" | "destructive" | "secondary"> = {
  PENDING: "warning",
  QUOTED: "info",
  APPROVED: "info",
  DECLINED: "destructive",
  PAID: "success",
};

export function ClientScopeChangePage() {
  const { id } = useParams<{ id: string }>();
  const { data: scopeChanges, isLoading } = useClientScopeChanges(id);
  const submitScopeChange = useSubmitClientScopeChange();
  const respond = useRespondToScopeChange();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", urgency: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      await submitScopeChange.mutateAsync({ projectId: id, ...form });
      setSubmitted(true);
    } catch {
      toast({ variant: "destructive", title: "Failed to submit request" });
    }
  };

  return (
    <div>
      <Link
        href={`/projects/${id}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Change Requests</h1>
        <Button size="sm" className="gap-1.5" onClick={() => { setShowForm(true); setSubmitted(false); }}>
          <Plus className="h-4 w-4" /> Request a Change
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (scopeChanges || []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No change requests yet.</div>
      ) : (
        <div className="space-y-4">
          {(scopeChanges || []).map((sc) => (
            <div key={sc.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="font-medium">{sc.title}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">{sc.description}</p>
                </div>
                <Badge variant={STATUS_COLORS[sc.status] || "secondary"}>{sc.status}</Badge>
              </div>

              {sc.status === "QUOTED" && sc.quoteDescription && (
                <div className="bg-muted rounded-md p-3 mt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Quote from developer</p>
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: sc.quoteDescription }} />
                  {sc.quotePrice && (
                    <p className="font-semibold text-sm mt-2">
                      {formatCurrency(sc.quotePrice, sc.quoteCurrency || "USD")}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        respond.mutate({ id: sc.id, decision: "APPROVED" });
                        toast({ title: "Quote approved" });
                      }}
                      disabled={respond.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        respond.mutate({ id: sc.id, decision: "DECLINED" });
                        toast({ title: "Quote declined" });
                      }}
                      disabled={respond.isPending}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {sc.status === "APPROVED" && sc.paymentUrl && (
                <Button size="sm" className="mt-3" asChild>
                  <a href={sc.paymentUrl} target="_blank" rel="noopener noreferrer">Pay Now</a>
                </Button>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                Submitted {formatRelative(sc.submittedAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Change</DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p className="text-green-600 font-medium mb-2">✓ Request submitted!</p>
              <p>Your request has been submitted. Your project manager will review it and get back to you.</p>
              <Button className="mt-4" onClick={() => setShowForm(false)}>Close</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Add dark mode to the dashboard" maxLength={150} />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the change you'd like..." rows={4} className="resize-none" maxLength={2000} />
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v as "LOW" | "MEDIUM" | "HIGH" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low — no rush</SelectItem>
                      <SelectItem value="MEDIUM">Medium — sometime soon</SelectItem>
                      <SelectItem value="HIGH">High — urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  disabled={!form.title || !form.description || submitScopeChange.isPending}
                  onClick={handleSubmit}
                >
                  {submitScopeChange.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
