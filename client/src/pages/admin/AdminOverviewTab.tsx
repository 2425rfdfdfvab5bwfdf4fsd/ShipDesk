import { useQuery } from "@tanstack/react-query";
import { adminApi, getAdminApiDiagnostics } from "@/lib/adminApi";
import { AxiosError } from "axios";
import {
  Users, FolderKanban, FileText, DollarSign, Github,
  MessageSquare, GitMerge, Building2, UserCheck, TrendingUp,
  Link2, Upload, Users2, Zap, Monitor,
} from "lucide-react";

interface Stats {
  users: number; workspaces: number; projects: number; activeProjects: number;
  reports: number; publishedReports: number; invoices: number; paidInvoices: number;
  totalRevenue: number; clients: number; githubConnections: number;
  scopeChanges: number; messages: number; onboardedWorkspaces: number;
  planDistribution: { FREE: number; STARTER: number; SOLO: number; AGENCY: number };
  linearConnections: number; vercelConnections: number; files: number;
  teamMembers: number; githubEvents: number; activeClientSessions: number;
  teamActivities: number;
}

const PLAN_CONFIG = [
  { key: "FREE",    label: "Free",    color: "bg-white/30",     text: "text-white/60" },
  { key: "STARTER", label: "Starter", color: "bg-blue-500",     text: "text-blue-400" },
  { key: "SOLO",    label: "Solo",    color: "bg-indigo-500",   text: "text-indigo-400" },
  { key: "AGENCY",  label: "Agency",  color: "bg-purple-500",   text: "text-purple-400" },
] as const;

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-sm font-bold text-white">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function HeroCard({
  label, value, icon: Icon, color, bg, sub,
}: {
  label: string; value: string | number; icon: typeof Users;
  color: string; bg: string; sub?: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <div>
        <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Users }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <Icon className="h-3.5 w-3.5 text-white/20 mb-2" />
      <p className="text-lg font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function SkeletonCard({ tall }: { tall?: boolean }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/5 ${tall ? "h-40" : "h-28"} animate-pulse`} />;
}

export function AdminOverviewTab() {
  const { data: stats, isLoading, isError, error } = useQuery<Stats, AxiosError>({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.get("/api/admin/stats").then((r) => r.data),
    staleTime: 60_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard tall />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    const status = (error as AxiosError)?.response?.status;
    const diag = getAdminApiDiagnostics();

    let headline = "Failed to load stats";
    let detail = "An unexpected error occurred.";
    let hint = "";

    if (!status) {
      headline = "Cannot reach the backend server";
      detail = "The request never got a response — this is usually a network error or CORS block.";
      hint = diag.viteApiBaseUrl === "(not set)"
        ? "VITE_API_BASE_URL is not set in this build. Add it to Vercel environment variables and redeploy."
        : `Backend URL in this build: ${diag.baseUrl}. Make sure Railway is running and that URL is correct.`;
    } else if (status === 401) {
      headline = "Authentication failed (401)";
      detail = "The server rejected the Clerk token. This usually means CLERK_SECRET_KEY on Railway doesn't match the frontend's publishable key.";
      hint = "Double-check that CLERK_SECRET_KEY in Railway and VITE_CLERK_PUBLISHABLE_KEY in Vercel are from the same Clerk instance.";
    } else if (status === 403) {
      const responseData = (error as AxiosError)?.response?.data as Record<string, string> | undefined;
      const clerkEmail = responseData?.userEmail ?? "";
      const serverAllowed = responseData?.allowedEmail ?? "saifkhan13483@gmail.com";
      headline = "Access denied (403)";
      if (clerkEmail && clerkEmail === serverAllowed) {
        detail = `Emails match ("${clerkEmail}") but the server still rejected the request — there may be a hidden character in the Railway ADMIN_EMAIL env var. Try deleting and re-typing it in Railway, then redeploy.`;
        hint = "In Railway: Variables → delete ADMIN_EMAIL → add it again by typing (not pasting) → Redeploy.";
      } else if (clerkEmail) {
        detail = `Your Clerk email is "${clerkEmail}" but the server allows "${serverAllowed}".`;
        hint = clerkEmail !== serverAllowed
          ? `Update ADMIN_EMAIL on Railway to exactly: ${clerkEmail} — or sign in with ${serverAllowed}.`
          : "The emails look the same but differ by invisible characters. Re-type ADMIN_EMAIL in Railway and redeploy.";
      } else {
        detail = "You're authenticated but your Clerk email doesn't match the allowed admin email.";
        hint = "Make sure you're signed into Clerk with: saifkhan13483@gmail.com";
      }
    } else if (status === 404) {
      headline = "API endpoint not found (404)";
      detail = "The backend responded but couldn't find /api/admin/stats.";
      hint = `Backend URL in this build: ${diag.baseUrl}. Verify the Railway deployment is up to date.`;
    } else if (status === 503) {
      const errCode = ((error as AxiosError)?.response?.data as Record<string, string>)?.error;
      if (errCode === "ADMIN_EMAIL_NOT_CONFIGURED") {
        headline = "ADMIN_EMAIL not configured on the server (503)";
        detail = "The backend started without the ADMIN_EMAIL environment variable — it was likely added to Railway after the last deployment.";
        hint = "Go to Railway → your service → Settings → Redeploy (or push a new commit). The new container will pick up ADMIN_EMAIL and this will work.";
      } else {
        headline = "Server error (503)";
        detail = "The server returned a 503. Check Railway logs for details.";
      }
    } else {
      headline = `Server error (${status})`;
      detail = "The server returned an error. Check Railway logs for details.";
    }

    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-3">
        <p className="text-red-400 text-sm font-semibold">{headline}</p>
        <p className="text-white/50 text-xs">{detail}</p>
        {hint && (
          <p className="text-white/40 text-xs font-mono bg-white/5 rounded-lg px-3 py-2 border border-white/10 break-all">
            {hint}
          </p>
        )}
        <p className="text-white/25 text-[11px]">
          Build target: {diag.baseUrl || "(same origin — VITE_API_BASE_URL not set)"}
        </p>
      </div>
    );
  }

  const { planDistribution: pd, workspaces } = stats;
  const totalPlans = (pd.FREE ?? 0) + (pd.STARTER ?? 0) + (pd.SOLO ?? 0) + (pd.AGENCY ?? 0);
  const onboardingRate = pct(stats.onboardedWorkspaces, workspaces);
  const githubRate = pct(stats.githubConnections, workspaces);
  const publishRate = pct(stats.publishedReports, stats.reports);

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-lg font-semibold text-white">Platform Overview</h2>
        <p className="text-sm text-white/40 mt-0.5">Live metrics across all tenants</p>
      </div>

      {/* ── Hero KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroCard
          label="Total Users" value={stats.users.toLocaleString()}
          icon={Users} color="text-indigo-400" bg="bg-indigo-500/10"
          sub={`${workspaces} workspace${workspaces !== 1 ? "s" : ""}`}
        />
        <HeroCard
          label="Active Projects" value={stats.activeProjects.toLocaleString()}
          icon={FolderKanban} color="text-emerald-400" bg="bg-emerald-500/10"
          sub={`of ${stats.projects} total`}
        />
        <HeroCard
          label="Published Reports" value={stats.publishedReports.toLocaleString()}
          icon={FileText} color="text-cyan-400" bg="bg-cyan-500/10"
          sub={`of ${stats.reports} generated`}
        />
        <HeroCard
          label="Revenue Collected"
          value={`$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign} color="text-amber-400" bg="bg-amber-500/10"
          sub={`${stats.paidInvoices} paid invoice${stats.paidInvoices !== 1 ? "s" : ""}`}
        />
      </div>

      {/* ── Plan Distribution ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Plan Distribution</h3>
            <p className="text-xs text-white/40 mt-0.5">{totalPlans} workspace{totalPlans !== 1 ? "s" : ""} across all tiers</p>
          </div>
          <TrendingUp className="h-4 w-4 text-white/20" />
        </div>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {PLAN_CONFIG.map(({ key, color }) => {
            const count = pd[key] ?? 0;
            const width = pct(count, totalPlans);
            if (!width) return null;
            return (
              <div key={key} className={`${color} transition-all`} style={{ width: `${width}%` }} title={`${key}: ${count}`} />
            );
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PLAN_CONFIG.map(({ key, label, color, text }) => {
            const count = pd[key] ?? 0;
            const p = pct(count, totalPlans);
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${color}`} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-sm font-bold ${text}`}>{count}</span>
                    <span className="text-xs text-white/30">{p}%</span>
                  </div>
                  <p className="text-xs text-white/40 leading-none mt-0.5">{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Platform Health ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Onboarding</span>
          </div>
          <HealthBar label="Workspaces onboarded" value={onboardingRate} color="bg-emerald-500" />
          <p className="text-xs text-white/30">{stats.onboardedWorkspaces} of {workspaces} completed setup</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 text-white/60" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">GitHub</span>
          </div>
          <HealthBar label="GitHub connected" value={githubRate} color="bg-white/40" />
          <p className="text-xs text-white/30">{stats.githubConnections} of {workspaces} connected · {stats.githubEvents.toLocaleString()} events received</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Reports</span>
          </div>
          <HealthBar label="Reports published" value={publishRate} color="bg-cyan-500" />
          <p className="text-xs text-white/30">{stats.publishedReports} of {stats.reports} published</p>
        </div>
      </div>

      {/* ── Integrations row ── */}
      <div>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Integrations & Connections</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
            <Github className="h-5 w-5 text-white/40 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{stats.githubConnections}</p>
              <p className="text-[11px] text-white/40">GitHub</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
            <Link2 className="h-5 w-5 text-purple-400/60 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{stats.linearConnections}</p>
              <p className="text-[11px] text-white/40">Linear</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
            <Monitor className="h-5 w-5 text-teal-400/60 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{stats.vercelConnections}</p>
              <p className="text-[11px] text-white/40">Vercel</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-400/60 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{stats.activeClientSessions}</p>
              <p className="text-[11px] text-white/40">Active sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Activity metrics ── */}
      <div>
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Activity & Content</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniCard label="Clients" value={stats.clients} icon={Users} />
          <MiniCard label="Messages" value={stats.messages} icon={MessageSquare} />
          <MiniCard label="Scope Changes" value={stats.scopeChanges} icon={GitMerge} />
          <MiniCard label="Total Invoices" value={stats.invoices} icon={DollarSign} />
          <MiniCard label="Files Uploaded" value={stats.files} icon={Upload} />
          <MiniCard label="Team Members" value={stats.teamMembers} icon={Users2} />
          <MiniCard label="All Projects" value={stats.projects} icon={FolderKanban} />
          <MiniCard label="GitHub Events" value={stats.githubEvents} icon={Github} />
          <MiniCard label="Team Activities" value={stats.teamActivities} icon={Users2} />
          <MiniCard label="Total Reports" value={stats.reports} icon={FileText} />
          <MiniCard label="Workspaces" value={stats.workspaces} icon={Building2} />
          <MiniCard label="All Invoices" value={stats.invoices} icon={DollarSign} />
        </div>
      </div>

    </div>
  );
}
