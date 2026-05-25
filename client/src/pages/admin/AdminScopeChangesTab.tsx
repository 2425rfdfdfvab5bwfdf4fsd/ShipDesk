import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { ChevronLeft, ChevronRight, Search, AlertCircle, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface AdminScopeChange {
  id: string; title: string; description: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "QUOTED" | "APPROVED" | "DECLINED" | "PAID";
  quotePrice: string | null; quoteCurrency: string | null;
  submittedAt: string; quotedAt: string | null; respondedAt: string | null; paidAt: string | null;
  project: { name: string; workspace: { slug: string; name: string; agencyName: string | null } };
  client: { email: string; name: string | null };
}
interface PagedResponse { scopeChanges: AdminScopeChange[]; total: number; page: number; pages: number; }

const STATUS_STYLES: Record<string, { cls: string; icon: typeof Clock; label: string }> = {
  PENDING:  { cls: "bg-amber-500/15 text-amber-400",   icon: Clock,        label: "Pending" },
  QUOTED:   { cls: "bg-blue-500/15 text-blue-400",     icon: DollarSign,   label: "Quoted" },
  APPROVED: { cls: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle, label: "Approved" },
  DECLINED: { cls: "bg-red-500/15 text-red-400",       icon: XCircle,      label: "Declined" },
  PAID:     { cls: "bg-purple-500/15 text-purple-400", icon: CheckCircle,  label: "Paid" },
};

const URGENCY_STYLES: Record<string, string> = {
  LOW:    "bg-white/10 text-white/50",
  MEDIUM: "bg-amber-500/15 text-amber-400",
  HIGH:   "bg-red-500/15 text-red-400",
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "QUOTED", label: "Quoted" },
  { value: "APPROVED", label: "Approved" },
  { value: "DECLINED", label: "Declined" },
  { value: "PAID", label: "Paid" },
];

export function AdminScopeChangesTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery<PagedResponse>({
    queryKey: ["admin-scope-changes", page, status, search],
    queryFn: () =>
      adminApi.get("/api/admin/scope-changes", {
        params: { page, status: status || undefined, search: search || undefined },
      }).then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Scope Changes</h2>
          <p className="text-sm text-white/50">{data?.total ?? "—"} scope change requests platform-wide</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, project, client…"
              className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 w-56"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors font-medium">
            Search
          </button>
        </form>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatus(value); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${
              status === value
                ? "bg-indigo-500 border-indigo-500 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] border-b border-white/10">
              <tr>
                {["Title", "Client", "Project / Workspace", "Urgency", "Status", "Quote", "Submitted"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-3.5">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td></tr>
                  ))
                : data?.scopeChanges.length === 0
                ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                    No scope changes found{status ? ` with status ${status}` : ""}{search ? ` for "${search}"` : ""}
                  </td></tr>
                )
                : data?.scopeChanges.map((sc) => {
                    const statusCfg = STATUS_STYLES[sc.status];
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={sc.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-white text-sm max-w-[180px] truncate">{sc.title}</div>
                          <div className="text-[11px] text-white/35 mt-0.5 max-w-[180px] truncate">{sc.description}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-white/70 text-sm">{sc.client.name || "—"}</div>
                          <div className="text-[11px] text-white/35 font-mono mt-0.5">{sc.client.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-white/70 text-sm">{sc.project.name}</div>
                          <div className="text-[11px] text-white/35 font-mono mt-0.5">
                            {sc.project.workspace.agencyName || sc.project.workspace.name} · {sc.project.workspace.slug}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_STYLES[sc.urgency]}`}>
                            {sc.urgency === "HIGH" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {sc.urgency.charAt(0) + sc.urgency.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {sc.quotePrice ? (
                            <span className="text-sm font-mono font-semibold text-white">
                              {sc.quoteCurrency} {Number(sc.quotePrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          ) : <span className="text-white/30 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">
                          {format(new Date(sc.submittedAt), "MMM d, yyyy")}
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>Page {data.page} of {data.pages} · {data.total} total</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
