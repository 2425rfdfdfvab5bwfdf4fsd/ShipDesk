import { useState } from "react";
import { useSEO } from "@/lib/seo";
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
          <div key={integration.name} className="bg-card border rounded-xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-sm font-semibold">{integration.name}</p>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  integration.status === "configured" ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" :
                  "bg-muted text-muted-foreground"
                )}>
                  {integration.statusLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SettingsPage() {
  useSEO({ title: "Settings", noindex: true });
  const [activeTab, setActiveTab] = useState<Tab>("workspace");

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-5 sm:mb-7">
        <h1 className="text-lg sm:text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your workspace configuration and integrations.
        </p>
      </div>

      <div className="flex gap-0.5 sm:gap-1 mb-5 sm:mb-7 border-b overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
