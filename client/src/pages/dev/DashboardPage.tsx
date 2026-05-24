import { useState } from "react";
import { useSEO } from "@/lib/seo";
import { Plus, FolderOpen, DollarSign, GitMerge, TrendingUp, Search, Archive, LayoutGrid, Loader2, Briefcase, User, AlignLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { useInvoices } from "@/hooks/useInvoices";
import { useScopeChanges } from "@/hooks/useScopeChanges";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card border rounded-xl p-3 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase truncate">{label}</span>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${accent ? "bg-amber-500/10" : "bg-primary/8"}`}>
          <Icon className={`h-3.5 w-3.5 ${accent ? "text-amber-500" : "text-primary"}`} />
        </div>
      </div>
      <div className="text-xl font-bold leading-none tabular-nums">{value}</div>
      {sub && <p className="text-[11px] text-muted-foreground leading-tight truncate" title={sub}>{sub}</p>}
    </div>
  );
}

export function DashboardPage() {
  useSEO({ title: "Dashboard", noindex: true });
  const [showNewProject, setShowNewProject] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: workspace } = useWorkspace();
  const { data: projects, isLoading } = useProjects(showArchived ? "COMPLETED" : undefined);
  const { data: allProjects } = useProjects();
  const { data: invoicesData } = useInvoices();
  const { data: scopeChanges } = useScopeChanges();
  const createProject = useCreateProject();

  const unpaidByProject = (invoicesData?.invoices || []).reduce<Record<string, number>>(
    (acc, inv) => {
      if (inv.status !== "PAID") acc[inv.projectId] = (acc[inv.projectId] || 0) + 1;
      return acc;
    },
    {}
  );

  const activeCount = allProjects?.filter((p) => p.status === "ACTIVE").length ?? 0;
  const unpaidTotal = (invoicesData?.invoices || []).filter((i) => i.status !== "PAID").length;
  const pendingScope = (Array.isArray(scopeChanges) ? scopeChanges : []).filter(
    (s) => s.status === "PENDING" || s.status === "QUOTED"
  ).length;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createProject.mutateAsync({
        name: newName.trim(),
        clientName: newClientName.trim() || undefined,
        description: newDesc || undefined,
      });
      setNewName("");
      setNewClientName("");
      setNewDesc("");
      setShowNewProject(false);
      toast({ title: "Project created" });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
      const status = axiosErr?.response?.status;
      const errCode = axiosErr?.response?.data?.error;
      const errMsg = axiosErr?.response?.data?.message;
      console.error("[createProject] failed", { status, errCode, errMsg, err });
      const description =
        errCode === "ACTIVE_PROJECT_LIMIT_REACHED"
          ? "You've reached the 50 active project limit."
          : errCode === "NOT_FOUND"
          ? "Workspace not found. Please complete onboarding first."
          : errCode === "UNAUTHORIZED" || status === 401
          ? "Session expired. Please sign out and sign back in."
          : errCode
          ? `Server error: ${errCode}${errMsg ? ` — ${errMsg}` : ""}`
          : axiosErr?.message
          ? `Request failed: ${axiosErr.message}`
          : "Please try again.";
      toast({
        variant: "destructive",
        title: "Failed to create project",
        description,
      });
    }
  };

  const filteredProjects = (projects || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 sm:px-6 py-2.5">
        {/* Row 1: title + button */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate">
              {workspace ? workspace.agencyName || workspace.name : "Dashboard"}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {activeCount} active project{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewProject(true)}
            className="h-7 gap-1 px-2.5 text-xs shrink-0"
            data-testid="button-new-project"
          >
            <Plus className="h-3.5 w-3.5" /> New Project
          </Button>
        </div>
        {/* Row 2: search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="pl-7 h-7 text-xs"
            data-testid="input-project-search"
          />
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="px-4 sm:px-6 py-4 space-y-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <StatCard label="Active" value={activeCount} icon={FolderOpen} />
          <StatCard
            label="Unpaid"
            value={unpaidTotal}
            icon={DollarSign}
            sub={unpaidTotal > 0 ? "Needs attention" : "All clear"}
            accent={unpaidTotal > 0}
          />
          <StatCard
            label="Scope"
            value={pendingScope}
            icon={GitMerge}
            sub={pendingScope > 0 ? "Awaiting response" : "None pending"}
            accent={pendingScope > 0}
          />
          <StatCard
            label="Portal"
            value={workspace?.slug ? "Live" : "—"}
            icon={TrendingUp}
            sub={workspace?.slug ? `shipdesk-delta.vercel.app/portal/${workspace.slug}` : "Set up workspace"}
          />
        </div>

        {/* Onboarding checklist */}
        <OnboardingChecklist />

        {/* Project grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {showArchived
                ? <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                : <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />}
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {showArchived ? "Archived" : "Active Projects"}
              </h2>
              {!isLoading && (
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  ({filteredProjects.length})
                </span>
              )}
            </div>
            <button
              onClick={() => { setShowArchived(!showArchived); setSearch(""); }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
              data-testid="button-toggle-archived"
            >
              {showArchived ? (
                <><LayoutGrid className="h-3 w-3" /> Active</>
              ) : (
                <><Archive className="h-3 w-3" /> Archived</>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-14 bg-muted/20 rounded-xl border border-dashed">
              <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground mb-3">
                {search
                  ? `No projects matching "${search}"`
                  : showArchived
                  ? "No archived projects."
                  : "No projects yet. Create your first one."}
              </p>
              {!showArchived && !search && (
                <Button onClick={() => setShowNewProject(true)} size="sm" className="h-7 gap-1 px-2.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Create Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  unpaidInvoiceCount={unpaidByProject[project.id] || 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── New project slide-over ── */}
      <Sheet open={showNewProject} onOpenChange={(open) => {
        setShowNewProject(open);
        if (!open) { setNewName(""); setNewClientName(""); setNewDesc(""); }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
          <SheetHeader className="sr-only">
            <SheetTitle>New Project</SheetTitle>
            <SheetDescription>Fill in the details below to create a new client project.</SheetDescription>
          </SheetHeader>

          {/* Coloured header band */}
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b px-6 pt-8 pb-6 shrink-0">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-semibold leading-tight">New Project</h2>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">Draft</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Set up a project to track deliverables, share updates, and send invoices to your client.
                </p>
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Project Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="proj-name" className="text-xs font-medium flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  Project Name
                  <span className="text-destructive">*</span>
                </Label>
                <span className={`text-[10px] tabular-nums transition-colors ${newName.length > 80 ? "text-amber-500" : "text-muted-foreground/50"}`}>
                  {newName.length}/100
                </span>
              </div>
              <Input
                id="proj-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Client Website Redesign"
                maxLength={100}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="h-9 text-sm"
                data-testid="input-project-name"
              />
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="proj-client-name" className="text-xs font-medium flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  Client Name
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <span className={`text-[10px] tabular-nums transition-colors ${newClientName.length > 80 ? "text-amber-500" : "text-muted-foreground/50"}`}>
                  {newClientName.length > 0 ? `${newClientName.length}/100` : ""}
                </span>
              </div>
              <Input
                id="proj-client-name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g. Acme Corp or John Smith"
                maxLength={100}
                className="h-9 text-sm"
                data-testid="input-project-client-name"
              />
              <div className="flex items-start gap-1.5 bg-muted/40 rounded-lg px-3 py-2">
                <Sparkles className="h-3 w-3 text-primary/60 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Used to personalise AI reports — e.g. <span className="text-foreground/70 font-medium">"Hi Acme Corp,"</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="proj-desc" className="text-xs font-medium flex items-center gap-1.5">
                  <AlignLeft className="h-3 w-3 text-muted-foreground" />
                  Description
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <span className={`text-[10px] tabular-nums transition-colors ${newDesc.length > 400 ? "text-amber-500" : "text-muted-foreground/50"}`}>
                  {newDesc.length > 0 ? `${newDesc.length}/500` : ""}
                </span>
              </div>
              <Textarea
                id="proj-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description of scope, goals, or any notes for this project…"
                maxLength={500}
                className="resize-none text-sm min-h-[100px]"
                rows={4}
                data-testid="input-project-desc"
              />
            </div>

            {/* Live preview pill */}
            {(newName.trim() || newClientName.trim()) && (
              <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{newName || "Untitled Project"}</p>
                    {newClientName && (
                      <p className="text-[11px] text-muted-foreground truncate">{newClientName}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">Active</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t bg-muted/20 px-6 py-4 space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewProject(false)}
                className="flex-1 h-9"
                data-testid="button-cancel-project"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || createProject.isPending}
                className="flex-1 h-9"
                data-testid="button-create-project"
              >
                {createProject.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Creating…</>
                ) : (
                  <><Plus className="h-3.5 w-3.5 mr-1.5" />Create Project</>
                )}
              </Button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground/60">
              Press <kbd className="font-mono bg-muted border rounded px-1 text-[10px]">Enter</kbd> to submit quickly
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
