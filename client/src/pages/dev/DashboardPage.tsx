import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FolderOpen, DollarSign, GitMerge, TrendingUp } from "lucide-react";
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
  delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay || 0 }}
      className="bg-card border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export function DashboardPage() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
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
      if (inv.status !== "PAID") {
        acc[inv.projectId] = (acc[inv.projectId] || 0) + 1;
      }
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {workspace ? `${workspace.agencyName || workspace.name}` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} active project{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNewProject(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={activeCount} icon={FolderOpen} delay={0} />
        <StatCard
          label="Unpaid Invoices"
          value={unpaidTotal}
          icon={DollarSign}
          sub={unpaidTotal > 0 ? "Needs attention" : "All clear"}
          delay={0.05}
        />
        <StatCard
          label="Pending Scope"
          value={pendingScope}
          icon={GitMerge}
          sub={pendingScope > 0 ? "Awaiting response" : "None pending"}
          delay={0.1}
        />
        <StatCard
          label="Portal"
          value={workspace?.slug ? "Live" : "—"}
          icon={TrendingUp}
          sub={workspace?.slug ? `${workspace.slug}.portal.shipdesk.io` : "Set up workspace"}
          delay={0.15}
        />
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist />

      {/* Project grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {showArchived ? "Archived Projects" : "Active Projects"}
          </h2>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showArchived ? "← Show active" : "Show archived →"}
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-muted/30 rounded-xl border border-dashed"
          >
            <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              {showArchived ? "No archived projects." : "No projects yet. Create your first one!"}
            </p>
            {!showArchived && (
              <Button onClick={() => setShowNewProject(true)} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Create Project
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects?.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProjectCard
                  project={project}
                  unpaidInvoiceCount={unpaidByProject[project.id] || 0}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New project modal */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name">Project Name *</Label>
              <Input
                id="proj-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Client Website Redesign"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="proj-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description of this project..."
                maxLength={500}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
