import { BrevoClient } from "@getbrevo/brevo";

function getClient(): BrevoClient | null {
  const key = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[emailService] BREVO_API_KEY/RESEND_API_KEY is not set — email sending is disabled");
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

function emailLayout(opts: {
  previewText: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${opts.previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    * { box-sizing: border-box; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${opts.previewText}&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Email card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#1e1b4b;border-radius:10px;padding:10px 14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right:8px;vertical-align:middle;">
                          <!-- Logo mark: blue cross/plus icon -->
                          <div style="width:24px;height:24px;background-color:#6366f1;border-radius:5px;display:inline-block;text-align:center;line-height:24px;">
                            <span style="color:#ffffff;font-size:16px;font-weight:700;">✦</span>
                          </div>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.3px;">ShipDesk</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04);overflow:hidden;">

              <!-- Top accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#6366f1 0%,#818cf8 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 40px 36px;">
                    ${opts.bodyHtml}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;padding-bottom:8px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Sent by <strong style="color:#6b7280;">ShipDesk</strong> · AI Client Portal for Freelance Developers
              </p>
              <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">
                You're receiving this because someone used your email address on ShipDesk.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
    <tr>
      <td style="border-radius:8px;background-color:#6366f1;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:-0.1px;">${label} &rarr;</a>
      </td>
    </tr>
  </table>`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.4px;">Hi ${name} 👋</p>`;
}

function bodyText(html: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#374151;">${html}</p>`;
}

function mutedText(html: string): string {
  return `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">${html}</p>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid #f3f4f6;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

function infoBox(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:#f5f3ff;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 16px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#4338ca;">${html}</p>
      </td>
    </tr>
  </table>`;
}

// ─── Email senders ────────────────────────────────────────────────────────────

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

  const body = `
    ${greeting(name)}
    ${bodyText(`<strong>${sender}</strong> has invited you to access your dedicated project portal on ShipDesk.`)}
    ${bodyText("Click the button below to securely log in — no password needed.")}
    ${ctaButton("Access Your Portal", opts.magicLinkUrl)}
    ${divider()}
    ${mutedText("This link expires in <strong>7 days</strong>. If you weren't expecting this, you can safely ignore it.")}
  `;

  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.clientName ?? undefined }],
    subject: `Your portal access link from ${sender}`,
    htmlContent: emailLayout({ previewText: `Access your project portal from ${sender}`, bodyHtml: body }),
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

  const body = `
    ${greeting(name)}
    ${bodyText(`<strong>${sender}</strong> has published a new project status update for you.`)}
    ${opts.reportSummary ? infoBox(`<strong>${opts.reportTitle}</strong><br/>${opts.reportSummary}`) : infoBox(`<strong>${opts.reportTitle}</strong>`)}
    ${bodyText("View the full report in your portal to see all the details.")}
    ${ctaButton("View Full Report", opts.portalUrl)}
    ${mutedText("You're receiving this because you have access to a project portal on ShipDesk.")}
  `;

  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.clientName ?? undefined }],
    subject: `New project update: ${opts.reportTitle}`,
    htmlContent: emailLayout({ previewText: `${sender} published a new status update`, bodyHtml: body }),
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
  const name = opts.recipientName || "there";

  const subjectMap = {
    new_request: `New scope change request: ${opts.scopeChangeTitle}`,
    quote_sent: `Quote ready for your review: ${opts.scopeChangeTitle}`,
    approved: `Scope change approved: ${opts.scopeChangeTitle}`,
    declined: `Scope change declined: ${opts.scopeChangeTitle}`,
  };
  const bodyMap = {
    new_request: `A new scope change request has been submitted for <strong>${opts.projectName}</strong>.`,
    quote_sent: `A quote is ready for your review on the scope change request for <strong>${opts.projectName}</strong>.`,
    approved: `Great news — the scope change request for <strong>${opts.projectName}</strong> has been <strong style="color:#16a34a;">approved</strong>.`,
    declined: `The scope change request for <strong>${opts.projectName}</strong> has been <strong style="color:#dc2626;">declined</strong>.`,
  };
  const ctaMap = {
    new_request: "View Request",
    quote_sent: "Review Quote",
    approved: "View Details",
    declined: "View Details",
  };

  const body = `
    ${greeting(name)}
    ${bodyText(bodyMap[opts.type])}
    ${infoBox(`<strong>${opts.scopeChangeTitle}</strong><br/>Project: ${opts.projectName}`)}
    ${ctaButton(ctaMap[opts.type], opts.portalUrl)}
    ${mutedText("You're receiving this because you have access to a project portal on ShipDesk.")}
  `;

  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.recipientName ?? undefined }],
    subject: subjectMap[opts.type],
    htmlContent: emailLayout({ previewText: subjectMap[opts.type], bodyHtml: body }),
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
  const name = opts.recipientName || "there";

  const body = `
    ${greeting(name)}
    ${bodyText(`<strong>${opts.senderName}</strong> sent you a new message on the <strong>${opts.projectName}</strong> project.`)}
    ${ctaButton("View Message", opts.portalUrl)}
    ${mutedText("You're receiving this because you have access to a project portal on ShipDesk.")}
  `;

  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.recipientName ?? undefined }],
    subject: `New message on ${opts.projectName}`,
    htmlContent: emailLayout({ previewText: `${opts.senderName} sent you a message`, bodyHtml: body }),
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
  const name = opts.developerName || "there";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency,
  }).format(opts.amount);

  const body = `
    ${greeting(name)}
    ${bodyText("Great news — a payment has been confirmed! 🎉")}
    ${infoBox(`<strong>${opts.invoiceTitle}</strong><br/>Amount received: <strong>${formatted}</strong>`)}
    ${bodyText("The invoice status has been automatically updated to <strong style='color:#16a34a;'>Paid</strong> in your ShipDesk dashboard.")}
    ${mutedText("No action needed — this is just a confirmation.")}
  `;

  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.developerName ?? undefined }],
    subject: `Payment received: ${opts.invoiceTitle}`,
    htmlContent: emailLayout({ previewText: `${formatted} received for ${opts.invoiceTitle}`, bodyHtml: body }),
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
  const name = opts.clientName || "there";
  const sender = opts.agencyName || "Your developer";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency,
  }).format(opts.amount);

  const body = `
    ${greeting(name)}
    ${bodyText(`<strong>${sender}</strong> has sent you a new invoice.`)}
    ${infoBox(`<strong>${opts.invoiceTitle}</strong><br/>Amount due: <strong>${formatted}</strong>`)}
    ${opts.paymentUrl ? ctaButton("Pay Now", opts.paymentUrl) : ""}
    ${mutedText("If you have any questions about this invoice, please reply to this email or contact your project team directly.")}
  `;

  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to, name: opts.clientName ?? undefined }],
    subject: `Invoice from ${sender}: ${opts.invoiceTitle}`,
    htmlContent: emailLayout({ previewText: `Invoice for ${formatted} from ${sender}`, bodyHtml: body }),
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

  const body = `
    ${greeting("there")}
    ${bodyText(`<strong>${opts.inviterName}</strong> has invited you to join the <strong>${workspace}</strong> workspace on ShipDesk.`)}
    ${bodyText("Accept the invitation to start collaborating on projects, viewing reports, and managing clients together.")}
    ${ctaButton("Accept Invitation", opts.joinUrl)}
    ${divider()}
    ${mutedText("This invitation expires in <strong>7 days</strong>. If you don't have a ShipDesk account yet, you'll be prompted to create one. If you weren't expecting this, you can safely ignore it.")}
  `;

  await safeSend(client, {
    sender: from,
    to: [{ email: opts.to }],
    subject: `${opts.inviterName} invited you to join ${workspace} on ShipDesk`,
    htmlContent: emailLayout({ previewText: `You've been invited to join ${workspace}`, bodyHtml: body }),
  });
}
