import { useEffect, useState, type ComponentType } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LayoutDashboard, Users, FolderKanban, FileText, DollarSign,
  LogOut, Loader2, ShieldOff,
} from "lucide-react";
import { setAdminTokenGetter } from "@/lib/adminApi";
import { AdminOverviewTab } from "./AdminOverviewTab";
import { AdminUsersTab } from "./AdminUsersTab";
import { AdminProjectsTab } from "./AdminProjectsTab";
import { AdminReportsTab } from "./AdminReportsTab";
import { AdminInvoicesTab } from "./AdminInvoicesTab";

const ALLOWED_EMAIL = "saifkhan13483@gmail.com";
const adminQueryClient = new QueryClient();

type Tab = "overview" | "users" | "projects" | "reports" | "invoices";

const NAV: { id: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "invoices", label: "Invoices", icon: DollarSign },
];

function AdminShell() {
  const { getToken, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setAdminTokenGetter(getToken);
    return () => setAdminTokenGetter(async () => null);
  }, [getToken]);

  return (
    <QueryClientProvider client={adminQueryClient}>
      <div className="min-h-screen bg-[#06080f] text-white flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-white/10 flex-col flex-shrink-0 hidden lg:flex">
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/10">
            <img src="/favicon.svg" alt="ShipDesk" className="w-7 h-7" onError={(e) => (e.currentTarget.style.display = "none")} />
            <div>
              <span className="font-bold text-sm block leading-none">ShipDesk</span>
              <span className="text-[10px] text-indigo-400 font-medium">Admin</span>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#06080f]/95 border-b border-white/10 backdrop-blur-xl flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="ShipDesk" className="w-6 h-6" onError={(e) => (e.currentTarget.style.display = "none")} />
            <span className="font-bold text-sm">ShipDesk <span className="text-indigo-400">Admin</span></span>
          </div>
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="p-2 text-white/60 hover:text-white">
            <LayoutDashboard className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute left-0 top-14 bottom-0 w-56 bg-[#0f1117] border-r border-white/10 p-3 space-y-0.5" onClick={(e) => e.stopPropagation()}>
              {NAV.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setTab(id); setMobileNavOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-indigo-500/20 text-indigo-300" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
              <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-red-400">
                <LogOut className="h-4 w-4" />Sign out
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {tab === "overview" && <AdminOverviewTab />}
            {tab === "users" && <AdminUsersTab />}
            {tab === "projects" && <AdminProjectsTab />}
            {tab === "reports" && <AdminReportsTab />}
            {tab === "invoices" && <AdminInvoicesTab />}
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
    if (isLoaded && !isSignedIn) {
      navigate("/sign-in");
    }
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
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 rounded-lg transition-colors"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return <AdminShell />;
}
