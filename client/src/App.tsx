import { useEffect, useState } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { setApiToken } from "./lib/api";

import { AppShell } from "./components/layout/AppShell";
import { ClientPortalLayout } from "./components/layout/ClientPortalLayout";

import { LandingPage } from "./pages/LandingPage";
import { MagicLinkPage } from "./pages/MagicLinkPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { BuildLogsDemo } from "./pages/BuildLogsDemo";

import { OnboardingPage } from "./pages/dev/OnboardingPage";
import { DashboardPage } from "./pages/dev/DashboardPage";
import { ProjectDetailPage } from "./pages/dev/ProjectDetailPage";
import { InvoicesPage } from "./pages/dev/InvoicesPage";
import { ScopeChangesPage } from "./pages/dev/ScopeChangesPage";
import { SettingsPage } from "./pages/dev/SettingsPage";

import { ClientPortalHomePage } from "./pages/client/ClientPortalHomePage";
import { ClientProjectPage } from "./pages/client/ClientProjectPage";
import { ClientReportsPage } from "./pages/client/ClientReportsPage";
import { ClientReportViewerPage } from "./pages/client/ClientReportViewerPage";
import { ClientFilesPage } from "./pages/client/ClientFilesPage";
import { ClientMessagesPage } from "./pages/client/ClientMessagesPage";
import { ClientInvoicesPage } from "./pages/client/ClientInvoicesPage";
import { ClientScopeChangePage } from "./pages/client/ClientScopeChangePage";

import { SignIn, SignUp } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings2, Globe, AlertTriangle, MailOpen, Lock } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWorkspaceSlug(): string | null {
  const host = window.location.hostname;
  const parts = host.split(".");
  // Production subdomain: acme.portal.shipdesk.io
  if (parts.length >= 3 && parts[1] === "portal") {
    return parts[0];
  }
  // Dev / Replit fallback: path-based routing (/portal/:slug/...)
  const match = window.location.pathname.match(/^\/portal\/([a-z0-9-]+)/);
  return match ? match[1] : null;
}

function isSubdomainPortal(): boolean {
  const parts = window.location.hostname.split(".");
  return parts.length >= 3 && parts[1] === "portal";
}

/** Returns true when the hostname looks like a user-owned custom domain */
function isLikelyCustomDomain(): boolean {
  const host = window.location.hostname;
  // Exclude localhost / bare IPs
  if (host === "localhost" || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return false;
  // Exclude Replit infrastructure domains
  if (
    host.endsWith(".replit.dev") ||
    host.endsWith(".repl.co") ||
    host.endsWith(".replit.app") ||
    host.endsWith(".sisko.replit.dev") ||
    host.endsWith(".kirk.replit.dev")
  ) return false;
  // Exclude deployment platform domains (not user-owned)
  if (
    host.endsWith(".vercel.app") ||
    host.endsWith(".railway.app") ||
    host.endsWith(".up.railway.app") ||
    host.endsWith(".onrender.com") ||
    host.endsWith(".netlify.app") ||
    host.endsWith(".fly.dev") ||
    host.endsWith(".herokuapp.com") ||
    host.endsWith(".pages.dev")
  ) return false;
  // Exclude shipdesk's own domains
  if (host === "shipdesk.io" || host.endsWith(".shipdesk.io")) return false;
  // Must contain at least one dot (rules out bare hostnames)
  return host.includes(".");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    const sync = async () => {
      const token = await getToken();
      if (token) setApiToken(token);
    };
    sync();
    const interval = setInterval(sync, 50_000);
    return () => clearInterval(interval);
  }, [getToken]);
  return null;
}

function DevApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const [location, navigate] = useLocation();

  const publicRoutes = ["/", "/sign-in", "/sign-up", "/build-logs"];
  const isPublic = publicRoutes.includes(location);

  useEffect(() => {
    if (isLoaded && !isSignedIn && !isPublic) {
      navigate("/sign-in");
    }
  }, [isLoaded, isSignedIn, isPublic, navigate]);

  if (!isLoaded || (!isSignedIn && !isPublic)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <TokenSync />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/build-logs" component={BuildLogsDemo} />
        <Route path="/sign-in">
          <div className="min-h-screen flex items-center justify-center bg-background">
            <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/dashboard" />
          </div>
        </Route>
        <Route path="/sign-up">
          <div className="min-h-screen flex items-center justify-center bg-background">
            <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/onboarding" />
          </div>
        </Route>
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/dashboard">
          <AppShell><DashboardPage /></AppShell>
        </Route>
        <Route path="/projects/:id">
          <AppShell><ProjectDetailPage /></AppShell>
        </Route>
        <Route path="/invoices">
          <AppShell><InvoicesPage /></AppShell>
        </Route>
        <Route path="/scope-changes">
          <AppShell><ScopeChangesPage /></AppShell>
        </Route>
        <Route path="/settings">
          <AppShell><SettingsPage /></AppShell>
        </Route>
        <Route path="/settings/workspace">
          <AppShell><SettingsPage /></AppShell>
        </Route>
        <Route component={NotFoundPage} />
      </Switch>
    </>
  );
}

function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Settings2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">ShipDesk Setup</h1>
        <p className="text-muted-foreground">
          Add your environment variables to get started. Copy{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">.env.example</code>{" "}
          to{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">.env</code>{" "}
          and fill in the values below.
        </p>
        <div className="rounded-lg border bg-card text-left p-4 space-y-3">
          {[
            { key: "VITE_CLERK_PUBLISHABLE_KEY", hint: "From clerk.com dashboard → API Keys" },
            { key: "VITE_API_BASE_URL", hint: "Your backend URL, e.g. http://localhost:3000" },
          ].map(({ key, hint }) => (
            <div key={key}>
              <p className="font-mono text-sm font-semibold">{key}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Then restart the dev server and refresh this page.
        </p>
      </div>
    </div>
  );
}

function PortalUnauthScreen({ expired }: { expired?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-5">
            {expired ? (
              <Lock className="h-10 w-10 text-primary" />
            ) : (
              <MailOpen className="h-10 w-10 text-primary" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">
            {expired ? "Session expired" : "Access required"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {expired
              ? "Your session has expired. Please ask your project manager to send you a new invite link."
              : "This portal requires an invitation. Please use the magic link from your email to sign in, or contact your project manager to request access."}
          </p>
        </div>
      </div>
    </div>
  );
}

function PortalAuthGate({ workspaceSlug }: { workspaceSlug: string }) {
  const { data, isLoading, isError, error } = useQuery<{ clientId: string; workspaceId: string }>({
    queryKey: ["portal-auth-me"],
    queryFn: () => api.get("/api/portal/auth/me").then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isExpired =
    isError &&
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error === "SESSION_EXPIRED";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return <PortalUnauthScreen expired={isExpired} />;
  }

  if (!data) return null;

  return (
    <Switch>
      <Route path="/" component={ClientPortalHomePage} />
      <Route path="/projects/:id" component={ClientProjectPage} />
      <Route path="/projects/:id/reports" component={ClientReportsPage} />
      <Route path="/projects/:id/reports/:reportId" component={ClientReportViewerPage} />
      <Route path="/projects/:id/files" component={ClientFilesPage} />
      <Route path="/projects/:id/messages" component={ClientMessagesPage} />
      <Route path="/projects/:id/invoices" component={ClientInvoicesPage} />
      <Route path="/projects/:id/scope-changes" component={ClientScopeChangePage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function ClientPortalApp({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <ClientPortalLayout workspaceSlug={workspaceSlug}>
      <Switch>
        <Route path="/auth/magic" component={MagicLinkPage} />
        <Route>
          <PortalAuthGate workspaceSlug={workspaceSlug} />
        </Route>
      </Switch>
    </ClientPortalLayout>
  );
}

// Resolves a custom domain to a workspace slug by calling the backend.
// Shows a spinner while loading and an error screen if the domain isn't mapped.
function CustomDomainPortal() {
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    fetch(`/api/portal/resolve-domain?domain=${encodeURIComponent(hostname)}`)
      .then((r) => {
        if (!r.ok) throw new Error("not_found");
        return r.json();
      })
      .then((data: { slug: string }) => setSlug(data.slug))
      .catch(() => setError(hostname));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Domain not found</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{error}</span> is not linked to any ShipDesk workspace. If you just set this up, DNS propagation can take up to 48 hours.
          </p>
        </div>
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Globe className="h-8 w-8 text-muted-foreground animate-pulse" />
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return <ClientPortalApp workspaceSlug={slug} />;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function App({ clerkEnabled = false }: { clerkEnabled?: boolean }) {
  const workspaceSlug = getWorkspaceSlug();

  // 1. Known portal subdomain (e.g. acme.portal.shipdesk.io)
  if (workspaceSlug) {
    if (isSubdomainPortal()) {
      return <ClientPortalApp workspaceSlug={workspaceSlug} />;
    }
    // Path-based dev routing (/portal/:slug/...)
    return (
      <Router base={`/portal/${workspaceSlug}`}>
        <ClientPortalApp workspaceSlug={workspaceSlug} />
      </Router>
    );
  }

  // 2. Custom domain (e.g. portal.carboy.com) — resolve asynchronously
  if (isLikelyCustomDomain()) {
    return <CustomDomainPortal />;
  }

  // 3. Dev / production app
  if (!clerkEnabled) {
    return <SetupPage />;
  }

  return <DevApp />;
}
