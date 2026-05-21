import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, AlertTriangle, Github, Users, Mail, Plus, Send, Trash2, CheckCircle, PauseCircle, XCircle, Loader2, Search, Unlink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useProject, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useGitHubRepos, useConnectRepo, useDisconnectRepo } from "@/hooks/useGitHub";
import { useReport, useReports, useUpdateReport } from "@/hooks/useReports";
import { useInvoices, useMarkInvoicePaid, useDeleteInvoice } from "@/hooks/useInvoices";
import { useScopeChanges, useSubmitQuote, useMarkScopeChangePaid } from "@/hooks/useScopeChanges";
import { useMessages, useSendMessage, useMarkMessagesRead } from "@/hooks/useMessages";
import { useFiles, useCreateFile, useDeleteFile, useUploadSignature } from "@/hooks/useFiles";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { ScopeChange } from "@/types";

function ReportViewerDialog({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const { data: report, isLoading } = useReport(reportId);
  const updateReport = useUpdateReport();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!report) return null;

  return (
    <ReportViewer
      report={report}
      canEdit
      onPublish={(id) => {
        updateReport.mutate({ id, data: { status: "PUBLISHED" } });
        onClose();
        toast({ title: "Report published to client" });
      }}
      onEdit={(id, content) => {
        updateReport.mutate({ id, data: { content: { rawMarkdown: content } } });
        toast({ title: "Report saved" });
      }}
      isPublishing={updateReport.isPending}
    />
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

  const { data: project, isLoading } = useProject(id);
  const { data: reportsData } = useReports(id);
  const { data: invoicesData } = useInvoices(id);
  const { data: scopeChanges } = useScopeChanges(id);
  const { data: messagesData } = useMessages(id);
  const { data: files } = useFiles(id);
  const { data: uploadSig } = useUploadSignature(id);

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");

  const { data: githubRepos, isLoading: reposLoading, error: reposError } = useGitHubRepos(
    repoSearch || undefined,
    showRepoPicker
  );
  const connectRepo = useConnectRepo();
  const disconnectRepo = useDisconnectRepo();

  const STATUS_TRANSITIONS: Record<string, string[]> = {
    ACTIVE: ["PAUSED", "COMPLETED"],
    PAUSED: ["ACTIVE", "COMPLETED"],
    COMPLETED: [],
  };

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

  const reports = reportsData?.reports || [];
  const invoices = invoicesData?.invoices || [];
  const messages = messagesData?.messages || [];

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
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${uploadSig.cloudName}/raw/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json() as {
        secure_url: string; public_id: string; bytes: number; format: string;
      };
      await createFile.mutateAsync({
        projectId: id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        cloudinaryPublicId: data.public_id,
        cloudinarySecureUrl: data.secure_url,
      });
      toast({ title: "File uploaded" });
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const hasGitHub = !!project.githubRepoFullName;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{project.name}</h1>
            <Badge
              variant={
                project.status === "ACTIVE" ? "success" :
                project.status === "PAUSED" ? "warning" : "secondary"
              }
            >
              {project.status}
            </Badge>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowInviteModal(true)}>
              <Users className="h-4 w-4" /> Invite Client
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowInvoiceModal(true)}>
              <Plus className="h-4 w-4" /> Invoice
            </Button>
            <GenerateReportButton projectId={id} hasGitHub={hasGitHub} size="sm" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-card px-6 overflow-x-auto">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            if (v === "messages") markRead.mutate(id);
          }}
        >
          <TabsList className="bg-transparent border-none rounded-none h-auto p-0 gap-0">
            {["overview", "reports", "files", "messages", "invoices", "scope-changes", "settings"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none capitalize px-4 py-3 text-sm"
              >
                {tab === "scope-changes" ? "Scope Changes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="px-0 py-0 mt-0">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Reports</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reports.filter((r) => r.status === "PUBLISHED").length} published
                  </p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
                  <p className="text-2xl font-bold">{invoices.filter((i) => i.status !== "PAID").length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">of {invoices.length} total</p>
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Scope Changes</p>
                  <p className="text-2xl font-bold">{(scopeChanges || []).length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(scopeChanges || []).filter((s) => s.status === "PENDING").length} pending
                  </p>
                </div>
              </div>

              {project.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">GitHub</p>
                {hasGitHub ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{project.githubRepoFullName}</span>
                    <Badge variant="success" className="text-xs">Connected</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Badge variant="warning" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      No GitHub connected
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" asChild>
                      <a href="/api/github/connect"><Github className="h-3 w-3" /> Connect</a>
                    </Button>
                  </div>
                )}
              </div>

              {reports.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Latest Report</p>
                  <ReportCard report={reports[0]} onClick={() => setShowReportViewer(reports[0].id)} />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="px-0 py-0 mt-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Reports</h2>
                <GenerateReportButton projectId={id} hasGitHub={hasGitHub} size="sm" variant="outline" />
              </div>
              {reports.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  <p>No reports yet.</p>
                  {!hasGitHub && (
                    <p className="mt-2 text-xs">Connect a GitHub repository to start generating reports.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <ReportCard key={r.id} report={r} onClick={() => setShowReportViewer(r.id)} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="px-0 py-0 mt-0">
            <div className="p-6">
              <FileList
                files={files || []}
                onUpload={handleUploadFile}
                onDelete={(fileId) => deleteFile.mutate({ projectId: id, fileId })}
                uploading={createFile.isPending}
              />
            </div>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="px-0 py-0 mt-0">
            <div className="h-[600px] flex flex-col">
              <MessageThread
                messages={messages}
                currentSenderType="DEVELOPER"
                onSend={(body) => sendMessage.mutate({ projectId: id, body })}
                isSending={sendMessage.isPending}
              />
            </div>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="px-0 py-0 mt-0">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Invoices</h2>
                <Button size="sm" className="gap-1.5" onClick={() => setShowInvoiceModal(true)}>
                  <Plus className="h-4 w-4" /> New Invoice
                </Button>
              </div>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No invoices yet.</div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <InvoiceCard
                      key={inv.id}
                      invoice={inv}
                      onMarkPaid={(id) => {
                        markInvoicePaid.mutate(id);
                        toast({ title: "Marked as paid" });
                      }}
                      onDelete={(id) => {
                        deleteInvoice.mutate(id);
                        toast({ title: "Invoice deleted" });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Scope Changes */}
          <TabsContent value="scope-changes" className="px-0 py-0 mt-0">
            <div className="p-6">
              <h2 className="font-semibold mb-4">Scope Changes</h2>
              {(scopeChanges || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No scope change requests from clients yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {(scopeChanges || []).map((sc) => (
                    <ScopeChangeCard
                      key={sc.id}
                      sc={sc}
                      onWriteQuote={setQuoteTarget}
                      onMarkPaid={(id) => {
                        markScopePaid.mutate(id);
                        toast({ title: "Marked as paid" });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="px-0 py-0 mt-0">
            <div className="p-6 max-w-xl space-y-6">
              <h2 className="font-semibold text-base">Project Settings</h2>

              {/* Status */}
              <div className="bg-card border rounded-xl p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-0.5">Project Status</p>
                  <p className="text-xs text-muted-foreground">
                    Manage the lifecycle state of this project.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={project.status === "ACTIVE" ? "success" : project.status === "PAUSED" ? "warning" : "secondary"}
                    className="text-xs px-2.5 py-1"
                  >
                    Current: {project.status}
                  </Badge>
                </div>
                {project.status !== "COMPLETED" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(STATUS_TRANSITIONS[project.status] || []).map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8 text-xs"
                        disabled={statusUpdating}
                        onClick={() => handleStatusChange(s as "ACTIVE" | "PAUSED" | "COMPLETED")}
                      >
                        {statusUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : s === "ACTIVE" ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : s === "PAUSED" ? (
                          <PauseCircle className="h-3 w-3 text-amber-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                        )}
                        Mark as {s.charAt(0) + s.slice(1).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                )}
                {project.status === "COMPLETED" && (
                  <p className="text-xs text-muted-foreground">Completed projects cannot change status.</p>
                )}
              </div>

              {/* GitHub */}
              <div className="bg-card border rounded-xl p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-0.5">GitHub Repository</p>
                  <p className="text-xs text-muted-foreground">
                    Connect a repository to enable AI report generation.
                  </p>
                </div>
                {hasGitHub ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 bg-muted/60 rounded-lg px-3 py-2.5">
                      <Github className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono text-sm flex-1 truncate">{project.githubRepoFullName}</span>
                      <Badge variant="success" className="text-xs">Connected</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-destructive text-xs h-7"
                      onClick={async () => {
                        try {
                          await disconnectRepo.mutateAsync(project.id);
                          toast({ title: "Repository disconnected" });
                        } catch {
                          toast({ variant: "destructive", title: "Failed to disconnect" });
                        }
                      }}
                      disabled={disconnectRepo.isPending}
                    >
                      {disconnectRepo.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                      Disconnect
                    </Button>
                  </div>
                ) : showRepoPicker ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        className="pl-8 h-8 text-sm"
                        placeholder="Search repositories…"
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                      />
                    </div>
                    {reposLoading && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading repositories…
                      </div>
                    )}
                    {reposError && (
                      <p className="text-xs text-destructive">
                        GitHub not connected.{" "}
                        <a href="/api/github/connect" className="underline">Connect GitHub first →</a>
                      </p>
                    )}
                    {!reposLoading && !reposError && githubRepos && (
                      <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                        {githubRepos.length === 0 && (
                          <p className="text-xs text-muted-foreground px-3 py-4 text-center">No repositories found</p>
                        )}
                        {githubRepos.map((repo) => (
                          <button
                            key={repo.id}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
                            onClick={async () => {
                              try {
                                await connectRepo.mutateAsync({ projectId: project.id, repoFullName: repo.full_name });
                                setShowRepoPicker(false);
                                setRepoSearch("");
                                toast({ title: "Repository connected" });
                              } catch {
                                toast({ variant: "destructive", title: "Failed to connect repository" });
                              }
                            }}
                            disabled={connectRepo.isPending}
                          >
                            <Github className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-mono flex-1 truncate">{repo.full_name}</span>
                            {repo.private && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-muted-foreground"
                      onClick={() => { setShowRepoPicker(false); setRepoSearch(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setShowRepoPicker(true)}
                  >
                    <Github className="h-4 w-4" /> Select Repository
                  </Button>
                )}
              </div>

              {/* Meta */}
              <div className="bg-card border rounded-xl p-5 space-y-3">
                <p className="text-sm font-semibold">Project Info</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Project ID</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{project.id.slice(0, 8)}…</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-xs">{formatDate(project.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-destructive">Danger Zone</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Deleting a project is permanent and cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Project
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Viewer Dialog */}
      <Dialog open={!!showReportViewer} onOpenChange={() => setShowReportViewer(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {showReportViewer && (
            <ReportViewerDialog
              reportId={showReportViewer}
              onClose={() => setShowReportViewer(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Form */}
      <InvoiceForm
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        defaultProjectId={id}
      />

      {/* Quote Form */}
      <QuoteForm
        scopeChange={quoteTarget}
        onClose={() => setQuoteTarget(null)}
        onSubmit={async ({ id: scId, quoteDescription, quotePrice, quoteCurrency }) => {
          await submitQuote.mutateAsync({ id: scId, quoteDescription, quotePrice, quoteCurrency });
          setQuoteTarget(null);
          toast({ title: "Quote sent to client" });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Project?</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              This will permanently delete <strong>{project?.name}</strong> and all associated data including reports, invoices, and messages. This cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteProject.isPending}
              onClick={handleDeleteProject}
            >
              {deleteProject.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting…</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Delete Project</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Client Dialog */}
      <Dialog open={showInviteModal} onOpenChange={() => setShowInviteModal(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client Email *</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="client@example.com"
                onKeyDown={(e) => e.key === "Enter" && inviteEmail && (
                  api.post(`/api/projects/${id}/invite`, { email: inviteEmail })
                    .then(() => { setInviteEmail(""); setShowInviteModal(false); toast({ title: "Invitation sent" }); })
                    .catch(() => toast({ variant: "destructive", title: "Failed to send invitation" }))
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A magic link will be emailed to this address granting access to the client portal for this project.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button
              disabled={!inviteEmail}
              onClick={async () => {
                try {
                  await api.post(`/api/projects/${id}/invite`, { email: inviteEmail });
                  setInviteEmail("");
                  setShowInviteModal(false);
                  toast({ title: "Invitation sent", description: `Magic link sent to ${inviteEmail}` });
                } catch {
                  toast({ variant: "destructive", title: "Failed to send invitation" });
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" /> Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
