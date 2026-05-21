import { useParams, useLocation } from "wouter";
import { Link } from "wouter";
import { FileText, DollarSign, MessageSquare, GitMerge, Upload, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useClientProject, useClientReports, useClientInvoices, useClientMessages } from "@/hooks/useClientPortal";
import { formatRelative } from "@/lib/utils";

export function ClientProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useClientProject(id);
  const { data: reports } = useClientReports(id);
  const { data: invoices } = useClientInvoices(id);
  const { data: messagesData } = useClientMessages(id);

  const latestReport = reports?.[0];
  const unpaidInvoices = (invoices || []).filter((i) => i.status !== "PAID");
  const unreadMessages = (messagesData?.messages || []).filter(
    (m) => m.senderType === "DEVELOPER" && !m.readByClientAt
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-muted-foreground">Project not found.</p>;
  }

  const NAV_ITEMS = [
    {
      href: `/projects/${id}/reports`,
      icon: FileText,
      label: "Reports",
      count: reports?.length,
      description: latestReport ? `Latest: ${formatRelative(latestReport.publishedAt || latestReport.generatedAt)}` : "No reports yet",
    },
    {
      href: `/projects/${id}/messages`,
      icon: MessageSquare,
      label: "Messages",
      count: unreadMessages.length > 0 ? unreadMessages.length : undefined,
      badge: unreadMessages.length > 0 ? "warning" : undefined,
      description: unreadMessages.length > 0 ? `${unreadMessages.length} unread message(s)` : "No new messages",
    },
    {
      href: `/projects/${id}/invoices`,
      icon: DollarSign,
      label: "Invoices",
      count: unpaidInvoices.length > 0 ? unpaidInvoices.length : undefined,
      badge: unpaidInvoices.length > 0 ? "warning" : undefined,
      description: unpaidInvoices.length > 0 ? `${unpaidInvoices.length} unpaid invoice(s)` : "All caught up",
    },
    {
      href: `/projects/${id}/files`,
      icon: Upload,
      label: "Files",
      description: "Share files and documents",
    },
    {
      href: `/projects/${id}/scope-changes`,
      icon: GitMerge,
      label: "Scope Changes",
      description: "Request changes to the project scope",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-1">{project.description}</p>
        )}
      </div>

      {latestReport && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Latest Update
            </p>
            <Link
              href={`/projects/${id}/reports/${latestReport.id}`}
              className="font-medium text-sm hover:text-primary transition-colors"
            >
              {latestReport.title}
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelative(latestReport.publishedAt || latestReport.generatedAt)}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.count !== undefined && item.count > 0 && (
                        <Badge variant={(item.badge as "warning" | undefined) || "secondary"} className="text-xs">
                          {item.count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
