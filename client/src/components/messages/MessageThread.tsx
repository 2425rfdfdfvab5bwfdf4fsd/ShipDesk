import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, MessageSquare, ChevronDown, CheckCheck } from "lucide-react";
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
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-[11px] font-medium text-muted-foreground/60 tracking-wider uppercase select-none">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/50" />
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

/* ─── Skeleton loader ─────────────────────────────────────────── */

function MessageSkeleton() {
  return (
    <div className="space-y-5 pt-2 px-4">
      <div className="flex items-end gap-2">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-12 w-52 rounded-2xl rounded-bl-sm" />
        </div>
      </div>
      <div className="flex items-end gap-2 flex-row-reverse">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <div className="space-y-1.5 flex flex-col items-end">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-64 rounded-2xl rounded-br-sm" />
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
  );
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
  projectName,
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

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowScrollButton(false);
    setNewMessageCount(0);
  }, []);

  /* Track scroll position */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottom.current = atBottom;
    setShowScrollButton(!atBottom);
    if (atBottom) setNewMessageCount(0);
  }, []);

  /* On initial load — jump instantly to bottom (no animation) */
  useEffect(() => {
    if (!isLoading && sorted.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  /* On new messages — scroll if at bottom, else show badge */
  useEffect(() => {
    if (isLoading) return;
    const newCount = sorted.length - prevMessageCount.current;
    if (newCount <= 0) {
      prevMessageCount.current = sorted.length;
      return;
    }

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
      setSendError("Message failed to send. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background min-h-0">

      {/* ── Thread header ── */}
      {projectName && (
        <div className="px-4 py-2.5 border-b bg-card/80 backdrop-blur-sm flex items-center gap-2.5 shrink-0">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span className="text-sm font-semibold truncate">{projectName}</span>
          <span className="text-xs text-muted-foreground shrink-0">· Client thread</span>
          {unreadCount > 0 && (
            <span className="ml-auto shrink-0 text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
              {unreadCount} unread
            </span>
          )}
        </div>
      )}

      {/* ── Messages scroll area ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 py-4 space-y-0.5"
        data-testid="messages-scroll-area"
      >
        {isLoading ? (
          <MessageSkeleton />
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-6 py-12">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-semibold">No messages yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Send a message to start the conversation. Your client will receive an email notification.
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
                      grouped ? "mt-0" : "mt-2.5"
                    )}
                  >
                    {/* Avatar column */}
                    <div className="w-7 shrink-0 self-end mb-0.5">
                      {!grouped && isLastInGroup && <MessageAvatar name={msg.senderName} />}
                    </div>

                    <div className={cn(
                      "flex flex-col min-w-0",
                      "max-w-[78%] sm:max-w-[65%]",
                      isOwn ? "items-end" : "items-start"
                    )}>
                      {/* Sender name on first of group */}
                      {!grouped && (
                        <span className="text-[11px] font-medium text-muted-foreground mb-1 px-1 select-none">
                          {msg.senderName}
                        </span>
                      )}

                      {/* Bubble */}
                      <div
                        className={cn(
                          "px-3.5 py-2 text-sm break-words leading-relaxed",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                            : "bg-muted rounded-2xl rounded-bl-sm text-foreground"
                        )}
                        title={format(new Date(msg.createdAt), "MMM d, h:mm a")}
                      >
                        {msg.body}
                      </div>

                      {/* Timestamp + read receipt at end of group */}
                      {isLastInGroup && (
                        <div className={cn(
                          "flex items-center gap-1 mt-1 px-1",
                          isOwn ? "flex-row-reverse" : "flex-row"
                        )}>
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatRelative(msg.createdAt)}
                          </span>
                          {isOwn && isRead && (
                            <CheckCheck className="h-3 w-3 text-primary/60" title="Read by client" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* ── Scroll-to-bottom FAB ── */}
      {showScrollButton && (
        <div className="absolute bottom-[88px] sm:bottom-[84px] right-4 sm:right-6 z-10">
          <button
            onClick={() => scrollToBottom("smooth")}
            className="flex items-center gap-1.5 rounded-full bg-card border shadow-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
            data-testid="button-scroll-to-bottom"
          >
            {newMessageCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {newMessageCount > 9 ? "9+" : newMessageCount}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Compose area ── */}
      <div className="shrink-0 border-t bg-card px-3 sm:px-4 pt-3 pb-3 sm:pb-4">
        {sendError && (
          <p className="text-xs text-destructive mb-2 px-1" data-testid="text-send-error">
            {sendError}
          </p>
        )}
        <div
          className={cn(
            "rounded-xl border bg-background transition-all duration-150",
            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (sendError) setSendError(null);
            }}
            placeholder="Write a message…"
            className="resize-none min-h-[48px] max-h-[120px] border-0 shadow-none focus-visible:ring-0 bg-transparent px-3.5 pt-3 pb-1.5 text-sm leading-relaxed"
            data-testid="input-message-body"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5 gap-2">
            <span className="text-[10px] text-muted-foreground/40 select-none hidden sm:block">
              Enter to send · Shift+Enter for new line
            </span>
            <span className="text-[10px] text-muted-foreground/40 select-none sm:hidden">
              Shift+Enter for new line
            </span>
            <Button
              onClick={handleSend}
              disabled={!body.trim() || isSending}
              size="sm"
              className="h-8 gap-1.5 px-3 shrink-0"
              data-testid="button-send-message"
            >
              {isSending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Send className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
