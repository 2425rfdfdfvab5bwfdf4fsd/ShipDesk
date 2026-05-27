import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import {
  Search, ChevronLeft, ChevronRight, Copy, Check,
  ShieldCheck, CalendarDays, Pencil, X, Check as CheckIcon,
  AlertCircle, XCircle, RefreshCw, AlertTriangle,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

interface AdminUser {
  id: string; email: string; name: string; createdAt: string; avatarUrl: string | null;
  workspace: {
    id: string; slug: string; name: string; agencyName: string | null;
    onboardingComplete: boolean; plan: "FREE" | "STARTER" | "SOLO" | "AGENCY";
    adminPlanOverride: boolean;
    adminGrantExpiresAt: string | null;
    lsSubscriptionId: string | null; trialEndsAt: string | null;
    _count: { projects: number; clients: number; members: number };
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

function safeFormat(dateStr: string | null | undefined, fmt: string, fallback = "—"): string {
  if (!dateStr) return fallback;
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt) : fallback;
  } catch {
    return fallback;
  }
}

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

function InlineAlert({ type, message, onDismiss }: { type: "error" | "success"; message: string; onDismiss: () => void }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border ${
      type === "error"
        ? "bg-red-500/10 border-red-500/20 text-red-400"
        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    }`}>
      {type === "error"
        ? <XCircle className="h-3 w-3 flex-shrink-0" />
        : <CheckIcon className="h-3 w-3 flex-shrink-0" />}
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-auto opacity-60 hover:opacity-100">
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

function PlanSelector({
  userId,
  currentPlan,
  adminPlanOverride,
  hasWorkspace,
}: {
  userId: string;
  currentPlan: "FREE" | "STARTER" | "SOLO" | "AGENCY";
  adminPlanOverride: boolean;
  hasWorkspace: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: (plan: string) =>
      adminApi.patch(`/api/admin/users/${userId}/plan`, { plan }).then((r) => r.data),
    onSuccess: (_, plan) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      setAlert({ type: "success", message: `Plan set to ${plan}` });
      setTimeout(() => setAlert(null), 3000);
    },
    onError: (err: any) => {
      setOpen(false);
      const code = err?.response?.data?.error;
      setAlert({
        type: "error",
        message: code === "USER_OR_WORKSPACE_NOT_FOUND"
          ? "User has no workspace yet"
          : "Failed to update plan",
      });
    },
  });

  if (!hasWorkspace) {
    return <span className="text-white/25 text-xs italic">No workspace</span>;
  }

  return (
    <div className="relative space-y-1">
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
      {alert && (
        <InlineAlert type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
      )}
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

const QUICK_TRIAL_DAYS = [7, 14, 30];

function TrialDateEditor({
  userId,
  trialEndsAt,
  hasWorkspace,
}: {
  userId: string;
  trialEndsAt: string | null;
  hasWorkspace: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const toDateInput = (iso: string | null) => {
    if (!iso) return "";
    try {
      const d = parseISO(iso);
      return isValid(d) ? format(d, "yyyy-MM-dd") : "";
    } catch { return ""; }
  };

  const [value, setValue] = useState(() => toDateInput(trialEndsAt));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setValue(toDateInput(trialEndsAt));
  }, [trialEndsAt, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const { mutate, isPending } = useMutation({
    mutationFn: (date: string | null) =>
      adminApi.patch(`/api/admin/users/${userId}/trial`, { trialEndsAt: date }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditing(false);
      setAlert({ type: "success", message: "Trial date saved" });
      setTimeout(() => setAlert(null), 3000);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error;
      setAlert({
        type: "error",
        message: code === "USER_OR_WORKSPACE_NOT_FOUND"
          ? "User has no workspace yet"
          : "Failed to update trial date",
      });
    },
  });

  const handleSave = (overrideValue?: string) => {
    const v = overrideValue ?? value;
    if (!v) { mutate(null); return; }
    const parts = v.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      setAlert({ type: "error", message: "Invalid date format" });
      return;
    }
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    mutate(date.toISOString());
  };

  const handleQuickExtend = (days: number) => {
    const base = trialEndsAt && new Date(trialEndsAt) > new Date()
      ? new Date(trialEndsAt)
      : new Date();
    base.setUTCDate(base.getUTCDate() + days);
    base.setUTCHours(12, 0, 0, 0);
    mutate(base.toISOString());
  };

  const handleCancel = () => {
    setValue(toDateInput(trialEndsAt));
    setEditing(false);
  };

  if (!hasWorkspace) return null;

  const isExpired = !!trialEndsAt && new Date(trialEndsAt) < new Date();

  return (
    <div className="space-y-1">
      {!editing ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            data-testid={`button-edit-trial-${userId}`}
            onClick={() => setEditing(true)}
            className="group/trial inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
            title="Edit trial end date"
          >
            <CalendarDays className="h-3 w-3 flex-shrink-0" />
            <span className={`font-mono ${isExpired ? "text-red-400/70" : ""}`}>
              {trialEndsAt ? safeFormat(trialEndsAt, "MMM d, yyyy") : <span className="italic">no trial</span>}
            </span>
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/trial:opacity-60 transition-opacity" />
          </button>
          {/* Quick extend buttons */}
          <div className="flex gap-0.5">
            {QUICK_TRIAL_DAYS.map((d) => (
              <button
                key={d}
                onClick={() => handleQuickExtend(d)}
                disabled={isPending}
                title={`Extend trial by ${d} days`}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-indigo-500/20 text-white/30 hover:text-indigo-300 transition-colors disabled:opacity-40 border border-transparent hover:border-indigo-500/20"
              >
                +{d}d
              </button>
            ))}
          </div>
          {isPending && <span className="text-[10px] text-white/30 italic">Saving…</span>}
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-wrap">
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            className="bg-white/10 border border-white/20 rounded text-[11px] text-white px-1.5 py-0.5 font-mono focus:outline-none focus:border-indigo-400 w-32"
            data-testid={`input-trial-date-${userId}`}
          />
          <button
            onClick={() => handleSave()}
            disabled={isPending}
            className="p-0.5 rounded hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-50"
            title="Save"
          >
            <CheckIcon className="h-3 w-3" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="p-0.5 rounded hover:bg-white/10 text-white/40 disabled:opacity-50"
            title="Cancel"
          >
            <X className="h-3 w-3" />
          </button>
          <button
            onClick={() => mutate(null)}
            disabled={isPending}
            className="text-[10px] text-red-400/60 hover:text-red-400 px-1 py-0.5 rounded hover:bg-red-500/10 transition-colors"
            title="Clear trial date"
          >
            Clear
          </button>
          {isPending && <span className="text-[10px] text-white/30 ml-1">Saving…</span>}
        </div>
      )}
      {alert && (
        <InlineAlert type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
      )}
    </div>
  );
}

function AdminGrantExpiryEditor({
  userId,
  adminGrantExpiresAt,
  isAdminOverride,
}: {
  userId: string;
  adminGrantExpiresAt: string | null;
  isAdminOverride: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const isExpired = !!adminGrantExpiresAt && new Date(adminGrantExpiresAt) < new Date();
  const currentDaysLeft = adminGrantExpiresAt && !isExpired
    ? Math.ceil((new Date(adminGrantExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const defaultDays = currentDaysLeft ?? 30;
  const [days, setDays] = useState(String(defaultDays));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDays(String(currentDaysLeft ?? 30));
  }, [adminGrantExpiresAt, editing]);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  const { mutate, isPending } = useMutation({
    mutationFn: (date: string | null) =>
      adminApi.patch(`/api/admin/users/${userId}/admin-grant-expires`, { adminGrantExpiresAt: date }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditing(false);
      setAlert({ type: "success", message: "Grant expiry saved" });
      setTimeout(() => setAlert(null), 3000);
    },
    onError: () => {
      setAlert({ type: "error", message: "Failed to update expiry" });
    },
  });

  const handleSave = () => {
    const n = parseInt(days, 10);
    if (!days.trim() || isNaN(n) || n <= 0) {
      mutate(null);
      return;
    }
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + n);
    mutate(date.toISOString());
  };

  const handleCancel = () => {
    setDays(String(currentDaysLeft ?? 30));
    setEditing(false);
  };

  if (!isAdminOverride) return null;

  return (
    <div className="space-y-1">
      {!editing ? (
        <button
          data-testid={`button-edit-grant-expiry-${userId}`}
          onClick={() => setEditing(true)}
          className="group/grant inline-flex items-center gap-1 text-[11px] transition-colors"
          title="Set grant expiry in days"
        >
          <ShieldCheck className={`h-3 w-3 flex-shrink-0 ${isExpired ? "text-red-400" : currentDaysLeft !== null && currentDaysLeft <= 7 ? "text-amber-400" : "text-indigo-400"}`} />
          <span className={`font-mono ${isExpired ? "text-red-400" : currentDaysLeft !== null && currentDaysLeft <= 7 ? "text-amber-400" : "text-indigo-300"}`}>
            {adminGrantExpiresAt
              ? isExpired
                ? `expired ${safeFormat(adminGrantExpiresAt, "MMM d, yyyy")}`
                : `${currentDaysLeft}d left · ends ${safeFormat(adminGrantExpiresAt, "MMM d, yyyy")}`
              : <span className="text-white/30 italic">no expiry set</span>
            }
          </span>
          <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/grant:opacity-60 transition-opacity text-white/40" />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            ref={inputRef}
            type="number"
            min="1"
            max="3650"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            className="bg-white/10 border border-white/20 rounded text-[11px] text-white px-1.5 py-0.5 font-mono focus:outline-none focus:border-indigo-400 w-14 text-center"
            data-testid={`input-grant-expiry-${userId}`}
          />
          <span className="text-[11px] text-white/40">days</span>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="p-0.5 rounded hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-50"
            title="Save"
          >
            <CheckIcon className="h-3 w-3" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="p-0.5 rounded hover:bg-white/10 text-white/40 disabled:opacity-50"
            title="Cancel"
          >
            <X className="h-3 w-3" />
          </button>
          <button
            onClick={() => mutate(null)}
            disabled={isPending}
            className="text-[10px] text-red-400/60 hover:text-red-400 px-1 py-0.5 rounded hover:bg-red-500/10 transition-colors"
            title="Remove expiry"
          >
            No expiry
          </button>
          {isPending && <span className="text-[10px] text-white/30 ml-1">Saving…</span>}
        </div>
      )}
      {alert && (
        <InlineAlert type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />
      )}
    </div>
  );
}

function Pagination({
  page, pages, total, onPage,
}: {
  page: number; pages: number; total: number; onPage: (p: number) => void;
}) {
  if (pages <= 1) return null;

  const getPageNumbers = (): (number | "…")[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const items: (number | "…")[] = [1];
    if (page > 3) items.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      items.push(i);
    }
    if (page < pages - 2) items.push("…");
    items.push(pages);
    return items;
  };

  return (
    <div className="flex items-center justify-between text-sm text-white/40">
      <span className="text-xs">{total} total · page {page} of {pages}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {getPageNumbers().map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-white/20 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`min-w-[32px] h-8 rounded-lg border text-xs font-medium transition-colors ${
                p === page
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "border-white/10 hover:bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(Math.min(pages, page + 1))}
          disabled={page === pages}
          className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
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
  const qc = useQueryClient();

  const { data, isLoading, isError, error, isFetching } = useQuery<PagedResponse>({
    queryKey: ["admin-users", page, search, planFilter],
    queryFn: () =>
      adminApi.get("/api/admin/users", {
        params: { page, search: search || undefined, plan: planFilter || undefined },
      }).then((r) => r.data),
    staleTime: 30_000,
    retry: 1,
  });

  const handlePlanFilter = (value: string) => {
    setPlanFilter(value);
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  // ── Error state ──────────────────────────────────────────────────────────────
  if (isError) {
    const status = (error as any)?.response?.status;
    const isAuth = status === 401 || status === 403;
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold mb-1">
            {isAuth ? "Access denied" : "Failed to load users"}
          </p>
          <p className="text-white/40 text-sm">
            {isAuth
              ? `Your account doesn't have permission to view this (${status})`
              : "There was a problem fetching the users list. Check the server logs."}
          </p>
        </div>
        {!isAuth && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Users</h2>
          <p className="text-sm text-white/50">
            {isLoading ? "Loading…" : `${data?.total ?? 0} registered developers`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                data-testid="input-user-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email…"
                className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 w-56"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors font-medium"
            >
              Search
            </button>
          </form>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            title="Refresh"
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Plan filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {PLAN_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handlePlanFilter(value)}
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

      {/* Active search indicator */}
      {search && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <AlertCircle className="h-3.5 w-3.5" />
          Showing results for <span className="text-white/70 font-medium">"{search}"</span>
          <button onClick={handleClearSearch} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] border-b border-white/10">
              <tr>
                {["User", "Workspace", "Plan", "Projects", "Clients", "Members", "Status & Trial", "Joined"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-4 py-3.5">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td></tr>
                  ))
                : !data || data.users.length === 0
                ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-white/30 text-sm">
                    No users found{search ? ` for "${search}"` : ""}{planFilter ? ` on ${planFilter} plan` : ""}
                  </td></tr>
                )
                : data.users.map((u) => {
                  const ws = u.workspace;
                  const hasTrial = !!ws?.trialEndsAt;
                  const trialExpired = hasTrial && new Date(ws!.trialEndsAt!) < new Date();
                  const hasSubscription = !!ws?.lsSubscriptionId;
                  const isAdminOverride = !!ws?.adminPlanOverride;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* User */}
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

                      {/* Workspace */}
                      <td className="px-4 py-3.5">
                        {ws ? (
                          <div>
                            <div className="text-white/80 text-sm leading-tight">{ws.agencyName || ws.name}</div>
                            <div className="text-[11px] text-white/35 font-mono mt-0.5">{ws.slug}</div>
                          </div>
                        ) : (
                          <span
                            className="text-white/25 text-xs italic"
                            title="This user hasn't completed workspace setup yet"
                          >
                            No workspace
                          </span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5">
                        <PlanSelector
                          userId={u.id}
                          currentPlan={ws?.plan ?? "FREE"}
                          adminPlanOverride={isAdminOverride}
                          hasWorkspace={!!ws}
                        />
                      </td>

                      {/* Stats */}
                      <td className="px-4 py-3.5 text-white/60 text-sm">{ws?._count.projects ?? "—"}</td>
                      <td className="px-4 py-3.5 text-white/60 text-sm">{ws?._count.clients ?? "—"}</td>
                      <td className="px-4 py-3.5 text-white/60 text-sm">{ws?._count.members ?? "—"}</td>

                      {/* Status & Trial */}
                      <td className="px-4 py-3.5">
                        {ws ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap gap-1">
                              <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium ${ws.onboardingComplete ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                                {ws.onboardingComplete ? "Onboarded" : "Pending setup"}
                              </span>
                              {isAdminOverride && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/15 text-indigo-300">
                                  <ShieldCheck className="h-2.5 w-2.5" />
                                  Admin grant
                                </span>
                              )}
                              {hasSubscription && !isAdminOverride && (
                                <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/15 text-indigo-300">
                                  Subscribed
                                </span>
                              )}
                              {hasTrial && !hasSubscription && !isAdminOverride && (
                                <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium ${trialExpired ? "bg-red-500/15 text-red-400" : "bg-cyan-500/15 text-cyan-400"}`}>
                                  {trialExpired ? "Trial expired" : "On trial"}
                                </span>
                              )}
                            </div>
                            <TrialDateEditor userId={u.id} trialEndsAt={ws.trialEndsAt} hasWorkspace={!!ws} />
                            <AdminGrantExpiryEditor
                              userId={u.id}
                              adminGrantExpiresAt={ws.adminGrantExpiresAt}
                              isAdminOverride={isAdminOverride}
                            />
                          </div>
                        ) : (
                          <span className="text-white/25 text-xs">—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">
                        {safeFormat(u.createdAt, "MMM d, yyyy")}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        pages={data?.pages ?? 1}
        total={data?.total ?? 0}
        onPage={setPage}
      />
    </div>
  );
}
