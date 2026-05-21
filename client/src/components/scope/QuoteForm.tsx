import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ScopeChange, Currency } from "@/types";

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "CAD", "AUD"];

interface QuoteFormProps {
  scopeChange: ScopeChange | null;
  onClose: () => void;
  onSubmit: (data: { id: string; quoteDescription: string; quotePrice: number; quoteCurrency: Currency }) => Promise<void>;
}

function ToolbarButton({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded text-sm transition-colors ${active ? "bg-accent text-accent-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

export function QuoteForm({ scopeChange, onClose, onSubmit }: QuoteFormProps) {
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [loading, setLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[120px] p-3 text-sm focus:outline-none",
      },
    },
  });

  const htmlContent = editor?.getHTML() || "";
  const textContent = editor?.getText() || "";
  const parsedPrice = parseFloat(price);
  const isValid = textContent.trim().length >= 10 && price && !isNaN(parsedPrice) && parsedPrice > 0;

  const handleSubmit = async () => {
    if (!scopeChange || !isValid) return;
    setLoading(true);
    try {
      await onSubmit({
        id: scopeChange.id,
        quoteDescription: htmlContent,
        quotePrice: parsedPrice,
        quoteCurrency: currency,
      });
      toast({ title: "Quote sent to client" });
      handleClose();
    } catch {
      toast({ variant: "destructive", title: "Failed to send quote" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    editor?.commands.setContent("");
    setPrice("");
    setCurrency("USD");
    onClose();
  };

  return (
    <Dialog open={!!scopeChange} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Write Quote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/50 rounded-md text-sm">
            <p className="font-medium text-xs text-muted-foreground mb-0.5">Client request</p>
            <p className="font-medium">{scopeChange?.title}</p>
            {scopeChange?.description && (
              <p className="text-muted-foreground text-xs mt-1 line-clamp-3">{scopeChange.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quote Description *</Label>
            <div className="border rounded-md overflow-hidden">
              <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  active={editor?.isActive("bold")}
                >
                  <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  active={editor?.isActive("italic")}
                >
                  <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  active={editor?.isActive("bulletList")}
                >
                  <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  active={editor?.isActive("orderedList")}
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
              </div>
              <EditorContent editor={editor} />
            </div>
            <p className="text-xs text-muted-foreground">Describe the work, timeline, and any conditions clearly.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quote-price">Price *</Label>
              <Input
                id="quote-price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="500.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</> : "Send Quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
