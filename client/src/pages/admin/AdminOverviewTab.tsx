import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { Users, Building2, FolderKanban, FileText, DollarSign, Github, MessageSquare, GitMerge, CheckCircle, TrendingUp } from "lucide-react";

interface Stats {
  users: number; workspaces: number; projects: number; activeProjects: number;
  reports: number; publishedReports: number; invoices: number; paidInvoices: number;
  totalRevenue: number; clients: number; githubConnections: number;
  scopeChanges: number; messages: number;
}

const STAT_CARDS = (s: Stats) => [
  { label: "Total Users", value: s.users, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { label: "Workspaces", value: s.workspaces, icon: Building2, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { label: "GitHub Connected", value: s.githubConnections, icon: Github, color: "text-gray-400", bg: "bg-white/5 border-white/10" },
  { label: "Clients", value: s.clients, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Total Projects", value: s.projects, icon: FolderKanban, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "Active Projects", value: s.activeProjects, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { label: "Total Reports", value: s.reports, icon: FileText, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { label: "Published Reports", value: s.publishedReports, icon: CheckCircle, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  { label: "Total Invoices", value: s.invoices, icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { label: "Paid Invoices", value: s.paidInvoices, icon: CheckCircle, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { label: "Revenue Collected", value: `$${s.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { label: "Scope Changes", value: s.scopeChanges, icon: GitMerge, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { label: "Messages Sent", value: s.messages, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
];

export function AdminOverviewTab() {
  const { data: stats, isLoading, isError } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.get("/api/admin/stats").then((r) => r.data),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return <p className="text-red-400 text-sm">Failed to load stats. Check your admin key and try again.</p>;
  }

  const cards = STAT_CARDS(stats);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Platform Overview</h2>
        <p className="text-sm text-white/50">Live stats across all tenants</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-xl border p-4 ${card.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50 font-medium">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
