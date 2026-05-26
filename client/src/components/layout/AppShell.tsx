import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/clerk-react";
import {
  LayoutDashboard, DollarSign, GitMerge, Settings,
  Menu, X, Sun, Moon, LogOut, MessageSquare, CreditCard, Lock, ShieldCheck, Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ShipDeskLogoMark } from "@/components/ui/ShipDeskLogo";
import { cn } from "@/lib/utils";
import { useWorkspace, useUnreadMessageCount } from "@/hooks/useWorkspace";
import { usePlan } from "@/hooks/usePlan";

const ADMIN_EMAIL = "saifkhan13483@gmail.com";

function daysLeft(date: string): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

type EffectivePlan = "FREE" | "STARTER" | "SOLO" | "AGENCY";

function getEffectivePlan(workspace: {
  plan: string;
  adminPlanOverride?: boolean;
  lsSubscriptionId: string | null;
  trialEndsAt: string | null;
} | undefined): EffectivePlan {
  if (!workspace) return "FREE";
  // Admin override always wins
  if (workspace.adminPlanOverride) return workspace.plan as EffectivePlan;
  // Paid subscription
  if (workspace.lsSubscriptionId) return workspace.plan as EffectivePlan;
  // Only Starter gets a free trial
  if (workspace.trialEndsAt && new Date(workspace.trialEndsAt) > new Date()) return "STARTER";
  return "FREE";
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minPlan: null },
  { href: "/invoices", label: "Invoices", icon: DollarSign, minPlan: null },
  { href: "/scope-changes", label: "Scope Changes", icon: GitMerge, minPlan: "SOLO" as EffectivePlan },
  { href: "/billing", label: "Billing", icon: CreditCard, minPlan: null },
  { href: "/settings", label: "Settings", icon: Settings, minPlan: null },
];

const PLAN_ORDER: EffectivePlan[] = ["FREE", "STARTER", "SOLO", "AGENCY"];

function isNavItemLocked(effectivePlan: EffectivePlan, minPlan: EffectivePlan | null): boolean {
  if (!minPlan) return false;
  return PLAN_ORDER.indexOf(effectivePlan) < PLAN_ORDER.indexOf(minPlan);
}

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
  const effectivePlan = getEffectivePlan(workspace);
  const { lsRenewsAt, lsEndsAt, lsSubscriptionStatus, hasActiveSub } = usePlan();

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
            <ShipDeskLogoMark className="w-7 h-7" />
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
                const isOnTrial = !workspace.lsSubscriptionId && !workspace.adminPlanOverride && !!workspace.trialEndsAt;
                const trialActive = isOnTrial && new Date(workspace.trialEndsAt!) > new Date();
                const label = isOnTrial && !trialActive
                  ? "Expired"
                  : workspace.plan === "AGENCY" ? "Agency"
                  : workspace.plan === "SOLO" ? "Solo"
                  : (workspace.plan === "STARTER" || (isOnTrial && trialActive)) ? "Starter"
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
            {/* Trial countdown — only shown when trial is active */}
            {!workspace.lsSubscriptionId && !workspace.adminPlanOverride && workspace.trialEndsAt && new Date(workspace.trialEndsAt) > new Date() && (() => {
              const remaining = daysLeft(workspace.trialEndsAt!);
              const TOTAL = 14;
              const pct = Math.max(4, Math.round(((TOTAL - remaining) / TOTAL) * 100));
              return (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      {remaining} day{remaining !== 1 ? "s" : ""} left in trial
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
            {/* Subscription renewal / expiry — shown for paid subscribers */}
            {hasActiveSub && (() => {
              const isCancelled = lsSubscriptionStatus === "cancelled" || lsSubscriptionStatus === "expired";
              const dateToShow = isCancelled ? lsEndsAt : lsRenewsAt;
              if (!dateToShow) return null;
              const remaining = daysLeft(dateToShow);
              const formatted = new Date(dateToShow).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
              const urgentColor = isCancelled && remaining <= 7
                ? "text-red-500 dark:text-red-400"
                : "text-muted-foreground";
              return (
                <div className="mt-2">
                  <span className={`text-[10px] font-medium ${urgentColor}`}>
                    {isCancelled
                      ? `Access ends in ${remaining} day${remaining !== 1 ? "s" : ""}`
                      : `Renews in ${remaining} day${remaining !== 1 ? "s" : ""}`}
                  </span>
                  <p className="text-[9px] text-muted-foreground/70">{formatted}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 mt-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const locked = isNavItemLocked(effectivePlan, item.minPlan);
            const active = !locked && (
              location === item.href ||
              (item.href === "/settings" && location.startsWith("/settings")) ||
              (item.href === "/billing" && location.startsWith("/billing")) ||
              (item.href !== "/dashboard" && item.href !== "/settings" && item.href !== "/billing" && location.startsWith(item.href))
            );
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
                    : locked
                    ? "text-muted-foreground/50 hover:bg-accent hover:text-muted-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {locked && (
                  <Lock className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                )}
                {showBadge && !locked && (
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

        {/* Admin panel link — only for admin user */}
        {user?.primaryEmailAddress?.emailAddress?.toLowerCase() === ADMIN_EMAIL && (
          <div className="px-3 pb-1">
            <a
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors border border-indigo-500/20 w-full"
            >
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">Admin Panel</span>
              <span className="text-[9px] font-bold uppercase bg-indigo-500/20 px-1.5 py-0.5 rounded-full">Admin</span>
            </a>
          </div>
        )}

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
            <ShipDeskLogoMark className="w-6 h-6" />
            <span className="font-bold text-sm">ShipDesk</span>
          </Link>
          <div className="w-8" />
        </header>

        {/* Trial banner */}
        {workspace && !workspace.lsSubscriptionId && !workspace.adminPlanOverride && workspace.trialEndsAt && (() => {
          const remaining = daysLeft(workspace.trialEndsAt!);
          const active = new Date(workspace.trialEndsAt!) > new Date();
          if (!active) return null;
          const urgent = remaining <= 3;
          return (
            <div className={cn(
              "flex items-center justify-between gap-3 px-4 py-2.5 text-sm flex-shrink-0",
              urgent
                ? "bg-red-500/10 border-b border-red-500/20"
                : "bg-amber-500/10 border-b border-amber-500/20"
            )}>
              <div className="flex items-center gap-2">
                <Clock className={cn("h-4 w-4 flex-shrink-0", urgent ? "text-red-500" : "text-amber-500")} />
                <span className={cn("font-medium", urgent ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
                  {remaining === 0
                    ? "Your trial expires today!"
                    : `${remaining} day${remaining !== 1 ? "s" : ""} remaining in your free trial`}
                </span>
              </div>
              <Link
                href="/billing"
                className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-colors",
                  urgent
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                )}
              >
                Upgrade now
              </Link>
            </div>
          );
        })()}

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
