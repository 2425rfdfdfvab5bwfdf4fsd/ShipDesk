import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Urgency = "LOW" | "MEDIUM" | "HIGH";

interface ScopeChangeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; urgency: Urgency }) => Promise<void>;
}

export function ScopeChangeForm({ open, onClose, onSubmit }: ScopeChangeFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("MEDIUM");
  const [loading, setLoading] = useState(false);

  const isValid = title.trim().length >= 3 && description.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), urgency });
      toast({ title: "Request submitted", description: "The developer will review your request." });
      handleClose();
    } catch {
      toast({ variant: "destructive", title: "Failed to submit request" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setUrgency("MEDIUM");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Scope Change</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="sc-title">Title *</Label>
            <Input
              id="sc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add dark mode to the dashboard"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground">{title.length}/150</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sc-desc">Description *</Label>
            <Textarea
              id="sc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need in detail. Include any design references, constraints, or deadlines..."
              maxLength={2000}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{description.length}/2000</p>
          </div>

          <div className="space-y-2">
            <Label>Urgency</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low — not time-sensitive</SelectItem>
                <SelectItem value="MEDIUM">Medium — normal priority</SelectItem>
                <SelectItem value="HIGH">High — urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
