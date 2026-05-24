import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { Search, ChevronLeft, ChevronRight, Github } from "lucide-react";
import { format } from "date-fns";

interface AdminUser {
  id: string; email: string; name: string; createdAt: string;
  workspace: {
    slug: string; name: string; agencyName: string | null;
    onboardingComplete: boolean;
    _count: { projects: number; clients: number };
  } | null;
}
interface PagedResponse { users: AdminUser[]; total: number; page: number; pages: number; }

export function AdminUsersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery<PagedResponse>({
    queryKey: ["admin-users", page, search],
    queryFn: () =>
      adminApi.get("/api/admin/users", { params: { page, search } }).then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Users</h2>
          <p className="text-sm text-white/50">{data?.total ?? "—"} registered developers</p>
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
              placeholder="Search by name or email…"
              className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 w-64"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {["Name / Email", "Workspace", "Projects", "Clients", "Onboarded", "Joined"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td></tr>
                  ))
                : data?.users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-white/40 font-mono">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {u.workspace ? (
                          <div>
                            <div className="text-white/80">{u.workspace.agencyName || u.workspace.name}</div>
                            <div className="text-xs text-white/40 font-mono">{u.workspace.slug}</div>
                          </div>
                        ) : <span className="text-white/30 text-xs italic">No workspace</span>}
                      </td>
                      <td className="px-4 py-3 text-white/70">{u.workspace?._count.projects ?? "—"}</td>
                      <td className="px-4 py-3 text-white/70">{u.workspace?._count.clients ?? "—"}</td>
                      <td className="px-4 py-3">
                        {u.workspace ? (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${u.workspace.onboardingComplete ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                            {u.workspace.onboardingComplete ? "Yes" : "Pending"}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/50">
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
