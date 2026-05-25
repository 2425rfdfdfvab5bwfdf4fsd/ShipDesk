import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface AdminInvoice {
  id: string; title: string; amount: string; currency: string;
  status: "UNPAID" | "PAID" | "OVERDUE"; dueDate: string | null; createdAt: string;
  project: { name: string; workspace: { slug: string; name: string } };
}
interface PagedResponse { invoices: AdminInvoice[]; total: number; page: number; pages: number; }

const STATUS_STYLES: Record<string, string> = {
  PAID:   "bg-emerald-500/15 text-emerald-400",
  UNPAID: "bg-amber-500/15 text-amber-400",
  OVERDUE: "bg-red-500/15 text-red-400",
};

export function AdminInvoicesTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<PagedResponse>({
    queryKey: ["admin-invoices", page, status],
    queryFn: () =>
      adminApi.get("/api/admin/invoices", { params: { page, status: status || undefined } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const filters = [
    { value: "", label: "All" },
    { value: "UNPAID", label: "Unpaid" },
    { value: "PAID", label: "Paid" },
    { value: "OVERDUE", label: "Overdue" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Invoices</h2>
          <p className="text-sm text-white/50">{data?.total ?? "—"} invoices platform-wide</p>
        </div>
        <div className="flex gap-1">
          {filters.map(({ value, label }) => (
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
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] border-b border-white/10">
              <tr>
                {["Invoice", "Project / Workspace", "Amount", "Status", "Due Date", "Created"].map((h) => (
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
                : data?.invoices.length === 0
                ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                    No invoices found{status ? ` with status ${status}` : ""}
                  </td></tr>
                )
                : data?.invoices.map((inv) => {
                    const isOverdueSoon =
                      inv.status === "UNPAID" && inv.dueDate &&
                      new Date(inv.dueDate) < new Date(Date.now() + 3 * 86400_000);

                    return (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-white text-sm max-w-[180px] truncate">{inv.title}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-white/70 text-sm">{inv.project.name}</div>
                          <div className="text-[11px] text-white/35 font-mono mt-0.5">{inv.project.workspace.slug}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-white text-sm">
                          {inv.currency} {Number(inv.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[inv.status]}`}>
                            {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          {inv.dueDate ? (
                            <span className={`flex items-center gap-1 ${isOverdueSoon ? "text-amber-400" : "text-white/40"}`}>
                              {isOverdueSoon && <AlertCircle className="h-3 w-3" />}
                              {format(new Date(inv.dueDate), "MMM d, yyyy")}
                            </span>
                          ) : <span className="text-white/30">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">
                          {format(new Date(inv.createdAt), "MMM d, yyyy")}
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
