import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "noreply@shipdesk.io";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set — email sending is disabled");
  }
  return new Resend(key);
}

export async function sendMagicLink(opts: {
  to: string;
  clientName: string | null;
  magicLinkUrl: string;
  workspaceName: string;
  agencyName: string | null;
}): Promise<void> {
  const name = opts.clientName || "there";
  const sender = opts.agencyName || opts.workspaceName;
  await getResend().emails.send({
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
  const name = opts.clientName || "there";
  const sender = opts.agencyName || "Your developer";
  await getResend().emails.send({
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
  await getResend().emails.send({
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
  await getResend().emails.send({
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

export async function sendInvoiceNotification(opts: {
  to: string;
  clientName: string | null;
  invoiceTitle: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  agencyName: string | null;
}): Promise<void> {
  const sender = opts.agencyName || "Your developer";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency,
  }).format(opts.amount);
  await getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `Invoice from ${sender}: ${opts.invoiceTitle}`,
    html: `
      <p>Hi ${opts.clientName || "there"},</p>
      <p>${sender} has sent you an invoice: <strong>${opts.invoiceTitle}</strong> for ${formatted}.</p>
      <p><a href="${opts.paymentUrl}" style="background:#6366F1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Pay Now</a></p>
    `,
  });
}
