import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { Search, ChevronLeft, ChevronRight, Copy, Check, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

interface AdminUser {
  id: string; email: string; name: string; createdAt: string; avatarUrl: string | null;
  workspace: {
    id: string; slug: string; name: string; agencyName: string | null;
    onboardingComplete: boolean; plan: "FREE" | "STARTER" | "SOLO" | "AGENCY";
    adminPlanOverride: boolean;
    lsSubscriptionId: string | null; trialEndsAt: string | null;
    _count: { projects: number; clients: number };
  } | null;
}
interface PagedResponse { users: AdminUser[]; total: number; page: number; pages: number; }

const PLANS = ["FREE", "STARTER", "SOLO", "AGENCY"] as const;

const PLAN_STYLES: Record<string, string> = {
  FREE:    "bg-white/10 text-white/60",
  STARTER: "bg-blue-500/15 text-blue-400",
  SOLO:    "bg-indigo-500/15 text-indigo-400",
  AGENCY:  "bg-purple-500/15 text-purple-400",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10"
      title="Copy email"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-white/40" />}
    </button>
  );
}

function PlanSelector({
  userId,
  currentPlan,
  adminPlanOverride,
}: {
  userId: string;
  currentPlan: "FREE" | "STARTER" | "SOLO" | "AGENCY";
  adminPlanOverride: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (plan: string) =>
      adminApi.patch(`/api/admin/users/${userId}/plan`, { plan }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setOpen(false); },
  });

  return (
    <div className="relative">
      <button
        data-testid={`button-plan-${userId}`}
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-all border hover:border-white/20 ${PLAN_STYLES[currentPlan]} ${adminPlanOverride ? "border-indigo-500/40" : "border-transparent"} ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {adminPlanOverride && (
          <ShieldCheck className="h-3 w-3 text-indigo-400 flex-shrink-0" />
        )}
        {isPending ? "Saving…" : currentPlan}
        <svg className="h-2.5 w-2.5 opacity-60" viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 0l5 6 5-6H0z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-[#0f1117] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px] py-1">
            <div className="px-3 py-1.5 text-[10px] text-white/30 uppercase tracking-wider font-semibold border-b border-white/5 mb-1">
              Set plan
            </div>
            {PLANS.map((plan) => {
              const willBeAdminOverride = plan === "SOLO" || plan === "AGENCY";
              return (
                <button
                  key={plan}
                  data-testid={`button-set-plan-${plan}-${userId}`}
                  onClick={() => mutate(plan)}
                  className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5 flex items-center justify-between gap-3"
                >
                  <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full ${PLAN_STYLES[plan]}`}>
                    {willBeAdminOverride && <ShieldCheck className="h-2.5 w-2.5" />}
                    {plan}
                  </span>
                  {plan === currentPlan && <span className="text-white/25 text-[10px]">current</span>}
                </button>
              );
            })}
            <div className="px-3 pt-1.5 pb-1 border-t border-white/5 mt-1">
              <p className="text-[10px] text-white/25 leading-tight">
                <ShieldCheck className="h-2.5 w-2.5 inline mr-0.5 text-indigo-400/60" />
                Solo & Agency are admin-granted (no payment required)
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const PLAN_FILTERS = [
  { value: "", label: "All" },
  { value: "FREE", label: "Free" },
  { value: "STARTER", label: "Starter" },
  { value: "SOLO", label: "Solo" },
  { value: "AGENCY", label: "Agency" },
];

export function AdminUsersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const { data, isLoading } = useQuery<PagedResponse>({
    queryKey: ["admin-users", page, search, planFilter],
    queryFn: () =>
      adminApi.get("/api/admin/users", { params: { page, search, plan: planFilter || undefined } }).then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
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
              data-testid="input-user-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 w-56"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors font-medium">
            Search
          </button>
        </form>
      </div>

      {/* Plan filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {PLAN_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setPlanFilter(value); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium ${
              planFilter === value
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
                {["User", "Workspace", "Plan", "Projects", "Clients", "Status", "Joined"].map((h) => (
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
                : data?.users.length === 0
                ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                    No users found{search ? ` for "${search}"` : ""}{planFilter ? ` on ${planFilter} plan` : ""}
                  </td></tr>
                )
                : data?.users.map((u) => {
                  const ws = u.workspace;
                  const hasTrial = !!ws?.trialEndsAt;
                  const trialExpired = hasTrial && new Date(ws!.trialEndsAt!) < new Date();
                  const hasSubscription = !!ws?.lsSubscriptionId;
                  const isAdminOverride = !!ws?.adminPlanOverride;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-indigo-400">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm leading-tight truncate max-w-[160px]">{u.name}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[11px] text-white/40 font-mono truncate max-w-[140px]">{u.email}</span>
                              <CopyButton value={u.email} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {ws ? (
                          <div>
                            <div className="text-white/80 text-sm leading-tight">{ws.agencyName || ws.name}</div>
                            <div className="text-[11px] text-white/35 font-mono mt-0.5">{ws.slug}</div>
                          </div>
                        ) : <span className="text-white/25 text-xs italic">No workspace</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {ws
                          ? <PlanSelector userId={u.id} currentPlan={ws.plan} adminPlanOverride={isAdminOverride} />
                          : <span className="text-white/25 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-white/60 text-sm">{ws?._count.projects ?? "—"}</td>
                      <td className="px-4 py-3.5 text-white/60 text-sm">{ws?._count.clients ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        {ws ? (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium w-fit ${ws.onboardingComplete ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                              {ws.onboardingComplete ? "Onboarded" : "Pending setup"}
                            </span>
                            {isAdminOverride && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium w-fit bg-indigo-500/15 text-indigo-300">
                                <ShieldCheck className="h-2.5 w-2.5" />
                                Admin grant
                              </span>
                            )}
                            {hasSubscription && !isAdminOverride && (
                              <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium w-fit bg-indigo-500/15 text-indigo-300">
                                Subscribed
                              </span>
                            )}
                            {hasTrial && !hasSubscription && !isAdminOverride && (
                              <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium w-fit ${trialExpired ? "bg-red-500/15 text-red-400" : "bg-cyan-500/15 text-cyan-400"}`}>
                                {trialExpired ? "Trial expired" : "On trial"}
                              </span>
                            )}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
