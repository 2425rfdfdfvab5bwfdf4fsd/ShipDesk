import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/clerk-react";
import {
  LayoutDashboard, DollarSign, GitMerge, Settings,
  Menu, X, Sun, Moon, LogOut, MessageSquare, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspace, useUnreadMessageCount } from "@/hooks/useWorkspace";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: DollarSign },
  { href: "/scope-changes", label: "Scope Changes", icon: GitMerge },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");
  html.classList.toggle("dark", !isDark);
  localStorage.setItem("shipdesk-theme", isDark ? "light" : "dark");
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { data: workspace, error: workspaceError, isLoading: workspaceLoading } = useWorkspace();
  const { data: unreadData } = useUnreadMessageCount();
  const unreadCount = unreadData?.count ?? 0;

  // Only redirect to onboarding when we know for certain there is no workspace (404).
  // Any other error (e.g. 401 while auth token is still loading on refresh) should
  // not redirect — the query will automatically retry and recover.
  const workspaceNotFound =
    (workspaceError as { response?: { status?: number } } | null)?.response?.status === 404;

  useEffect(() => {
    if (!workspaceLoading && workspaceNotFound) {
      navigate("/onboarding");
    }
  }, [workspaceLoading, workspaceNotFound, navigate]);

  const initials = user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "?";
  const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[220px] bg-card border-r flex flex-col transition-transform duration-200 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <img src="/favicon.svg" alt="ShipDesk" className="w-7 h-7" />
            <span className="font-bold text-sm tracking-tight">ShipDesk</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Workspace badge */}
        {workspace && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] font-medium text-primary/60 uppercase tracking-wider">Workspace</p>
              {(() => {
                const isOnTrial = !workspace.lsSubscriptionId && !!workspace.trialEndsAt;
                const trialActive = isOnTrial && new Date(workspace.trialEndsAt!) > new Date();
                const label = isOnTrial
                  ? trialActive ? "Trial" : "Expired"
                  : workspace.plan === "AGENCY" ? "Agency"
                  : workspace.plan === "SOLO" ? "Solo"
                  : workspace.plan === "STARTER" ? "Starter"
                  : "Free";
                return (
                  <span className={cn(
                    "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                    isOnTrial && trialActive ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                    isOnTrial && !trialActive ? "bg-destructive/20 text-destructive" :
                    workspace.plan === "AGENCY" ? "bg-violet-500/20 text-violet-500" :
                    workspace.plan === "SOLO" ? "bg-primary/20 text-primary" :
                    workspace.plan === "STARTER" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {label}
                  </span>
                );
              })()}
            </div>
            <p className="text-xs font-semibold truncate">{workspace.agencyName || workspace.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
              shipdesk-nine.vercel.app/portal/{workspace.slug}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 mt-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location === item.href ||
              (item.href === "/settings" && location.startsWith("/settings")) ||
              (item.href === "/billing" && location.startsWith("/billing")) ||
              (item.href !== "/dashboard" && item.href !== "/settings" && item.href !== "/billing" && location.startsWith(item.href));
            const showBadge = item.href === "/dashboard" && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] justify-center",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary text-primary-foreground"
                  )}>
                    <MessageSquare className="h-2.5 w-2.5" />
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user */}
        <div className="p-3 border-t space-y-0.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground w-full transition-colors"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
            Toggle theme
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{displayName}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:hidden flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="ShipDesk" className="w-6 h-6" />
            <span className="font-bold text-sm">ShipDesk</span>
          </Link>
          <div className="w-8" />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
