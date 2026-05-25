import { useEffect, useState, type ComponentType } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Users, FolderKanban, FileText, DollarSign,
  LogOut, Loader2, ShieldOff, RefreshCw, ArrowLeft,
} from "lucide-react";
import { setAdminTokenGetter, adminApi } from "@/lib/adminApi";
import { AdminOverviewTab } from "./AdminOverviewTab";
import { AdminUsersTab } from "./AdminUsersTab";
import { AdminProjectsTab } from "./AdminProjectsTab";
import { AdminReportsTab } from "./AdminReportsTab";
import { AdminInvoicesTab } from "./AdminInvoicesTab";

const ALLOWED_EMAIL = "saifkhan13483@gmail.com";
const adminQueryClient = new QueryClient();

type Tab = "overview" | "users" | "projects" | "reports" | "invoices";

interface NavItem {
  id: Tab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "users",     label: "Users",     icon: Users },
  { id: "projects",  label: "Projects",  icon: FolderKanban },
  { id: "reports",   label: "Reports",   icon: FileText },
  { id: "invoices",  label: "Invoices",  icon: DollarSign },
];

interface Stats {
  users: number; projects: number; reports: number; invoices: number;
}

function NavBadge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto text-[10px] font-semibold bg-white/10 text-white/50 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
      {count > 999 ? "999+" : count}
    </span>
  );
}

function AdminShell() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    setAdminTokenGetter(getToken);
    return () => setAdminTokenGetter(async () => null);
  }, [getToken]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.get("/api/admin/stats").then((r) => r.data),
    staleTime: 60_000,
  });

  const COUNTS: Partial<Record<Tab, number>> = {
    users: stats?.users,
    projects: stats?.projects,
    reports: stats?.reports,
    invoices: stats?.invoices,
  };

  const handleRefresh = () => {
    adminQueryClient.invalidateQueries();
    setLastRefresh(new Date());
  };

  const SidebarContent = () => (
    <>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setMobileNavOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === id
                ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/25"
                : "text-white/45 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${tab === id ? "text-indigo-400" : ""}`} />
            <span className="flex-1 text-left">{label}</span>
            <NavBadge count={COUNTS[id]} />
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.07] space-y-1">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                {user.firstName?.charAt(0) ?? "A"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/70 truncate">{user.firstName ?? "Admin"}</p>
              <p className="text-[10px] text-white/30 truncate">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleRefresh}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
          title={`Last refreshed: ${lastRefresh.toLocaleTimeString()}`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh data
        </button>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/35 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <QueryClientProvider client={adminQueryClient}>
      <div className="min-h-screen bg-[#06080f] text-white flex">

        {/* Desktop sidebar */}
        <aside className="w-56 border-r border-white/[0.07] flex-col flex-shrink-0 hidden lg:flex">
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/[0.07]">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm block leading-none text-white">ShipDesk</span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wide">ADMIN</span>
            </div>
          </div>
          {/* Back to main app */}
          <a
            href="/dashboard"
            className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors border border-white/[0.06]"
          >
            <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
            Back to app
          </a>
          <SidebarContent />
        </aside>

        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#06080f]/95 border-b border-white/[0.07] backdrop-blur-xl flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <LayoutDashboard className="h-3 w-3 text-indigo-400" />
            </div>
            <span className="font-bold text-sm">ShipDesk <span className="text-indigo-400">Admin</span></span>
          </div>
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="p-2 text-white/50 hover:text-white transition-colors">
            <LayoutDashboard className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute left-0 top-14 bottom-0 w-56 bg-[#0d0f18] border-r border-white/[0.07] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {tab === "overview"  && <AdminOverviewTab />}
            {tab === "users"     && <AdminUsersTab />}
            {tab === "projects"  && <AdminProjectsTab />}
            {tab === "reports"   && <AdminReportsTab />}
            {tab === "invoices"  && <AdminInvoicesTab />}
          </div>
        </main>

      </div>
    </QueryClientProvider>
  );
}

export function AdminPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [, navigate] = useLocation();

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  const isAllowed = isSignedIn && userEmail === ALLOWED_EMAIL;

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/sign-in");
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded || (!isSignedIn && isLoaded)) {
    return (
      <div className="min-h-screen bg-[#06080f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#06080f] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <ShieldOff className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-sm text-white/50 mb-6">
            <span className="font-mono text-white/70">{userEmail}</span> is not authorised to access this panel.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 rounded-xl transition-colors"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return <AdminShell />;
}
