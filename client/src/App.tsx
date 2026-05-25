import { useEffect } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { api, setApiToken } from "./lib/api";

import { AppShell } from "./components/layout/AppShell";
import { ClientPortalLayout } from "./components/layout/ClientPortalLayout";

import { LandingPage } from "./pages/LandingPage";
import { MagicLinkPage } from "./pages/MagicLinkPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminPage } from "./pages/admin/AdminPage";
import { BuildLogsDemo } from "./pages/BuildLogsDemo";
import { PrivacyPolicyPage } from "./pages/legal/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/legal/TermsOfServicePage";
import { CookiePolicyPage } from "./pages/legal/CookiePolicyPage";
import { ContactUsPage } from "./pages/legal/ContactUsPage";

import { OnboardingPage } from "./pages/dev/OnboardingPage";
import { DashboardPage } from "./pages/dev/DashboardPage";
import { ProjectDetailPage } from "./pages/dev/ProjectDetailPage";
import { InvoicesPage } from "./pages/dev/InvoicesPage";
import { ScopeChangesPage } from "./pages/dev/ScopeChangesPage";
import { SettingsPage } from "./pages/dev/SettingsPage";
import { BillingPage } from "./pages/dev/BillingPage";
import { TrialExpiredPage } from "./pages/dev/TrialExpiredPage";
import { TeamJoinPage } from "./pages/dev/TeamJoinPage";

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
import { Loader2, Settings2, MailOpen, Lock } from "lucide-react";

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

interface BillingStatus {
  plan: "FREE" | "STARTER" | "SOLO" | "AGENCY";
  lsSubscriptionId: string | null;
  trialEndsAt: string | null;
}

function TrialGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { data: billing } = useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: () => api.get("/api/billing/status").then((r) => r.data),
    enabled: !!isSignedIn,
    staleTime: 60_000,
  });

  if (
    isSignedIn &&
    billing &&
    !billing.lsSubscriptionId &&
    billing.trialEndsAt != null &&
    new Date(billing.trialEndsAt) < new Date()
  ) {
    return <TrialExpiredPage />;
  }

  return <>{children}</>;
}

function DevApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const [location, navigate] = useLocation();

  const publicRoutes = ["/", "/sign-in", "/sign-up", "/build-logs", "/privacy", "/terms", "/cookies", "/contact", "/billing", "/team/join"];
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
        <Route path="/privacy" component={PrivacyPolicyPage} />
        <Route path="/terms" component={TermsOfServicePage} />
        <Route path="/cookies" component={CookiePolicyPage} />
        <Route path="/contact" component={ContactUsPage} />
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
        <Route path="/team/join" component={TeamJoinPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/billing">
          <AppShell><BillingPage /></AppShell>
        </Route>
        <Route path="/dashboard">
          <TrialGate><AppShell><DashboardPage /></AppShell></TrialGate>
        </Route>
        <Route path="/projects/:id">
          <TrialGate><AppShell><ProjectDetailPage /></AppShell></TrialGate>
        </Route>
        <Route path="/invoices">
          <TrialGate><AppShell><InvoicesPage /></AppShell></TrialGate>
        </Route>
        <Route path="/scope-changes">
          <TrialGate><AppShell><ScopeChangesPage /></AppShell></TrialGate>
        </Route>
        <Route path="/settings">
          <TrialGate><AppShell><SettingsPage /></AppShell></TrialGate>
        </Route>
        <Route path="/settings/workspace">
          <TrialGate><AppShell><SettingsPage /></AppShell></TrialGate>
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

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function App({ clerkEnabled = false }: { clerkEnabled?: boolean }) {
  const workspaceSlug = getWorkspaceSlug();

  // 0. Admin panel — own auth, no Clerk required
  if (window.location.pathname.startsWith("/admin")) {
    return <AdminPage />;
  }

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

  // 2. Dev / production app
  if (!clerkEnabled) {
    return <SetupPage />;
  }

  return <DevApp />;
}
