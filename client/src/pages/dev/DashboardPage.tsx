import { useState } from "react";
import { Plus, FolderOpen, DollarSign, GitMerge, TrendingUp, Search, Archive, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="bg-card border rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">{label}</span>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${accent ? "bg-amber-500/10" : "bg-primary/8"}`}>
          <Icon className={`h-3.5 w-3.5 ${accent ? "text-amber-500" : "text-primary"}`} />
        </div>
      </div>
      <div className="text-xl font-bold leading-none tabular-nums">{value}</div>
      {sub && <p className="text-[11px] text-muted-foreground leading-tight">{sub}</p>}
    </div>
  );
}

export function DashboardPage() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
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
      await createProject.mutateAsync({ name: newName.trim(), description: newDesc || undefined });
      setNewName("");
      setNewDesc("");
      setShowNewProject(false);
      toast({ title: "Project created" });
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast({
        variant: "destructive",
        title: "Failed to create project",
        description:
          errData?.error === "ACTIVE_PROJECT_LIMIT_REACHED"
            ? "You've reached the 50 active project limit."
            : "Please try again.",
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
        {/* Row 1: title + button (always) */}
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
        {/* Row 2: search (full-width) */}
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
            sub={workspace?.slug ? `${workspace.slug}.shipdesk.io` : "Set up workspace"}
          />
        </div>

        {/* Onboarding checklist — hidden once all complete */}
        <OnboardingChecklist />

        {/* Project grid */}
        <div>
          {/* Section header */}
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

          {/* Grid */}
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

      {/* ── New project modal ── */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="proj-name" className="text-xs">Project Name *</Label>
              <Input
                id="proj-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Client Website Redesign"
                maxLength={100}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                data-testid="input-project-name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="proj-desc" className="text-xs">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="proj-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description of this project…"
                maxLength={500}
                className="resize-none text-sm"
                rows={3}
                data-testid="input-project-desc"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewProject(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || createProject.isPending}>
              {createProject.isPending ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
