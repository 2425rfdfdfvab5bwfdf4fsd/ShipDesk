import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message } from "@/types";
import { cn, formatRelative } from "@/lib/utils";

interface MessageThreadProps {
  messages: Message[];
  currentSenderType: "DEVELOPER" | "CLIENT";
  onSend: (body: string) => void;
  isSending?: boolean;
}

export function MessageThread({ messages, currentSenderType, onSend, isSending }: MessageThreadProps) {
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!body.trim()) return;
    onSend(body.trim());
    setBody("");
  };

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {sorted.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            No messages yet. Start the conversation!
          </div>
        )}
        {sorted.map((msg) => {
          const isOwn = msg.senderType === currentSenderType;
          return (
            <div key={msg.id} className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
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
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message..."
          className="resize-none min-h-[60px] max-h-[120px]"
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
          className="self-end h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
