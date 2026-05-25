import { BrevoClient } from "@getbrevo/brevo";

function getClient(): BrevoClient | null {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn("[emailService] BREVO_API_KEY is not set — email sending is disabled");
    return null;
  }
  return new BrevoClient({ apiKey: key });
}

function getFrom(): { name: string; email: string } {
  const raw = process.env.EMAIL_FROM ?? "ShipDesk <noreply@shipdesk.io>";
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "ShipDesk", email: raw.trim() };
}

async function safeSend(
  client: BrevoClient,
  payload: Parameters<BrevoClient["transactionalEmails"]["sendTransacEmail"]>[0]
): Promise<void> {
  const result = await client.transactionalEmails.sendTransacEmail(payload);
  console.log("[emailService] Email sent messageId=%s", (result as any)?.messageId);
}

export async function sendMagicLink(opts: {
  to: string;
  clientName: string | null;
  magicLinkUrl: string;
  workspaceName: string;
  agencyName: string | null;
}): Promise<void> {
  const client = getClient();
  if (!client) return;
  const from = getFrom();
  const name = opts.clientName || "there";
  const sender = opts.agencyName || opts.workspaceName;
  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.clientName ?? undefined }],
    subject: `Your portal access link from ${sender}`,
    htmlContent: `
      <p>Hi ${name},</p>
      <p>${sender} has invited you to access your project portal on ShipDesk.</p>
      <p><a href="${opts.magicLinkUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Access Your Portal</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });
}

export async function sendReportPublished(opts: {
  to: string;
  clientName: string | null;
  reportTitle: string;
  reportSummary: string | null;
  portalUrl: string;
  agencyName: string | null;
}): Promise<void> {
  const client = getClient();
  if (!client) return;
  const from = getFrom();
  const name = opts.clientName || "there";
  const sender = opts.agencyName || "Your developer";
  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.clientName ?? undefined }],
    subject: `New project update: ${opts.reportTitle}`,
    htmlContent: `
      <p>Hi ${name},</p>
      <p>${sender} has published a new project status update.</p>
      ${opts.reportSummary ? `<p><strong>Summary:</strong> ${opts.reportSummary}</p>` : ""}
      <p><a href="${opts.portalUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Full Report</a></p>
    `,
  });
}

export async function sendScopeChangeNotification(opts: {
  to: string;
  recipientName: string | null;
  projectName: string;
  scopeChangeTitle: string;
  portalUrl: string;
  type: "new_request" | "quote_sent" | "approved" | "declined";
}): Promise<void> {
  const client = getClient();
  if (!client) return;
  const from = getFrom();
  const subjectMap = {
    new_request: `New scope change request: ${opts.scopeChangeTitle}`,
    quote_sent: `Quote ready for your review: ${opts.scopeChangeTitle}`,
    approved: `Scope change approved: ${opts.scopeChangeTitle}`,
    declined: `Scope change declined: ${opts.scopeChangeTitle}`,
  };
  const bodyMap = {
    new_request: `A new scope change request has been submitted for ${opts.projectName}.`,
    quote_sent: `A quote has been sent for your scope change request on ${opts.projectName}.`,
    approved: `The scope change request for ${opts.projectName} has been approved.`,
    declined: `The scope change request for ${opts.projectName} has been declined.`,
  };
  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.recipientName ?? undefined }],
    subject: subjectMap[opts.type],
    htmlContent: `
      <p>Hi ${opts.recipientName || "there"},</p>
      <p>${bodyMap[opts.type]}</p>
      <p><a href="${opts.portalUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Details</a></p>
    `,
  });
}

export async function sendMessageNotification(opts: {
  to: string;
  recipientName: string | null;
  projectName: string;
  senderName: string;
  portalUrl: string;
}): Promise<void> {
  const client = getClient();
  if (!client) return;
  const from = getFrom();
  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.recipientName ?? undefined }],
    subject: `New message on ${opts.projectName}`,
    htmlContent: `
      <p>Hi ${opts.recipientName || "there"},</p>
      <p>${opts.senderName} sent you a message on the ${opts.projectName} project.</p>
      <p><a href="${opts.portalUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Message</a></p>
    `,
  });
}

export async function sendPaymentConfirmedNotification(opts: {
  to: string;
  developerName: string | null;
  invoiceTitle: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const client = getClient();
  if (!client) return;
  const from = getFrom();
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency,
  }).format(opts.amount);
  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.developerName ?? undefined }],
    subject: `Payment received: ${opts.invoiceTitle}`,
    htmlContent: `
      <p>Hi ${opts.developerName || "there"},</p>
      <p>Great news — payment of <strong>${formatted}</strong> has been confirmed for invoice: <strong>${opts.invoiceTitle}</strong>.</p>
      <p>The invoice status has been automatically updated to Paid.</p>
    `,
  });
}

export async function sendInvoiceNotification(opts: {
  to: string;
  clientName: string | null;
  invoiceTitle: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  agencyName: string | null;
}): Promise<void> {
  const client = getClient();
  if (!client) return;
  const from = getFrom();
  const sender = opts.agencyName || "Your developer";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency,
  }).format(opts.amount);
  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.clientName ?? undefined }],
    subject: `Invoice from ${sender}: ${opts.invoiceTitle}`,
    htmlContent: `
      <p>Hi ${opts.clientName || "there"},</p>
      <p>${sender} has sent you an invoice: <strong>${opts.invoiceTitle}</strong> for ${formatted}.</p>
      ${opts.paymentUrl ? `<p><a href="${opts.paymentUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Pay Now</a></p>` : ""}
    `,
  });
}

export async function sendTeamInvite(opts: {
  to: string;
  inviterName: string;
  workspaceName: string;
  agencyName: string | null;
  joinUrl: string;
}): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log(`[emailService] Team invite would be sent to ${opts.to} — joinUrl: ${opts.joinUrl}`);
    return;
  }
  const from = getFrom();
  const workspace = opts.agencyName || opts.workspaceName;
  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to }],
    subject: `${opts.inviterName} invited you to join ${workspace} on ShipDesk`,
    htmlContent: `
      <p>Hi there,</p>
      <p><strong>${opts.inviterName}</strong> has invited you to join the <strong>${workspace}</strong> workspace on ShipDesk.</p>
      <p><a href="${opts.joinUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Accept Invitation</a></p>
      <p style="color:#6b7280;font-size:13px;">This link expires in 7 days. If you don't have a ShipDesk account, you'll be prompted to create one.</p>
    `,
  });
}
