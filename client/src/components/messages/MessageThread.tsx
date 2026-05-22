import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Message } from "@/types";
import { cn, formatRelative } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

/* ─── Avatar helpers ──────────────────────────────────────────── */

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function MessageAvatar({ name }: { name: string }) {
  return (
    <div
      className={cn(
        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 select-none",
        getAvatarColor(name)
      )}
      aria-label={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Date separator ──────────────────────────────────────────── */

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[11px] font-medium text-muted-foreground/70 px-1 tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

/* ─── Grouping logic ──────────────────────────────────────────── */

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function isGrouped(prev: Message | undefined, curr: Message): boolean {
  if (!prev) return false;
  if (prev.senderType !== curr.senderType) return false;
  return new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
}

/* ─── Component ───────────────────────────────────────────────── */

interface MessageThreadProps {
  messages: Message[];
  currentSenderType: "DEVELOPER" | "CLIENT";
  onSend: (body: string) => void | Promise<void>;
  isSending?: boolean;
  isLoading?: boolean;
  projectName?: string;
}

export function MessageThread({
  messages,
  currentSenderType,
  onSend,
  isSending,
  isLoading,
  projectName,
}: MessageThreadProps) {
  const [body, setBody] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!body.trim() || isSending) return;
    const text = body.trim();
    setBody("");
    setSendError(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
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
    <div className="flex flex-col h-full bg-background">

      {/* ── Thread header ── */}
      {projectName && (
        <div className="px-4 py-3 border-b bg-card flex items-center gap-2.5 shrink-0">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-sm font-semibold truncate">{projectName}</span>
          <span className="text-xs text-muted-foreground shrink-0">· Client messages</span>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-0.5">
        {isLoading ? (
          <div className="space-y-5 pt-2">
            <div className="flex items-end gap-2">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-11 w-52 rounded-2xl rounded-bl-sm" />
              </div>
            </div>
            <div className="flex items-end gap-2 flex-row-reverse">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="space-y-1.5 flex flex-col items-end">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-11 w-64 rounded-2xl rounded-br-sm" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <Skeleton className="h-9 w-44 rounded-2xl rounded-bl-sm" />
            </div>
            <div className="flex items-end gap-2 flex-row-reverse">
              <div className="h-7 w-7 shrink-0" />
              <Skeleton className="h-9 w-36 rounded-2xl rounded-br-sm" />
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-8">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="max-w-xs">
              <p className="text-sm font-semibold">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Start the conversation — your client will receive a notification when you send a message.
              </p>
            </div>
          </div>
        ) : (
          <>
            {sorted.map((msg, i) => {
              const prev = sorted[i - 1];
              const next = sorted[i + 1];
              const isOwn = msg.senderType === currentSenderType;
              const grouped = isGrouped(prev, msg);
              const isLastInGroup = !next || !isGrouped(msg, next);
              const showDateSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);

              return (
                <div key={msg.id}>
                  {showDateSep && <DateSeparator date={msg.createdAt} />}

                  <div
                    className={cn(
                      "flex items-end gap-2 py-0.5",
                      isOwn ? "flex-row-reverse" : "flex-row",
                      grouped ? "mt-0" : "mt-2"
                    )}
                  >
                    {/* Avatar column — always takes space so bubbles align */}
                    <div className="w-7 shrink-0 self-end mb-0.5">
                      {!grouped && <MessageAvatar name={msg.senderName} />}
                    </div>

                    <div className={cn("flex flex-col max-w-[72%]", isOwn ? "items-end" : "items-start")}>
                      {/* Sender name on first message of a group */}
                      {!grouped && (
                        <span className="text-[11px] font-medium text-muted-foreground mb-1 px-1">
                          {msg.senderName}
                        </span>
                      )}

                      {/* Bubble */}
                      <div
                        className={cn(
                          "px-3.5 py-2 text-sm break-words leading-relaxed",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                            : "bg-muted rounded-2xl rounded-bl-sm"
                        )}
                        title={format(new Date(msg.createdAt), "MMM d, h:mm a")}
                      >
                        {msg.body}
                      </div>

                      {/* Timestamp at end of group */}
                      {isLastInGroup && (
                        <span className="text-[10px] text-muted-foreground/60 mt-1 px-1">
                          {formatRelative(msg.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} className="h-1" />
          </>
        )}
      </div>

      {/* ── Compose ── */}
      <div className="shrink-0 border-t bg-card p-3">
        {sendError && (
          <p className="text-xs text-destructive mb-1.5 px-1" data-testid="text-send-error">
            {sendError}
          </p>
        )}
        <div
          className={cn(
            "rounded-xl border bg-background transition-all",
            "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => { setBody(e.target.value); if (sendError) setSendError(null); }}
            placeholder="Write a message…"
            className="resize-none min-h-[52px] max-h-[140px] border-0 shadow-none focus-visible:ring-0 bg-transparent px-4 pt-3 pb-1.5 text-sm"
            data-testid="input-message-body"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
            <span className="text-[10px] text-muted-foreground/50 select-none">
              ↵ Send · Shift+↵ New line
            </span>
            <Button
              onClick={handleSend}
              disabled={!body.trim() || isSending}
              size="sm"
              className="h-8 gap-1.5 px-3"
              data-testid="button-send-message"
            >
              {isSending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Send className="h-3.5 w-3.5" />}
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
