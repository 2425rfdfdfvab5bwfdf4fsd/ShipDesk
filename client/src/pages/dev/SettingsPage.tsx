import { useState } from "react";
import { Github, Palette, Globe, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSettingsForm } from "@/components/workspace/WorkspaceSettingsForm";

const TABS = [
  { key: "workspace", label: "Workspace", icon: Globe },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "integrations", label: "Integrations", icon: Github },
] as const;

type Tab = typeof TABS[number]["key"];

function IntegrationsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold mb-0.5">Integrations</h2>
        <p className="text-xs text-muted-foreground">Connect third-party services to enhance your reports.</p>
      </div>

      {[
        {
          name: "GitHub",
          icon: Github,
          description: "Connect your GitHub account to enable AI report generation from commit history, PRs, and releases.",
          status: "configured",
          statusLabel: "Connect from Project Settings",
          statusVariant: "info",
          action: null,
        },
        {
          name: "Linear",
          icon: Shield,
          description: "Pull Linear issue activity into weekly reports alongside GitHub data.",
          status: "coming_soon",
          statusLabel: "Coming in v1.1",
          statusVariant: "secondary",
          action: null,
        },
        {
          name: "Vercel",
          icon: Globe,
          description: "Include deployment activity in your reports — show clients when new versions ship.",
          status: "coming_soon",
          statusLabel: "Coming in v1.1",
          statusVariant: "secondary",
          action: null,
        },
      ].map((integration) => {
        const Icon = integration.icon;
        return (
          <div key={integration.name} className="bg-card border rounded-xl p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">{integration.name}</p>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    integration.status === "configured" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {integration.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("workspace");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your workspace configuration and integrations.
        </p>
      </div>

      <div className="flex gap-1 mb-7 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "workspace" && <WorkspaceSettingsForm showBranding={false} />}
      {activeTab === "branding" && <WorkspaceSettingsForm showBrandingOnly />}
      {activeTab === "integrations" && <IntegrationsTab />}
    </div>
  );
}
