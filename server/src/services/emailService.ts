import { Resend } from "resend";

// Resend requires the sender to be a verified custom domain.
// Free email providers (Gmail, Yahoo, etc.) are rejected by Resend.
// Fall back to onboarding@resend.dev which works on all Resend accounts.
const FREE_PROVIDERS = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com"]);
function getFrom(): string {
  const configured = process.env.EMAIL_FROM;
  if (!configured) return "onboarding@resend.dev";
  const domain = configured.split("@")[1]?.toLowerCase() ?? "";
  if (FREE_PROVIDERS.has(domain)) {
    console.warn(
      `[emailService] EMAIL_FROM (${configured}) is a free-provider address. ` +
      `Resend requires a verified custom domain. Falling back to onboarding@resend.dev. ` +
      `To use a custom from-address, verify your domain at resend.com/domains.`
    );
    return "onboarding@resend.dev";
  }
  return configured;
}
const FROM = getFrom();

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[emailService] RESEND_API_KEY is not set — email sending is disabled");
    return null;
  }
  return new Resend(key);
}

async function safeSend(resend: Resend, payload: Parameters<Resend["emails"]["send"]>[0]): Promise<void> {
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    console.error("[emailService] Resend send error:", JSON.stringify(error));
    throw new Error(`Email delivery failed: ${error.message ?? JSON.stringify(error)}`);
  }
  console.log("[emailService] Email sent id=%s to=%s", data?.id, payload.to);
}

export async function sendMagicLink(opts: {
  to: string;
  clientName: string | null;
  magicLinkUrl: string;
  workspaceName: string;
  agencyName: string | null;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  const name = opts.clientName || "there";
  const sender = opts.agencyName || opts.workspaceName;
  await safeSend(resend, {
    from: FROM,
    to: opts.to,
    subject: `Your portal access link from ${sender}`,
    html: `
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
  const resend = getResend();
  if (!resend) return;
  const name = opts.clientName || "there";
  const sender = opts.agencyName || "Your developer";
  await safeSend(resend, {
    from: FROM,
    to: opts.to,
    subject: `New project update: ${opts.reportTitle}`,
    html: `
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
  const resend = getResend();
  if (!resend) return;
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
  await safeSend(resend, {
    from: FROM,
    to: opts.to,
    subject: subjectMap[opts.type],
    html: `
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
  const resend = getResend();
  if (!resend) return;
  await safeSend(resend, {
    from: FROM,
    to: opts.to,
    subject: `New message on ${opts.projectName}`,
    html: `
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
  const resend = getResend();
  if (!resend) return;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency,
  }).format(opts.amount);
  await safeSend(resend, {
    from: FROM,
    to: opts.to,
    subject: `Payment received: ${opts.invoiceTitle}`,
    html: `
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
  const resend = getResend();
  if (!resend) return;
  const sender = opts.agencyName || "Your developer";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency,
  }).format(opts.amount);
  await safeSend(resend, {
    from: FROM,
    to: opts.to,
    subject: `Invoice from ${sender}: ${opts.invoiceTitle}`,
    html: `
      <p>Hi ${opts.clientName || "there"},</p>
      <p>${sender} has sent you an invoice: <strong>${opts.invoiceTitle}</strong> for ${formatted}.</p>
      ${opts.paymentUrl ? `<p><a href="${opts.paymentUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Pay Now</a></p>` : ""}
    `,
  });
}
