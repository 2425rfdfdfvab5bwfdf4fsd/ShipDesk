import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, AlertTriangle, Github, Users, Mail, Plus, Trash2,
  CheckCircle, PauseCircle, XCircle, Loader2, Search, Unlink, Lock,
  FileText, Receipt, GitPullRequest, LayoutDashboard, BarChart2,
  FolderOpen, MessageSquare, ScrollText, ArrowRightLeft, Server, Settings2,
  Edit2, UserMinus, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
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
  { value: "overview",      label: "Overview",      icon: LayoutDashboard },
  { value: "reports",       label: "Reports",       icon: BarChart2 },
  { value: "files",         label: "Files",         icon: FolderOpen },
  { value: "messages",      label: "Messages",      icon: MessageSquare },
  { value: "invoices",      label: "Invoices",      icon: ScrollText },
  { value: "scope-changes", label: "Scope Changes", icon: ArrowRightLeft },
  { value: "deployments",   label: "Deployments",   icon: Server },
  { value: "settings",      label: "Settings",      icon: Settings2 },
];

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="font-semibold text-base leading-tight">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
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

  const { data: project, isLoading } = useProject(id);
  const { data: reportsData, isLoading: reportsLoading } = useReports(id);
  const { data: invoicesData } = useInvoices(id);
  const { data: scopeChanges } = useScopeChanges(id);
  const { data: messagesData } = useMessages(id);
  const { data: files } = useFiles(id);
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
      <div className="p-6 space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-56" />
        <div className="flex gap-2 mt-1"><Skeleton className="h-7 w-28" /><Skeleton className="h-7 w-20" /></div>
        <Skeleton className="h-10 w-full mt-2" />
        <div className="grid grid-cols-3 gap-4 mt-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="font-medium">Project not found</p>
        <p className="text-sm text-muted-foreground mt-1">This project may have been deleted.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
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
      {/*
       * Tabs wraps both the sticky header (with TabsList) and all TabsContent.
       * The sticky div only contains back-nav + title row + TabsList — never any TabsContent.
       */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => { setActiveTab(v); if (v === "messages") markRead.mutate(id); }}
        className="flex flex-col flex-1"
      >
        {/* ── Sticky header ── */}
        <div className="border-b bg-card sticky top-0 z-10">
          <div className="px-4 sm:px-6 pt-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </button>

            <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight break-words">
                    {project.name}
                  </h1>
                  <Badge variant={STATUS_VARIANT[project.status] ?? "secondary"} className="gap-1 shrink-0">
                    <StatusIcon className="h-3 w-3" />
                    {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed">{project.description}</p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowInviteModal(true)} data-testid="button-invite-client">
                  <Users className="h-3.5 w-3.5" /> Invite Client
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowInvoiceModal(true)} data-testid="button-new-invoice">
                  <Plus className="h-3.5 w-3.5" /> Invoice
                </Button>
                <GenerateReportButton projectId={id} hasGitHub={hasGitHub} size="sm" />
              </div>
            </div>
          </div>

          {/* Tab bar — scrollable on mobile, no visible scrollbar */}
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 sm:px-6">
            <TabsList className="bg-transparent border-none rounded-none h-auto p-0 gap-0 w-max">
              {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5 hidden sm:block" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* ── Tab content (scrollable) ── */}
        <div className="flex-1 overflow-auto">

          {/* Overview */}
          <TabsContent value="overview" className="mt-0 p-4 sm:p-6 space-y-5">

            {/* Stat cards — 4-up grid, each navigates to its tab */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                className="bg-card border rounded-xl p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left w-full"
                onClick={() => setActiveTab("reports")}
                data-testid="stat-card-reports"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Reports</p>
                  <p className="text-2xl font-bold leading-tight">{reports.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{publishedReports} published</p>
                </div>
              </button>

              <button
                className="bg-card border rounded-xl p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left w-full"
                onClick={() => setActiveTab("invoices")}
                data-testid="stat-card-invoices"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                  <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Invoices</p>
                  <p className="text-2xl font-bold leading-tight">{unpaidInvoices}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{invoices.length} total</p>
                </div>
              </button>

              <button
                className="bg-card border rounded-xl p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left w-full"
                onClick={() => setActiveTab("scope-changes")}
                data-testid="stat-card-scope-changes"
              >
                <div className="h-9 w-9 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                  <GitPullRequest className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Scope Changes</p>
                  <p className="text-2xl font-bold leading-tight">{(scopeChanges || []).length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pendingScopes} pending</p>
                </div>
              </button>

              <button
                className="bg-card border rounded-xl p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left w-full"
                onClick={() => { setActiveTab("messages"); markRead.mutate(id); }}
                data-testid="stat-card-messages"
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${unreadMessages > 0 ? "bg-violet-50 dark:bg-violet-950/40" : "bg-muted/50"}`}>
                  <MessageSquare className={`h-4 w-4 ${unreadMessages > 0 ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Messages</p>
                  <p className="text-2xl font-bold leading-tight">
                    {unreadMessages > 0 ? unreadMessages : messages.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {unreadMessages > 0 ? "unread" : `${messages.length} total`}
                  </p>
                </div>
              </button>
            </div>

            {/* GitHub status */}
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Github className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">GitHub</p>
              </div>
              {githubStatusLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-7 w-48 rounded-md bg-muted animate-pulse" />
                </div>
              ) : hasGitHub ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm bg-muted px-2.5 py-1 rounded-md">{project.githubRepoFullName}</span>
                  <Badge variant="success" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> Connected</Badge>
                </div>
              ) : githubStatus?.connected ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="warning" className="gap-1"><AlertTriangle className="h-3 w-3" /> No repository linked</Badge>
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => { setActiveTab("settings"); setShowRepoPicker(true); }} data-testid="button-link-repo">
                    <Github className="h-3 w-3" /> Link Repository
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="warning" className="gap-1"><AlertTriangle className="h-3 w-3" /> GitHub not connected</Badge>
                  <GitHubConnectButton className="gap-1.5 h-7 text-xs" label="Connect GitHub" />
                </div>
              )}
            </div>

            {/* Latest report — or first-report CTA when GitHub is connected */}
            {reports.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Latest Report</p>
                  <button className="text-xs text-primary hover:underline" onClick={() => setActiveTab("reports")}>View all →</button>
                </div>
                <ReportCard report={reports[0]} onClick={() => setShowReportViewer(reports[0].id)} />
              </div>
            ) : hasGitHub ? (
              <div className="bg-card border rounded-xl p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Generate your first report</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Summarise this week's GitHub activity into a polished client update.</p>
                </div>
                <GenerateReportButton projectId={id} hasGitHub={true} size="sm" variant="outline" />
              </div>
            ) : null}

          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="mt-0 p-4 sm:p-6">
            <SectionHeader
              title="Reports"
              description="AI-generated weekly status updates for your client."
              action={<GenerateReportButton projectId={id} hasGitHub={hasGitHub} size="sm" variant="outline" />}
            />
            {reportsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[88px] rounded-lg" />)}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <BarChart2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No reports yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {hasGitHub
                      ? "Generate your first report to share progress with your client."
                      : "Connect a GitHub repository to start generating AI reports."}
                  </p>
                </div>
                {hasGitHub && <GenerateReportButton projectId={id} hasGitHub={true} size="sm" />}
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="group">
                    <ReportCard report={r} onClick={() => setShowReportViewer(r.id)} />
                    {r.status === "DRAFT" && (
                      <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="h-7 px-2.5 rounded-md text-xs flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          data-testid={`button-publish-report-${r.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateReport.mutate({ id: r.id, data: { status: "PUBLISHED" } });
                            toast({ title: "Report published to client" });
                          }}
                        >
                          <CheckCircle className="h-3 w-3" /> Publish
                        </button>
                        <button
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete draft"
                          data-testid={`button-delete-report-${r.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReport.mutate(r.id);
                            toast({ title: "Draft deleted" });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="mt-0 p-4 sm:p-6">
            <FileList
              files={files || []}
              onUpload={handleUploadFile}
              onDelete={(fileId) => deleteFile.mutate({ projectId: id, fileId })}
              uploading={createFile.isPending}
            />
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="mt-0">
            <div className="h-[calc(100vh-220px)] min-h-[400px] flex flex-col">
              <MessageThread
                messages={messages}
                currentSenderType="DEVELOPER"
                onSend={(body) => sendMessage.mutate({ projectId: id, body })}
                isSending={sendMessage.isPending}
              />
            </div>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="mt-0 p-4 sm:p-6">
            <SectionHeader
              title="Invoices"
              description="Track payments and outstanding balances."
              action={<Button size="sm" className="gap-1.5" onClick={() => setShowInvoiceModal(true)}><Plus className="h-4 w-4" /> New Invoice</Button>}
            />
            {invoices.length === 0 ? (
              <EmptyState icon={ScrollText} title="No invoices yet" description="Create your first invoice to send to your client." />
            ) : (
              <div className="space-y-3">
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

          {/* Scope Changes */}
          <TabsContent value="scope-changes" className="mt-0 p-4 sm:p-6">
            <SectionHeader title="Scope Changes" description="Client-submitted requests for additional work." />
            {(scopeChanges || []).length === 0 ? (
              <EmptyState icon={ArrowRightLeft} title="No scope change requests" description="When clients request additional work through their portal, it will appear here." />
            ) : (
              <div className="space-y-3">
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

          {/* Deployments */}
          <TabsContent value="deployments" className="mt-0 p-4 sm:p-6">
            <SectionHeader title="Deployments" description="Sample build log output — connect a deployment integration to stream live logs." />
            <BuildLogsViewer />
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="mt-0 p-4 sm:p-6">
            <div className="max-w-xl space-y-5">
              <h2 className="font-semibold text-base">Project Settings</h2>

              {/* Project Info — editable */}
              <div className="bg-card border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Project Info</p>
                  {!editingInfo && (
                    <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs text-muted-foreground"
                      onClick={() => { setEditName(project.name); setEditDescription(project.description || ""); setEditingInfo(true); }}
                      data-testid="button-edit-project-info"
                    >
                      <Edit2 className="h-3 w-3" /> Edit
                    </Button>
                  )}
                </div>
                {editingInfo ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-name">Project Name</Label>
                      <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} data-testid="input-project-name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-desc">Description</Label>
                      <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={500} rows={3} className="resize-none" placeholder="Optional project description…" data-testid="input-project-description" />
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
                            toast({ variant: "destructive", title: "Failed to update project" });
                          }
                        }}
                      >
                        {updateProject.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingInfo(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Name</span>
                      <span className="font-medium text-right">{project.name}</span>
                    </div>
                    {project.description && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">Description</span>
                        <span className="text-right text-xs leading-relaxed">{project.description}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Project ID</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{project.id.slice(0, 8)}…</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-xs">{formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="bg-card border rounded-xl p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold">Project Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage the lifecycle state of this project.</p>
                </div>
                <Badge variant={STATUS_VARIANT[project.status] ?? "secondary"} className="gap-1 text-xs px-2.5 py-1">
                  <StatusIcon className="h-3 w-3" />
                  {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                </Badge>
                {project.status !== "COMPLETED" && (
                  <div className="flex flex-wrap gap-2">
                    {(STATUS_TRANSITIONS[project.status] || []).map((s) => (
                      <Button key={s} variant="outline" size="sm" className="gap-1.5 h-8 text-xs" disabled={statusUpdating} onClick={() => handleStatusChange(s as "ACTIVE" | "PAUSED" | "COMPLETED")}>
                        {statusUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : s === "ACTIVE" ? <CheckCircle className="h-3 w-3 text-green-500" /> : s === "PAUSED" ? <PauseCircle className="h-3 w-3 text-amber-500" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                        Mark as {s.charAt(0) + s.slice(1).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                )}
                {project.status === "COMPLETED" && <p className="text-xs text-muted-foreground">Completed projects cannot change status.</p>}
              </div>

              {/* Client Access */}
              <div className="bg-card border rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Client Access</p>
                    <p className="text-xs text-muted-foreground mt-0.5">People with access to this project's portal.</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs shrink-0"
                    onClick={() => setShowInviteModal(true)}
                    data-testid="button-invite-client-settings"
                  >
                    <Plus className="h-3 w-3" /> Invite
                  </Button>
                </div>
                {clientsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !projectClients || projectClients.length === 0 ? (
                  <div className="flex items-center gap-2.5 rounded-lg border border-dashed px-4 py-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">No clients invited yet. Click Invite to send a magic link.</p>
                  </div>
                ) : (
                  <div className="divide-y rounded-lg border overflow-hidden">
                    {projectClients.map((client) => (
                      <div key={client.id} className="flex items-center gap-3 px-3 py-2.5" data-testid={`client-row-${client.id}`}>
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                          {(client.name || client.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          {client.name && <p className="text-sm font-medium truncate">{client.name}</p>}
                          <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                        </div>
                        <Badge
                          variant={client.status === "ACTIVE" ? "success" : client.status === "EXPIRED" ? "secondary" : "warning"}
                          className="text-xs shrink-0"
                        >
                          {client.status === "ACTIVE" ? "Active" : client.status === "EXPIRED" ? "Expired" : "Pending"}
                        </Badge>
                        <button
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                          title="Revoke access"
                          data-testid={`button-revoke-client-${client.id}`}
                          disabled={revokeClient.isPending}
                          onClick={() => {
                            revokeClient.mutate({ projectId: id, clientId: client.id });
                            toast({ title: "Access revoked" });
                          }}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GitHub */}
              <div className="bg-card border rounded-xl p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold">GitHub Repository</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Connect a repository to enable AI report generation.</p>
                </div>
                {hasGitHub ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 bg-muted/60 rounded-lg px-3 py-2.5">
                      <Github className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-mono text-sm flex-1 truncate">{project.githubRepoFullName}</span>
                      <Badge variant="success" className="text-xs shrink-0">Connected</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive text-xs h-7"
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
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input className="pl-8 h-8 text-sm" placeholder="Search repositories…" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} />
                    </div>
                    {reposLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground py-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading repositories…</div>}
                    {reposError && <p className="text-xs text-destructive">GitHub not connected. <GitHubConnectButton variant="link" className="h-auto p-0 text-xs underline" label="Connect GitHub first →" /></p>}
                    {!reposLoading && !reposError && githubRepos && (
                      <div className="max-h-52 overflow-y-auto rounded-lg border divide-y">
                        {githubRepos.length === 0 && <p className="text-xs text-muted-foreground px-3 py-4 text-center">No repositories found</p>}
                        {githubRepos.map((repo) => (
                          <button key={repo.id} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
                            onClick={async () => {
                              try { await connectRepo.mutateAsync({ projectId: project.id, repoFullName: repo.full_name }); setShowRepoPicker(false); setRepoSearch(""); toast({ title: "Repository connected" }); }
                              catch { toast({ variant: "destructive", title: "Failed to connect repository" }); }
                            }}
                            disabled={connectRepo.isPending}
                          >
                            <Github className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-mono flex-1 truncate">{repo.full_name}</span>
                            {repo.private && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => { setShowRepoPicker(false); setRepoSearch(""); }}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowRepoPicker(true)}>
                    <Github className="h-4 w-4" /> Select Repository
                  </Button>
                )}
              </div>

              {/* Danger zone */}
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-destructive">Danger Zone</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Deleting a project is permanent and cannot be undone.</p>
                </div>
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete Project
                </Button>
              </div>
            </div>
          </TabsContent>

        </div>{/* end scrollable content */}
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
            <DialogTitle className="text-destructive">Delete Project?</DialogTitle>
            <DialogDescription>This action is permanent and cannot be undone.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently delete <strong>{project?.name}</strong> and all associated data including reports, invoices, and messages.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteProject.isPending} onClick={handleDeleteProject}>
              {deleteProject.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting…</> : <><Trash2 className="h-4 w-4 mr-2" />Delete Project</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteModal} onOpenChange={(open) => { if (!open) { setShowInviteModal(false); setInviteEmail(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Client</DialogTitle>
            <DialogDescription>Send a magic link to give someone access to this project's client portal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Client Email *</Label>
              <Input
                id="invite-email"
                type="email"
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
            <Button variant="outline" onClick={() => { setShowInviteModal(false); setInviteEmail(""); }}>Cancel</Button>
            <Button
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
              {inviteClient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
