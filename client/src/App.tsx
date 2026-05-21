import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { setApiToken } from "./lib/api";

import { AppShell } from "./components/layout/AppShell";
import { ClientPortalLayout } from "./components/layout/ClientPortalLayout";

import { LandingPage } from "./pages/LandingPage";
import { MagicLinkPage } from "./pages/MagicLinkPage";
import { NotFoundPage } from "./pages/NotFoundPage";

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
import { Loader2, Settings2 } from "lucide-react";

function getWorkspaceSlug(): string | null {
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length >= 3 && parts[1] === "portal") {
    return parts[0];
  }
  return null;
}

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

  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  const isPublic = publicRoutes.includes(location);

  useEffect(() => {
    if (isLoaded && !isSignedIn && !isPublic) {
      navigate("/sign-in");
    }
  }, [isLoaded, isSignedIn, isPublic, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn && !isPublic) {
    return null;
  }

  return (
    <>
      <TokenSync />
      <Switch>
        <Route path="/" component={LandingPage} />
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

function ClientPortalApp({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <ClientPortalLayout workspaceSlug={workspaceSlug}>
      <Switch>
        <Route path="/auth/magic" component={MagicLinkPage} />
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
    </ClientPortalLayout>
  );
}

export default function App({ clerkEnabled = false }: { clerkEnabled?: boolean }) {
  const workspaceSlug = getWorkspaceSlug();

  if (workspaceSlug) {
    return <ClientPortalApp workspaceSlug={workspaceSlug} />;
  }

  if (!clerkEnabled) {
    return <SetupPage />;
  }

  return <DevApp />;
}
