export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";
export type UploaderType = "DEVELOPER" | "CLIENT";
export type SenderType = "DEVELOPER" | "CLIENT";
export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED";
export type ReportStatus = "DRAFT" | "PUBLISHED";
export type InvoiceStatus = "UNPAID" | "PAID" | "OVERDUE";
export type ScopeChangeStatus = "PENDING" | "QUOTED" | "APPROVED" | "DECLINED" | "PAID";
export type Urgency = "LOW" | "MEDIUM" | "HIGH";

export interface ReportContent {
  summary: string | null;
  highlights: string[] | null;
  nextSteps: string[] | null;
  rawMarkdown: string;
  generationWarning: string | null;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  agencyName: string | null;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  customDomain: string | null;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  githubRepoId: number | null;
  githubRepoFullName: string | null;
  githubWebhookId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  workspaceId: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  status?: "PENDING" | "ACTIVE" | "EXPIRED";
}

export interface ReportMeta {
  id: string;
  projectId: string;
  weekStartDate: string;
  weekEndDate: string;
  title: string;
  status: ReportStatus;
  generatedAt: string;
  publishedAt: string | null;
  generatedBy: "SCHEDULED" | "MANUAL";
}

export interface Report extends ReportMeta {
  content: ReportContent;
}

export interface Invoice {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  amount: number;
  currency: Currency;
  status: InvoiceStatus;
  dueDate: string | null;
  paymentUrl: string;
  lsOrderId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScopeChange {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string;
  urgency: Urgency;
  status: ScopeChangeStatus;
  quoteDescription: string | null;
  quotePrice: number | null;
  quoteCurrency: Currency | null;
  paymentUrl: string | null;
  lsOrderId: string | null;
  submittedAt: string;
  quotedAt: string | null;
  respondedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderType: SenderType;
  senderName: string;
  body: string;
  readByDeveloperAt: string | null;
  readByClientAt: string | null;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  uploadedBy: string;
  uploaderType: UploaderType;
  uploaderName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  deletedAt: string | null;
  createdAt: string;
}

export interface OnboardingStatus {
  hasGitHubConnected: boolean;
  hasClientInvited: boolean;
  hasReportPublished: boolean;
  hasInvoiceCreated: boolean;
}

export interface PortalBranding {
  logoUrl: string | null;
  primaryColor: string;
  agencyName: string | null;
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  private: boolean;
  pushed_at: string;
}
