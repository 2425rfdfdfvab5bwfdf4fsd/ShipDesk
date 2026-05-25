import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { formatDistanceToNow } from "date-fns";
import {
  Users, FolderKanban, FileText, MessageSquare, GitMerge,
  Github, DollarSign, Upload, Users2, LogIn, RefreshCw,
} from "lucide-react";

interface ActivityEvent {
  id: string; type: string; label: string; sublabel: string;
  meta: string; ts: string; workspace?: string;
}
interface ActivityResponse { feed: ActivityEvent[]; }

const TYPE_CONFIG: Record<string, { icon: typeof Users; color: string; dot: string }> = {
  user_joined:      { icon: Users,         color: "text-indigo-400",  dot: "bg-indigo-500" },
  project_created:  { icon: FolderKanban,  color: "text-emerald-400", dot: "bg-emerald-500" },
  report_generated: { icon: FileText,      color: "text-cyan-400",    dot: "bg-cyan-500" },
  message_sent:     { icon: MessageSquare, color: "text-blue-400",    dot: "bg-blue-500" },
  scope_change:     { icon: GitMerge,      color: "text-amber-400",   dot: "bg-amber-500" },
  github_event:     { icon: Github,        color: "text-white/60",    dot: "bg-white/40" },
  invoice_created:  { icon: DollarSign,    color: "text-yellow-400",  dot: "bg-yellow-500" },
  file_uploaded:    { icon: Upload,        color: "text-teal-400",    dot: "bg-teal-500" },
  team_activity:    { icon: Users2,        color: "text-violet-400",  dot: "bg-violet-500" },
  client_login:     { icon: LogIn,         color: "text-rose-400",    dot: "bg-rose-500" },
};

const TYPE_LABELS: Record<string, string> = {
  "": "All activity",
  user_joined: "Sign-ups",
  project_created: "Projects",
  report_generated: "Reports",
  message_sent: "Messages",
  scope_change: "Scope changes",
  github_event: "GitHub",
  invoice_created: "Invoices",
  file_uploaded: "Files",
  team_activity: "Team",
  client_login: "Client logins",
};

export function AdminActivityTab() {
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery<ActivityResponse>({
    queryKey: ["admin-activity"],
    queryFn: () => adminApi.get("/api/admin/activity").then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const filtered = typeFilter
    ? (data?.feed ?? []).filter((e) => e.type === typeFilter)
    : (data?.feed ?? []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Platform Activity</h2>
          <p className="text-sm text-white/50">
            Live feed of all events across all workspaces
            {data && <span className="ml-1">· {data.feed.length} events</span>}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${
              typeFilter === value
                ? "bg-indigo-500 border-indigo-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activity timeline */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/5 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-1/3" />
                </div>
                <div className="h-3 bg-white/5 rounded animate-pulse w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/30 text-sm">No activity found{typeFilter ? ` for "${TYPE_LABELS[typeFilter]}"` : ""}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((event) => {
              const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.user_joined;
              const Icon = cfg.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Icon dot */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${cfg.dot}/15 border ${cfg.dot}/25`}>
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-snug">{event.label}</p>
                    {event.sublabel && (
                      <p className="text-xs text-white/45 mt-0.5 truncate">{event.sublabel}</p>
                    )}
                    {event.meta && (
                      <p className="text-[11px] text-white/30 mt-1 font-mono">{event.meta}</p>
                    )}
                  </div>

                  {/* Workspace + time */}
                  <div className="flex-shrink-0 text-right">
                    {event.workspace && (
                      <p className="text-[10px] text-white/30 font-mono mb-0.5">{event.workspace}</p>
                    )}
                    <p className="text-xs text-white/35 whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.ts), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-white/25 text-center">
        Showing the {filtered.length} most recent events · auto-refreshes every 60 s
      </p>
    </div>
  );
}
