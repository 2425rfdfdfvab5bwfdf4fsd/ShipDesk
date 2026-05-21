import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClientProjects } from "@/hooks/useClientPortal";
import { formatRelative } from "@/lib/utils";
import { motion } from "framer-motion";

export function ClientPortalHomePage() {
  const [, navigate] = useLocation();
  const { data: projects, isLoading } = useClientProjects();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">You don't have access to any projects yet.</p>
      </div>
    );
  }

  if (projects.length === 1) {
    navigate(`/projects/${projects[0].id}`);
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Projects</h1>
      <div className="grid gap-4">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {formatRelative(project.updatedAt)}
                  </p>
                </div>
                <Badge
                  variant={
                    project.status === "ACTIVE" ? "success" :
                    project.status === "PAUSED" ? "warning" : "secondary"
                  }
                >
                  {project.status}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
