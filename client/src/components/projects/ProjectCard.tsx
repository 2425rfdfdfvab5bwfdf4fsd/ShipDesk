import { Link } from "wouter";
import { motion } from "framer-motion";
import { GitBranch, DollarSign, Activity, Pause, CheckCircle, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types";
import { formatRelative } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  unpaidInvoiceCount?: number;
}

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", variant: "success" as const, icon: Activity },
  PAUSED: { label: "Paused", variant: "warning" as const, icon: Pause },
  COMPLETED: { label: "Completed", variant: "secondary" as const, icon: CheckCircle },
};

export function ProjectCard({ project, unpaidInvoiceCount = 0 }: ProjectCardProps) {
  const statusCfg = STATUS_CONFIG[project.status];
  const StatusIcon = statusCfg.icon;

  return (
    <Link href={`/projects/${project.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="group block bg-card border rounded-xl p-5 hover:shadow-md hover:border-border/80 transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-sm leading-snug pr-2 group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant={statusCfg.variant} className="gap-1 text-xs">
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </Badge>
          </div>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {project.githubRepoFullName ? (
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3 text-primary/70" />
                <span className="font-mono truncate max-w-[130px]">{project.githubRepoFullName}</span>
              </span>
            ) : (
              <span className="text-muted-foreground/50 italic">No GitHub repo</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {unpaidInvoiceCount > 0 && (
              <Badge variant="warning" className="gap-1 text-xs">
                <DollarSign className="h-3 w-3" />
                {unpaidInvoiceCount}
              </Badge>
            )}
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          Updated {formatRelative(project.updatedAt)}
        </div>
      </motion.div>
    </Link>
  );
}
