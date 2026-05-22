import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, AlertTriangle, Github, Users, Plus, Trash2,
  CheckCircle, PauseCircle, XCircle, Loader2, Search, Unlink, Lock,
  FileText, Receipt, GitPullRequest, LayoutDashboard, BarChart2,
  FolderOpen, MessageSquare, ScrollText, ArrowRightLeft, Server, Settings2,
  Edit2, UserMinus, Zap, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCard } from "@/components/reports/ReportCard";
import { ReportViewer } from "@/components/reports/ReportViewer";
import { GenerateReportButton } from "@/components/reports/GenerateReportButton";
import { InvoiceCard } from "@/components/invoices/InvoiceCard";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { ScopeChangeCard } from "@/components/scope/ScopeChangeCard";
import { QuoteForm } from "@/components/scope/QuoteForm";
import { MessageThread } from "@/components/messages/MessageThread";
import { FileList } from "@/components/files/FileList";
import { BuildLogsViewer } from "@/components/deployments/BuildLogsViewer";
import { useProject, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useGitHubRepos, useConnectRepo, useDisconnectRepo, useGitHubStatus } from "@/hooks/useGitHub";
import { useReport, useReports, useUpdateReport, useDeleteReport } from "@/hooks/useReports";
import { useInvoices, useMarkInvoicePaid, useDeleteInvoice } from "@/hooks/useInvoices";
import { useScopeChanges, useSubmitQuote, useMarkScopeChangePaid } from "@/hooks/useScopeChanges";
import { useMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/useMessages";
import { useFiles, useCreateFile, useDeleteFile, useUploadSignature } from "@/hooks/useFiles";
import { useProjectClients, useInviteClient, useRevokeClientAccess } from "@/hooks/useClients";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { ScopeChange } from "@/types";

function GitHubConnectButton({
  className, variant = "outline", label,
}: {
  className?: string; variant?: "outline" | "link"; label?: string;
}) {
  const { getToken } = useAuth();
  const handleConnect = useCallback(async () => {
    const token = await getToken();
    if (token) window.open(`/api/github/connect?token=${token}`, "_blank", "noopener,noreferrer");
  }, [getToken]);
  return (
    <Button variant={variant} size="sm" className={className} onClick={handleConnect} data-testid="button-github-connect">
      <Github className="h-3.5 w-3.5" />
      {label ?? "Connect"}
    </Button>
  );
}

function ReportViewerDialog({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const { data: report, isLoading } = useReport(reportId);
  const publishReport = useUpdateReport();
  const editReport = useUpdateReport();

  if (isLoading) return (
    <div className="space-y-4 py-2">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3.5 w-1/4" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
  if (!report) return null;
  return (
    <ReportViewer
      report={report}
      canEdit
      onPublish={async (id) => {
        try {
          await publishReport.mutateAsync({ id, data: { status: "PUBLISHED" } });
          onClose();
          toast({ title: "Report published to client" });
        } catch {
          toast({ variant: "destructive", title: "Failed to publish report", description: "Please try again." });
        }
      }}
      onEdit={(id, content) => {
        editReport.mutate({ id, data: { content: { rawMarkdown: content } } });
        toast({ title: "Report saved" });
      }}
      isPublishing={publishReport.isPending}
    />
  );
}

const STATUS_ICON: Record<string, React.ElementType> = { ACTIVE: CheckCircle, PAUSED: PauseCircle, COMPLETED: XCircle };
const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = { ACTIVE: "success", PAUSED: "warning", COMPLETED: "secondary" };
const TAB_CONFIG = [
  { value: "overview",      label: "Overview",   icon: LayoutDashboard },
  { value: "reports",       label: "Reports",    icon: BarChart2 },
  { value: "files",         label: "Files",      icon: FolderOpen },
  { value: "messages",      label: "Messages",   icon: MessageSquare },
  { value: "invoices",      label: "Invoices",   icon: ScrollText },
  { value: "scope-changes", label: "Scope",      icon: ArrowRightLeft },
  { value: "deployments",   label: "Deploy",     icon: Server },
  { value: "settings",      label: "Settings",   icon: Settings2 },
];

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="font-semibold text-sm leading-tight">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center gap-3">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      </div>
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState<string | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<ScopeChange | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeaderHeight(el.offsetHeight));
    observer.observe(el);
    setHeaderHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, []);

  const { data: project, isLoading } = useProject(id);
  const { data: reportsData, isLoading: reportsLoading } = useReports(id);
  const { data: invoicesData } = useInvoices(id);
  const { data: scopeChanges } = useScopeChanges(id);
  const { data: messagesData, isLoading: messagesLoading } = useMessages(id);
  const { data: files, isLoading: filesLoading } = useFiles(id);
  const { data: uploadSig } = useUploadSignature(id);
  const { data: githubStatus, isLoading: githubStatusLoading } = useGitHubStatus();
  const { data: githubRepos, isLoading: reposLoading, error: reposError } = useGitHubRepos(repoSearch || undefined, showRepoPicker);

  const markRead = useMarkMessagesRead();
  const sendMessage = useSendMessage();
  const markInvoicePaid = useMarkInvoicePaid();
  const deleteInvoice = useDeleteInvoice();
  const submitQuote = useSubmitQuote();
  const markScopePaid = useMarkScopeChangePaid();
  const createFile = useCreateFile();
  const deleteFile = useDeleteFile();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const connectRepo = useConnectRepo();
  const disconnectRepo = useDisconnectRepo();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const { data: projectClients, isLoading: clientsLoading } = useProjectClients(id);
  const inviteClient = useInviteClient();
  const revokeClient = useRevokeClientAccess();

  const STATUS_TRANSITIONS: Record<string, string[]> = { ACTIVE: ["PAUSED", "COMPLETED"], PAUSED: ["ACTIVE", "COMPLETED"], COMPLETED: [] };

  const handleStatusChange = async (newStatus: "ACTIVE" | "PAUSED" | "COMPLETED") => {
    if (!project) return;
    setStatusUpdating(true);
    try {
      await updateProject.mutateAsync({ id: project.id, data: { status: newStatus } });
      toast({ title: `Project marked as ${newStatus.toLowerCase()}` });
    } catch {
      toast({ variant: "destructive", title: "Failed to update status" });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      await deleteProject.mutateAsync(project.id);
      navigate("/dashboard");
      toast({ title: "Project deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete project" });
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!uploadSig) {
      toast({ variant: "destructive", title: "Upload signature unavailable", description: "Configure Cloudinary to enable file uploads." });
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", uploadSig.apiKey);
    formData.append("timestamp", String(uploadSig.timestamp));
    formData.append("signature", uploadSig.signature);
    formData.append("folder", uploadSig.folder);
    formData.append("upload_preset", uploadSig.uploadPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${uploadSig.cloudName}/raw/upload`, { method: "POST", body: formData });
      const data = await res.json() as { secure_url: string; public_id: string; bytes: number; format: string };
      await createFile.mutateAsync({ projectId: id, fileName: file.name, fileSize: file.size, mimeType: file.type, cloudinaryPublicId: data.public_id, cloudinarySecureUrl: data.secure_url });
      toast({ title: "File uploaded" });
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-16" /></div>
        <Skeleton className="h-9 w-full mt-2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="font-medium text-sm">Project not found</p>
        <p className="text-xs text-muted-foreground mt-1">This project may have been deleted.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const hasGitHub = !!project.githubRepoFullName;
  const StatusIcon = STATUS_ICON[project.status] ?? CheckCircle;
  const unpaidInvoices = (invoicesData?.invoices || []).filter((i) => i.status !== "PAID").length;
  const pendingScopes = (scopeChanges || []).filter((s) => s.status === "PENDING").length;
  const publishedReports = (reportsData?.reports || []).filter((r) => r.status === "PUBLISHED").length;
  const reports = reportsData?.reports || [];
  const invoices = invoicesData?.invoices || [];
  const messages = messagesData?.messages || [];
  const unreadMessages = messages.filter((m) => m.senderType === "CLIENT" && !m.readByDeveloperAt).length;

  return (
    <div className="flex flex-col min-h-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => { setActiveTab(v); if (v === "messages" && unreadMessages > 0) markRead.mutate(id); }}
        className="flex flex-col flex-1"
      >
        {/* ── Sticky header ── */}
        <div ref={headerRef} className="border-b bg-card sticky top-0 z-10">
          <div className="px-3 sm:px-5 pt-2.5">
            {/* Back nav */}
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Dashboard
            </button>

            {/* Title row */}
            <div className="flex items-center justify-between gap-2 pb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight truncate">
                  {project.name}
                </h1>
                <Badge variant={STATUS_VARIANT[project.status] ?? "secondary"} className="gap-1 shrink-0 text-[10px] px-1.5 py-0.5">
                  <StatusIcon className="h-2.5 w-2.5" />
                  <span className="hidden xs:inline">{project.status.charAt(0) + project.status.slice(1).toLowerCase()}</span>
                </Badge>
              </div>

              {/* Desktop actions */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs px-2.5" onClick={() => setShowInviteModal(true)} data-testid="button-invite-client">
                  <Users className="h-3 w-3" /> Invite
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs px-2.5" onClick={() => setShowInvoiceModal(true)} data-testid="button-new-invoice">
                  <Plus className="h-3 w-3" /> Invoice
                </Button>
                <GenerateReportButton projectId={id} hasGitHub={hasGitHub} size="sm" />
              </div>

              {/* Mobile actions — compact dropdown */}
              <div className="flex sm:hidden items-center gap-1 shrink-0">
                <GenerateReportButton projectId={id} hasGitHub={hasGitHub} size="sm" iconOnly />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" data-testid="button-mobile-actions">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-sm">
                    <DropdownMenuItem onClick={() => setShowInviteModal(true)}>
                      <Users className="h-3.5 w-3.5 mr-2" /> Invite Client
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowInvoiceModal(true)}>
                      <Plus className="h-3.5 w-3.5 mr-2" /> New Invoice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mobile tab bar — 2 rows × 4 columns */}
          <TabsList className="sm:hidden bg-transparent border-none rounded-none h-auto p-0 grid grid-cols-4 w-full">
            {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-col gap-0.5 px-1 py-2 text-[10px] font-medium text-muted-foreground data-[state=active]:text-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {value === "messages" && unreadMessages > 0 && (
                  <span className="absolute top-1 right-2 inline-flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Desktop tab bar — single scrollable row */}
          <div className="hidden sm:block overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="bg-transparent border-none rounded-none h-auto p-0 gap-0 w-max pl-5 pr-5">
              {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1 px-3.5 py-2.5 text-xs font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                  {value === "messages" && unreadMessages > 0 && (
                    <span className="ml-0.5 inline-flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-h-0 overflow-auto">

          {/* ── Overview ── */}
          <TabsContent value="overview" className="mt-0 p-3 sm:p-5 space-y-4">

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  tab: "reports", icon: FileText, iconBg: "bg-blue-50 dark:bg-blue-950/40", iconColor: "text-blue-600 dark:text-blue-400",
                  label: "Reports", value: reports.length, sub: `${publishedReports} published`,
                  testId: "stat-card-reports",
                },
                {
                  tab: "invoices", icon: Receipt, iconBg: "bg-emerald-50 dark:bg-emerald-950/40", iconColor: "text-emerald-600 dark:text-emerald-400",
                  label: "Invoices", value: unpaidInvoices, sub: `${invoices.length} total`,
                  testId: "stat-card-invoices",
                },
                {
                  tab: "scope-changes", icon: GitPullRequest, iconBg: "bg-orange-50 dark:bg-orange-950/40", iconColor: "text-orange-600 dark:text-orange-400",
                  label: "Scope", value: (scopeChanges || []).length, sub: `${pendingScopes} pending`,
                  testId: "stat-card-scope-changes",
                },
                {
                  tab: "messages", icon: MessageSquare,
                  iconBg: unreadMessages > 0 ? "bg-violet-50 dark:bg-violet-950/40" : "bg-muted/50",
                  iconColor: unreadMessages > 0 ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground",
                  label: "Messages", value: unreadMessages > 0 ? unreadMessages : messages.length,
                  sub: unreadMessages > 0 ? "unread" : `${messages.length} total`,
                  testId: "stat-card-messages",
                  onClick: () => { setActiveTab("messages"); markRead.mutate(id); },
                },
              ].map(({ tab, icon: Icon, iconBg, iconColor, label, value, sub, testId, onClick }) => (
                <button
                  key={tab}
                  className="bg-card border rounded-lg p-3 flex items-center gap-2.5 hover:bg-accent/40 active:bg-accent/60 transition-colors text-left w-full"
                  onClick={onClick ?? (() => setActiveTab(tab))}
                  data-testid={testId}
                >
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium leading-none mb-0.5">{label}</p>
                    <p className="text-xl font-bold leading-tight">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* GitHub status */}
            <div className="bg-card border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Github className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold">GitHub</p>
              </div>
              {githubStatusLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : hasGitHub ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{project.githubRepoFullName}</span>
                  <Badge variant="success" className="gap-1 text-[10px] px-1.5 py-0.5"><CheckCircle className="h-2.5 w-2.5" /> Connected</Badge>
                </div>
              ) : githubStatus?.connected ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="warning" className="gap-1 text-[10px]"><AlertTriangle className="h-2.5 w-2.5" /> No repo linked</Badge>
                  <Button variant="outline" size="sm" className="gap-1 h-6 text-xs px-2" onClick={() => { setActiveTab("settings"); setShowRepoPicker(true); }} data-testid="button-link-repo">
                    <Github className="h-2.5 w-2.5" /> Link Repo
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="warning" className="gap-1 text-[10px]"><AlertTriangle className="h-2.5 w-2.5" /> Not connected</Badge>
                  <GitHubConnectButton className="gap-1 h-6 text-xs px-2" label="Connect" />
                </div>
              )}
            </div>

            {/* Latest report / CTA */}
            {reports.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold">Latest Report</p>
                  <button className="text-[10px] text-primary hover:underline" onClick={() => setActiveTab("reports")}>View all →</button>
                </div>
                <ReportCard report={reports[0]} onClick={() => setShowReportViewer(reports[0].id)} />
              </div>
            ) : hasGitHub ? (
              <div className="bg-card border rounded-lg p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Generate your first report</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Summarise GitHub activity into a client update.</p>
                </div>
                <GenerateReportButton projectId={id} hasGitHub={true} size="sm" variant="outline" />
              </div>
            ) : null}

          </TabsContent>

          {/* ── Reports ── */}
          <TabsContent value="reports" className="mt-0 p-3 sm:p-5">
            <SectionHeader
              title="Reports"
              description="AI-generated weekly status updates for your client."
              action={<GenerateReportButton projectId={id} hasGitHub={hasGitHub} size="sm" variant="outline" />}
            />
            {reportsLoading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No reports yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {hasGitHub ? "Generate your first report to share progress." : "Connect a GitHub repository to start generating reports."}
                  </p>
                </div>
                {hasGitHub && <GenerateReportButton projectId={id} hasGitHub={true} size="sm" />}
              </div>
            ) : (
              <div className="space-y-2.5">
                {reports.map((r) => (
                  <div key={r.id} className="group">
                    <ReportCard report={r} onClick={() => setShowReportViewer(r.id)} />
                    {r.status === "DRAFT" && (
                      <div className="flex items-center justify-end gap-1.5 mt-1.5">
                        <button
                          className="h-6 px-2 rounded text-[10px] flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          data-testid={`button-publish-report-${r.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateReport.mutate({ id: r.id, data: { status: "PUBLISHED" } });
                            toast({ title: "Report published to client" });
                          }}
                        >
                          <CheckCircle className="h-2.5 w-2.5" /> Publish
                        </button>
                        <button
                          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete draft"
                          data-testid={`button-delete-report-${r.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReport.mutate(r.id);
                            toast({ title: "Draft deleted" });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Files ── */}
          <TabsContent value="files" className="mt-0 p-3 sm:p-5">
            <SectionHeader
              title="Files"
              description="Upload and share documents with your client."
            />
            <FileList
              files={files || []}
              onUpload={handleUploadFile}
              onDelete={(fileId) => {
                deleteFile.mutate({ projectId: id, fileId });
                toast({ title: "File deleted" });
              }}
              uploading={createFile.isPending}
              isLoading={filesLoading}
            />
          </TabsContent>

          {/* ── Messages ── */}
          <TabsContent
            value="messages"
            className="mt-0 relative"
            style={{ height: headerHeight > 0 ? `calc(100dvh - ${headerHeight}px)` : "calc(100dvh - 160px)" }}
          >
            <MessageThread
              messages={messages}
              currentSenderType="DEVELOPER"
              projectName={project?.name}
              unreadCount={unreadMessages}
              onSend={async (body) => {
                await sendMessage.mutateAsync({ projectId: id, body });
              }}
              isSending={sendMessage.isPending}
              isLoading={messagesLoading}
            />
          </TabsContent>

          {/* ── Invoices ── */}
          <TabsContent value="invoices" className="mt-0 p-3 sm:p-5">
            <SectionHeader
              title="Invoices"
              description="Track payments and outstanding balances."
              action={
                <Button size="sm" className="h-7 gap-1 text-xs px-2.5" onClick={() => setShowInvoiceModal(true)}>
                  <Plus className="h-3 w-3" /> New
                </Button>
              }
            />
            {invoices.length === 0 ? (
              <EmptyState icon={ScrollText} title="No invoices yet" description="Create your first invoice to send to your client." />
            ) : (
              <div className="space-y-2.5">
                {invoices.map((inv) => (
                  <InvoiceCard
                    key={inv.id}
                    invoice={inv}
                    onMarkPaid={(id) => { markInvoicePaid.mutate(id); toast({ title: "Marked as paid" }); }}
                    onDelete={(id) => { deleteInvoice.mutate(id); toast({ title: "Invoice deleted" }); }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Scope Changes ── */}
          <TabsContent value="scope-changes" className="mt-0 p-3 sm:p-5">
            <SectionHeader title="Scope Changes" description="Client-submitted requests for additional work." />
            {(scopeChanges || []).length === 0 ? (
              <EmptyState icon={ArrowRightLeft} title="No scope change requests" description="When clients request additional work, it will appear here." />
            ) : (
              <div className="space-y-2.5">
                {(scopeChanges || []).map((sc) => (
                  <ScopeChangeCard
                    key={sc.id}
                    sc={sc}
                    onWriteQuote={setQuoteTarget}
                    onMarkPaid={(id) => { markScopePaid.mutate(id); toast({ title: "Marked as paid" }); }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Deployments ── */}
          <TabsContent value="deployments" className="mt-0 p-3 sm:p-5">
            <SectionHeader title="Deployments" description="Build log output — connect a deployment integration to stream live logs." />
            <BuildLogsViewer />
          </TabsContent>

          {/* ── Settings ── */}
          <TabsContent value="settings" className="mt-0 p-3 sm:p-5">
            <div className="max-w-lg space-y-4">
              <h2 className="font-semibold text-sm">Project Settings</h2>

              {/* Project Info */}
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Project Info</p>
                  {!editingInfo && (
                    <Button variant="ghost" size="sm" className="gap-1 h-6 text-[10px] text-muted-foreground px-2"
                      onClick={() => { setEditName(project.name); setEditDescription(project.description || ""); setEditingInfo(true); }}
                      data-testid="button-edit-project-info"
                    >
                      <Edit2 className="h-2.5 w-2.5" /> Edit
                    </Button>
                  )}
                </div>
                {editingInfo ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs" htmlFor="edit-name">Name</Label>
                      <Input id="edit-name" className="h-8 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} data-testid="input-project-name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs" htmlFor="edit-desc">Description</Label>
                      <Textarea id="edit-desc" className="text-sm resize-none" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={500} rows={2} placeholder="Optional…" data-testid="input-project-description" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" disabled={!editName.trim() || updateProject.isPending}
                        data-testid="button-save-project-info"
                        onClick={async () => {
                          try {
                            await updateProject.mutateAsync({ id: project.id, data: { name: editName.trim(), description: editDescription.trim() || null } });
                            setEditingInfo(false);
                            toast({ title: "Project updated" });
                          } catch {
                            toast({ variant: "destructive", title: "Failed to update" });
                          }
                        }}
                      >
                        {updateProject.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingInfo(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Name</span>
                      <span className="font-medium text-right">{project.name}</span>
                    </div>
                    {project.description && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">Description</span>
                        <span className="text-right text-muted-foreground leading-relaxed">{project.description}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Project ID</span>
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{project.id.slice(0, 8)}…</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold">Project Status</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Manage the lifecycle state of this project.</p>
                </div>
                <Badge variant={STATUS_VARIANT[project.status] ?? "secondary"} className="gap-1 text-[10px] px-1.5 py-0.5">
                  <StatusIcon className="h-2.5 w-2.5" />
                  {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                </Badge>
                {project.status !== "COMPLETED" && (
                  <div className="flex flex-wrap gap-2">
                    {(STATUS_TRANSITIONS[project.status] || []).map((s) => (
                      <Button key={s} variant="outline" size="sm" className="gap-1 h-7 text-xs" disabled={statusUpdating} onClick={() => handleStatusChange(s as "ACTIVE" | "PAUSED" | "COMPLETED")}>
                        {statusUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : s === "ACTIVE" ? <CheckCircle className="h-3 w-3 text-green-500" /> : s === "PAUSED" ? <PauseCircle className="h-3 w-3 text-amber-500" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                        Mark {s.charAt(0) + s.slice(1).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                )}
                {project.status === "COMPLETED" && <p className="text-[10px] text-muted-foreground">Completed projects cannot change status.</p>}
              </div>

              {/* Client Access */}
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold">Client Access</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">People with access to this project's portal.</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 h-6 text-xs px-2 shrink-0"
                    onClick={() => setShowInviteModal(true)}
                    data-testid="button-invite-client-settings"
                  >
                    <Plus className="h-2.5 w-2.5" /> Invite
                  </Button>
                </div>
                {clientsLoading ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ) : !projectClients || projectClients.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-[10px] text-muted-foreground">No clients invited yet. Click Invite to send a magic link.</p>
                  </div>
                ) : (
                  <div className="divide-y rounded-md border overflow-hidden">
                    {projectClients.map((client) => (
                      <div key={client.id} className="flex items-center gap-2.5 px-3 py-2" data-testid={`client-row-${client.id}`}>
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground">
                          {(client.name || client.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          {client.name && <p className="text-xs font-medium truncate">{client.name}</p>}
                          <p className="text-[10px] text-muted-foreground truncate">{client.email}</p>
                        </div>
                        <Badge
                          variant={client.status === "ACTIVE" ? "success" : client.status === "EXPIRED" ? "secondary" : "warning"}
                          className="text-[10px] px-1.5 py-0.5 shrink-0"
                        >
                          {client.status === "ACTIVE" ? "Active" : client.status === "EXPIRED" ? "Expired" : "Pending"}
                        </Badge>
                        <button
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                          title="Revoke access"
                          data-testid={`button-revoke-client-${client.id}`}
                          disabled={revokeClient.isPending}
                          onClick={() => {
                            revokeClient.mutate({ projectId: id, clientId: client.id });
                            toast({ title: "Access revoked" });
                          }}
                        >
                          <UserMinus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GitHub */}
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold">GitHub Repository</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Connect a repository to enable AI report generation.</p>
                </div>
                {hasGitHub ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-muted/60 rounded px-2.5 py-2">
                      <Github className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs flex-1 truncate">{project.githubRepoFullName}</span>
                      <Badge variant="success" className="text-[10px] px-1.5 py-0.5 shrink-0">Connected</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive text-xs h-7"
                      onClick={async () => {
                        try { await disconnectRepo.mutateAsync(project.id); toast({ title: "Repository disconnected" }); }
                        catch { toast({ variant: "destructive", title: "Failed to disconnect" }); }
                      }}
                      disabled={disconnectRepo.isPending}
                    >
                      {disconnectRepo.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />} Disconnect
                    </Button>
                  </div>
                ) : showRepoPicker ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input className="pl-7 h-7 text-xs" placeholder="Search repositories…" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} />
                    </div>
                    {reposLoading && <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>}
                    {reposError && <p className="text-xs text-destructive">GitHub not connected. <GitHubConnectButton variant="link" className="h-auto p-0 text-xs underline" label="Connect first →" /></p>}
                    {!reposLoading && !reposError && githubRepos && (
                      <div className="max-h-44 overflow-y-auto rounded border divide-y">
                        {githubRepos.length === 0 && <p className="text-xs text-muted-foreground px-3 py-3 text-center">No repositories found</p>}
                        {githubRepos.map((repo) => (
                          <button key={repo.id} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                            onClick={async () => {
                              try { await connectRepo.mutateAsync({ projectId: project.id, repoFullName: repo.full_name }); setShowRepoPicker(false); setRepoSearch(""); toast({ title: "Repository connected" }); }
                              catch { toast({ variant: "destructive", title: "Failed to connect" }); }
                            }}
                            disabled={connectRepo.isPending}
                          >
                            <Github className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-mono flex-1 truncate">{repo.full_name}</span>
                            {repo.private && <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => { setShowRepoPicker(false); setRepoSearch(""); }}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setShowRepoPicker(true)}>
                    <Github className="h-3 w-3" /> Select Repository
                  </Button>
                )}
              </div>

              {/* Danger zone */}
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-2.5">
                <div>
                  <p className="text-xs font-semibold text-destructive">Danger Zone</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Deleting a project is permanent and cannot be undone.</p>
                </div>
                <Button variant="destructive" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-3 w-3" /> Delete Project
                </Button>
              </div>
            </div>
          </TabsContent>

        </div>
      </Tabs>

      {/* ── Dialogs ── */}

      <Dialog open={!!showReportViewer} onOpenChange={() => setShowReportViewer(null)}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogTitle className="sr-only">Report Viewer</DialogTitle>
          <DialogDescription className="sr-only">View and publish the AI-generated status report.</DialogDescription>
          {showReportViewer && <ReportViewerDialog reportId={showReportViewer} onClose={() => setShowReportViewer(null)} />}
        </DialogContent>
      </Dialog>

      <InvoiceForm open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} defaultProjectId={id} />

      <QuoteForm
        scopeChange={quoteTarget}
        onClose={() => setQuoteTarget(null)}
        onSubmit={async ({ id: scId, quoteDescription, quotePrice, quoteCurrency }) => {
          await submitQuote.mutateAsync({ id: scId, quoteDescription, quotePrice, quoteCurrency });
          setQuoteTarget(null);
          toast({ title: "Quote sent to client" });
        }}
      />

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive text-sm">Delete Project?</DialogTitle>
            <DialogDescription className="text-xs">This action is permanent and cannot be undone.</DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-1">
            This will permanently delete <strong>{project?.name}</strong> and all associated data.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteProject.isPending} onClick={handleDeleteProject}>
              {deleteProject.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Deleting…</> : <><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteModal} onOpenChange={(open) => { if (!open) { setShowInviteModal(false); setInviteEmail(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Invite Client</DialogTitle>
            <DialogDescription className="text-xs">Send a magic link to give someone access to this project's portal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="invite-email">Client Email</Label>
              <Input
                id="invite-email"
                type="email"
                className="h-8 text-sm"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="client@example.com"
                data-testid="input-invite-email"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inviteEmail && !inviteClient.isPending) {
                    inviteClient.mutate(
                      { projectId: id, email: inviteEmail },
                      {
                        onSuccess: () => { setInviteEmail(""); setShowInviteModal(false); toast({ title: "Invitation sent", description: `Magic link sent to ${inviteEmail}` }); },
                        onError: () => toast({ variant: "destructive", title: "Failed to send invitation" }),
                      }
                    );
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowInviteModal(false); setInviteEmail(""); }}>Cancel</Button>
            <Button
              size="sm"
              disabled={!inviteEmail || inviteClient.isPending}
              data-testid="button-send-invite"
              onClick={() => {
                inviteClient.mutate(
                  { projectId: id, email: inviteEmail },
                  {
                    onSuccess: () => { setInviteEmail(""); setShowInviteModal(false); toast({ title: "Invitation sent", description: `Magic link sent to ${inviteEmail}` }); },
                    onError: () => toast({ variant: "destructive", title: "Failed to send invitation" }),
                  }
                );
              }}
            >
              {inviteClient.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
