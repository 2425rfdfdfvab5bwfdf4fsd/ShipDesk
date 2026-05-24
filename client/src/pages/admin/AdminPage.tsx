import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LayoutDashboard, Users, FolderKanban, FileText, DollarSign,
  LogOut, Lock, Eye, EyeOff, Shield,
} from "lucide-react";
import { getAdminKey, getAdminEmail, setAdminCredentials, clearAdminCredentials } from "@/lib/adminApi";
import { AdminOverviewTab } from "./AdminOverviewTab";
import { AdminUsersTab } from "./AdminUsersTab";
import { AdminProjectsTab } from "./AdminProjectsTab";
import { AdminReportsTab } from "./AdminReportsTab";
import { AdminInvoicesTab } from "./AdminInvoicesTab";

const adminQueryClient = new QueryClient();

type Tab = "overview" | "users" | "projects" | "reports" | "invoices";

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "invoices", label: "Invoices", icon: DollarSign },
];

function AdminLoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your email address."); return; }
    if (!key.trim()) { setError("Enter the admin key."); return; }
    setAdminCredentials(key.trim(), email.trim().toLowerCase());
    onLogin();
  }

  return (
    <div className="min-h-screen bg-[#06080f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mb-4">
            <Shield className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-white/50 mt-1">ShipDesk internal dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="Admin email address"
              autoFocus
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(""); }}
              placeholder="Admin secret key"
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
          >
            Access Admin Panel
          </button>
        </form>
        <p className="text-center text-xs text-white/25 mt-6">
          Access is restricted to authorised accounts only.
        </p>
      </div>
    </div>
  );
}

function AdminShell() {
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function handleLogout() {
    clearAdminCredentials();
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#06080f] text-white flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/10 flex flex-col flex-shrink-0 hidden lg:flex">
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/10">
          <img src="/favicon.svg" alt="ShipDesk" className="w-7 h-7" />
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
            onClick={handleLogout}
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
          <img src="/favicon.svg" alt="ShipDesk" className="w-6 h-6" />
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
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-red-400">
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
  );
}

export function AdminPage() {
  const [authed, setAuthed] = useState(() => !!getAdminKey() && !!getAdminEmail());

  if (!authed) {
    return <AdminLoginScreen onLogin={() => setAuthed(true)} />;
  }

  return (
    <QueryClientProvider client={adminQueryClient}>
      <AdminShell />
    </QueryClientProvider>
  );
}
