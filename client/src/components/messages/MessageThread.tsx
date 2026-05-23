import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, MessageSquare, ChevronDown, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Message } from "@/types";
import { cn, formatRelative } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

/* ─── Avatar helpers ──────────────────────────────────────────── */

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500",  "bg-sky-500",
  "bg-indigo-500", "bg-teal-500",
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
    <div className="flex items-center gap-3 my-3 px-1">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-[10px] font-medium text-muted-foreground/50 tracking-wider uppercase select-none px-1">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

/* ─── Grouping helpers ────────────────────────────────────────── */

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function isGrouped(prev: Message | undefined, curr: Message) {
  if (!prev) return false;
  if (prev.senderType !== curr.senderType) return false;
  return new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
}

/* ─── Message body — preserves line breaks ────────────────────── */

function MessageBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

/* ─── Skeleton loader ─────────────────────────────────────────── */

function MessageSkeleton() {
  return (
    <div className="space-y-4 pt-2 px-4">
      <div className="flex items-end gap-2">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-11 w-48 rounded-2xl rounded-bl-sm" />
        </div>
      </div>
      <div className="flex items-end gap-2 flex-row-reverse">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <div className="space-y-1.5 flex flex-col items-end">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-9 w-56 rounded-2xl rounded-br-sm" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <Skeleton className="h-8 w-36 rounded-2xl rounded-bl-sm" />
      </div>
      <div className="flex items-end gap-2 flex-row-reverse">
        <div className="h-7 w-7 shrink-0" />
        <Skeleton className="h-8 w-44 rounded-2xl rounded-br-sm" />
      </div>
    </div>
  );
}

/* ─── Auto-resize textarea hook ───────────────────────────────── */

function useAutoResize(value: string, ref: React.RefObject<HTMLTextAreaElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value, ref]);
}

/* ─── Component ───────────────────────────────────────────────── */

interface MessageThreadProps {
  messages: Message[];
  currentSenderType: "DEVELOPER" | "CLIENT";
  onSend: (body: string) => void | Promise<void>;
  isSending?: boolean;
  isLoading?: boolean;
  projectName?: string;
  unreadCount?: number;
}

export function MessageThread({
  messages,
  currentSenderType,
  onSend,
  isSending,
  isLoading,
  unreadCount = 0,
}: MessageThreadProps) {
  const [body, setBody] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageCount = useRef(messages.length);
  const isAtBottom = useRef(true);

  useAutoResize(body, textareaRef);

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowScrollButton(false);
    setNewMessageCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottom.current = atBottom;
    setShowScrollButton(!atBottom);
    if (atBottom) setNewMessageCount(0);
  }, []);

  /* Initial load — jump to bottom instantly */
  useEffect(() => {
    if (!isLoading && sorted.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  /* New messages — scroll if at bottom, else show badge */
  useEffect(() => {
    if (isLoading) return;
    const newCount = sorted.length - prevMessageCount.current;
    if (newCount <= 0) { prevMessageCount.current = sorted.length; return; }
    if (isAtBottom.current) {
      scrollToBottom("smooth");
    } else {
      setNewMessageCount((n) => n + newCount);
      setShowScrollButton(true);
    }
    prevMessageCount.current = sorted.length;
  }, [sorted.length, isLoading, scrollToBottom]);

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

  const charLimit = 5000;
  const nearLimit = body.length > charLimit * 0.85;

  return (
    <div className="flex flex-col h-full bg-background min-h-0">

      {/* ── Messages scroll area ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 py-3"
        data-testid="messages-scroll-area"
      >
        {isLoading ? (
          <MessageSkeleton />
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full text-center gap-4 px-6 py-16">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="max-w-xs space-y-1.5">
              <p className="text-sm font-semibold">No messages yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Send a message below to start the conversation. Your client will receive an email notification.
              </p>
            </div>
          </div>
        ) : (
          <div className="px-3 sm:px-4">
            {sorted.map((msg, i) => {
              const prev = sorted[i - 1];
              const next = sorted[i + 1];
              const isOwn = msg.senderType === currentSenderType;
              const grouped = isGrouped(prev, msg);
              const isLastInGroup = !next || !isGrouped(msg, next);
              const showDateSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
              const isRead = isOwn && (
                currentSenderType === "DEVELOPER"
                  ? !!msg.readByClientAt
                  : !!msg.readByDeveloperAt
              );

              return (
                <div key={msg.id}>
                  {showDateSep && <DateSeparator date={msg.createdAt} />}

                  <div
                    className={cn(
                      "flex items-end gap-2 py-0.5",
                      isOwn ? "flex-row-reverse" : "flex-row",
                      grouped ? "mt-0.5" : "mt-3"
                    )}
                  >
                    {/* Avatar — only on last of group */}
                    <div className="w-7 shrink-0 self-end mb-0.5">
                      {!grouped && isLastInGroup && <MessageAvatar name={msg.senderName} />}
                    </div>

                    <div className={cn(
                      "flex flex-col min-w-0 max-w-[80%] sm:max-w-[62%]",
                      isOwn ? "items-end" : "items-start"
                    )}>
                      {/* Sender name — first in group */}
                      {!grouped && (
                        <span className="text-[10px] font-semibold text-muted-foreground mb-1 px-1 select-none tracking-wide">
                          {msg.senderName}
                        </span>
                      )}

                      {/* Bubble */}
                      <div
                        className={cn(
                          "px-3.5 py-2 text-sm break-words leading-relaxed rounded-2xl",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-[4px]"
                            : "bg-muted text-foreground rounded-bl-[4px]"
                        )}
                      >
                        <MessageBody text={msg.body} />
                      </div>

                      {/* Timestamp + read receipt at end of group */}
                      {isLastInGroup && (
                        <div className={cn(
                          "flex items-center gap-1 mt-1 px-0.5",
                          isOwn ? "flex-row-reverse" : "flex-row"
                        )}>
                          <span className="text-[10px] text-muted-foreground/55 select-none">
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                          {isOwn && (
                            <CheckCheck
                              className={cn(
                                "h-3 w-3 transition-colors",
                                isRead ? "text-primary/70" : "text-muted-foreground/40"
                              )}
                              aria-label={isRead ? "Read" : "Delivered"}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} className="h-1" />
          </div>
        )}

        {/* ── Scroll-to-bottom FAB — sticky inside scroll area ── */}
        {showScrollButton && (
          <div className="sticky bottom-3 flex justify-end pr-3 sm:pr-5 pointer-events-none">
            <button
              onClick={() => scrollToBottom("smooth")}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-card border shadow-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent active:scale-95 transition-all"
              data-testid="button-scroll-to-bottom"
            >
              {newMessageCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {newMessageCount > 9 ? "9+" : newMessageCount} new
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Compose area ── */}
      <div
        className="shrink-0 border-t bg-card px-3 sm:px-4 pt-2.5 pb-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
      >
        {sendError && (
          <p className="text-xs text-destructive mb-2 px-0.5" data-testid="text-send-error">
            {sendError}
          </p>
        )}

        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border bg-background transition-all duration-150",
            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10",
            unreadCount > 0 && "ring-1 ring-primary/20"
          )}
        >
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              if (e.target.value.length <= charLimit) {
                setBody(e.target.value);
                if (sendError) setSendError(null);
              }
            }}
            placeholder="Write a message…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed px-3.5 pt-2.5 pb-2.5 min-h-[42px] max-h-[120px] outline-none placeholder:text-muted-foreground/50"
            data-testid="input-message-body"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex flex-col items-end gap-1 pr-2 pb-2 shrink-0">
            {nearLimit && (
              <span className={cn(
                "text-[10px] tabular-nums leading-none",
                body.length >= charLimit ? "text-destructive" : "text-muted-foreground/60"
              )}>
                {charLimit - body.length}
              </span>
            )}
            <Button
              onClick={handleSend}
              disabled={!body.trim() || isSending}
              size="sm"
              className="h-8 w-8 p-0 rounded-lg shrink-0"
              data-testid="button-send-message"
            >
              {isSending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/40 mt-1.5 px-0.5 select-none">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
