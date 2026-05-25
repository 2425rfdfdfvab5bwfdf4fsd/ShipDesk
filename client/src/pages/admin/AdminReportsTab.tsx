import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { ChevronLeft, ChevronRight, Search, Zap, Hand } from "lucide-react";
import { format } from "date-fns";

interface AdminReport {
  id: string; title: string; status: "DRAFT" | "PUBLISHED";
  generatedAt: string; weekStartDate: string; weekEndDate: string;
  generatedBy: "SCHEDULED" | "MANUAL";
  project: { name: string; workspace: { slug: string; name: string } };
}
interface PagedResponse { reports: AdminReport[]; total: number; page: number; pages: number; }

export function AdminReportsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery<PagedResponse>({
    queryKey: ["admin-reports", page, search],
    queryFn: () =>
      adminApi.get("/api/admin/reports", { params: { page, search: search || undefined } }).then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Reports</h2>
          <p className="text-sm text-white/50">{data?.total ?? "—"} AI-generated status reports</p>
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
              placeholder="Search title or project…"
              className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 w-56"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors font-medium">
            Search
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] border-b border-white/10">
              <tr>
                {["Title", "Project / Workspace", "Week", "Status", "Source", "Generated"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3.5">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td></tr>
                  ))
                : data?.reports.length === 0
                ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                    No reports found{search ? ` for "${search}"` : ""}
                  </td></tr>
                )
                : data?.reports.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white text-sm max-w-[200px] truncate">{r.title}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white/70 text-sm">{r.project.name}</div>
                        <div className="text-[11px] text-white/35 font-mono mt-0.5">{r.project.workspace.slug}</div>
                      </td>
                      <td className="px-4 py-3.5 text-white/45 text-xs whitespace-nowrap">
                        {format(new Date(r.weekStartDate), "MMM d")} – {format(new Date(r.weekEndDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "PUBLISHED" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-white/45"}`}>
                          {r.status === "PUBLISHED" ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${r.generatedBy === "SCHEDULED" ? "bg-indigo-500/15 text-indigo-400" : "bg-violet-500/15 text-violet-400"}`}>
                          {r.generatedBy === "SCHEDULED"
                            ? <><Zap className="h-2.5 w-2.5" /> Auto</>
                            : <><Hand className="h-2.5 w-2.5" /> Manual</>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">
                        {format(new Date(r.generatedAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))
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
