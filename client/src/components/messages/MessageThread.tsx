import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Message } from "@/types";
import { cn, formatRelative } from "@/lib/utils";

interface MessageThreadProps {
  messages: Message[];
  currentSenderType: "DEVELOPER" | "CLIENT";
  onSend: (body: string) => void | Promise<void>;
  isSending?: boolean;
  isLoading?: boolean;
}

export function MessageThread({ messages, currentSenderType, onSend, isSending, isLoading }: MessageThreadProps) {
  const [body, setBody] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!body.trim() || isSending) return;
    const text = body.trim();
    setBody("");
    setSendError(null);
    try {
      await onSend(text);
    } catch {
      setBody(text);
      setSendError("Failed to send. Please try again.");
    }
  };

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading ? (
          <>
            <div className="flex flex-col items-start gap-1">
              <Skeleton className="h-10 w-48 rounded-lg rounded-bl-sm" />
              <Skeleton className="h-3 w-24 mt-0.5" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-10 w-56 rounded-lg rounded-br-sm" />
              <Skeleton className="h-3 w-20 mt-0.5" />
            </div>
            <div className="flex flex-col items-start gap-1">
              <Skeleton className="h-8 w-40 rounded-lg rounded-bl-sm" />
              <Skeleton className="h-3 w-16 mt-0.5" />
            </div>
          </>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-8">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Messages between you and your client will appear here.
              </p>
            </div>
          </div>
        ) : (
          sorted.map((msg) => {
            const isOwn = msg.senderType === currentSenderType;
            return (
              <div key={msg.id} className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2.5 text-sm break-words",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  {msg.body}
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {msg.senderName} · {formatRelative(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex flex-col gap-1.5">
        {sendError && (
          <p className="text-xs text-destructive px-1" data-testid="text-send-error">{sendError}</p>
        )}
        <div className="flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => { setBody(e.target.value); if (sendError) setSendError(null); }}
            placeholder="Write a message…"
            className="resize-none min-h-[60px] max-h-[120px]"
            data-testid="input-message-body"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!body.trim() || isSending}
            size="icon"
            className="self-end h-10 w-10 shrink-0"
            data-testid="button-send-message"
          >
            {isSending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
