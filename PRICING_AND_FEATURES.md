# ShipDesk — Pricing & Platform Features

**Version:** 1.0
**Date:** May 25, 2026
**Status:** Current

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Pricing Plans](#2-pricing-plans)
3. [Trial & Access Rules](#3-trial--access-rules)
4. [Billing & Subscription Visibility](#4-billing--subscription-visibility)
5. [Subscription Management](#5-subscription-management)
6. [Paywall Behavior](#6-paywall-behavior)
7. [Admin Override](#7-admin-override)
8. [Technical Stack](#8-technical-stack)

---

## 1. Platform Overview

ShipDesk is an AI-native client portal for freelance developers and small dev agencies. It connects to GitHub, automatically generates plain-English weekly project status reports, and gives every client a branded portal for files, messages, invoices, and scope change requests.

### Core Features (all paid plans)

- **AI-generated status reports** — weekly reports written automatically from GitHub commit, pull request, and release activity
- **Branded client portal** — white-label portal at your subdomain with your logo and brand color
- **Magic link client access** — clients sign in with a single email link; no password required; sessions last 30 days
- **Invoice & payment collection** — create milestone invoices with embedded checkout links clients pay directly from the portal
- **Scope change requests** — structured form for clients to submit change requests; developer quotes and approves; payment link generated automatically on approval
- **File uploads & sharing** — drag-and-drop file sharing per project
- **Async client messaging** — per-project threaded messaging between developer and client
- **GitHub integration** — connect repositories via OAuth; commits, pull requests, and releases are synced automatically via webhooks

### Upcoming Features

The following features are planned and not yet available:

- **Team seats** — invite team members to share a workspace (coming soon)
- **Linear sync** — sync Linear issues and cycles as a data source for reports (coming soon)
- **Vercel sync** — sync Vercel deployments as a data source for reports (coming soon)

---

## 2. Pricing Plans

All prices are per workspace, billed monthly.

---

### Starter — $5/month

Get your first client portal live in minutes.

- 3 client projects
- 10 AI status reports per month
- Magic link client portal
- Invoice + payment links
- File uploads & sharing
- Async client messaging

**Trial:** First-time users can try Starter free for 14 days. The trial is started manually by clicking "Try free for 14 days" on the Pricing or Billing page. No credit card is required to begin the trial.

**Button state:** The Starter plan button reads "Try free for 14 days" for users who have never started a trial. Once the trial has been used — or if the user is no longer eligible for a trial — the button automatically switches to "Get started."

---

### Solo — $29/month

Everything a freelancer needs to look like a studio.

- Up to 10 client projects
- Unlimited AI reports
- GitHub webhook integration
- Branded portal + client invites
- Invoice + payment collection
- Scope change requests & quoting
- File sharing & async messaging

---

### Agency — $79/month

Scale your client operations without the overhead.

- Everything in Solo
- Unlimited projects
- Unlimited AI reports
- Custom domain client portal
- GitHub integration + DNS verification
- Priority support
- Team seats (coming soon)
- Linear & Vercel sync (coming soon)

---

## 3. Trial & Access Rules

### How the Trial Works

The 14-day Starter trial is **manually started** by the developer. When a user creates a workspace they land on the Billing page, where they can click **"Try free for 14 days"** on the Starter plan card. The trial does not start automatically on account creation — the user must explicitly opt in.

Once started:

- The trial gives the developer full access to all Starter plan features for 14 days.
- No credit card is required to start or complete the trial.
- The trial period is fixed at 14 days from the date it is started; it cannot be paused or extended by the user.
- Each workspace is entitled to **one trial** on the Starter plan. A trial cannot be restarted once it has ended.

### Access During the Trial

While the trial is active, the developer has the same access as a paying Starter subscriber: up to 3 projects, 10 AI reports per month, client portal, invoices, files, and messaging.

### After the Trial Ends

When the 14-day trial expires without a paid plan being activated, access rules change immediately. See [Section 6 — Paywall Behavior](#6-paywall-behavior) for the full specification.

### Eligibility

- First-time users (no prior subscription, no prior trial): eligible for the 14-day free trial on the Starter plan.
- Users who have previously started a trial: not eligible for another trial.
- Users who already hold or held a paid subscription: not eligible for a trial on any plan.
- Admin-granted plan recipients: the trial is not applicable; access is controlled by the admin grant.

---

## 4. Billing & Subscription Visibility

Developers can see exactly how much time is left in their current billing period or trial in two places:

- **Billing page** — in the current plan status card at the top of the page
- **Plan tab in Settings** — inline summary of the current plan and remaining days

### Remaining Days Display

| State | Display |
|---|---|
| Active trial | "X of 14 trial days remaining" with a progress bar |
| Active paid plan (Starter / Solo / Agency) | "X of 30 days remaining" with a progress bar |
| Cancelled paid plan (still within period) | "Access ends in X days · [date]" in amber/red |
| Trial expired, no plan | "Trial expired — choose a plan below to continue" |
| Admin-granted plan | Plan name + "Admin granted access" (no countdown) |

The progress bar turns red when 7 or fewer days remain on a cancelled subscription.

---

## 5. Subscription Management

### Payment Failure

If a scheduled renewal payment fails, the subscription moves to **past due** status. The developer retains full access during a **5-day grace period** while the payment processor (Lemon Squeezy) automatically retries the charge. If payment is not collected within the grace period, the subscription is cancelled and access rules revert to the expired state described in Section 6.

Developers receive an email notification when a payment fails and again if the grace period is about to expire.

### Cancellation Policy

- Developers can cancel their subscription at any time from the Lemon Squeezy billing portal (accessible via the "Manage subscription" button on the Billing page).
- On cancellation, the subscription status changes to **cancelled** but access continues until the end of the current billing period.
- **No partial refunds are issued** for unused days in the current billing cycle.
- After the billing period ends, access reverts to the paywall state described in Section 6.

### Upgrades and Downgrades

- **Upgrading** (e.g., Starter → Solo, or Solo → Agency) takes effect **immediately**. The developer gains access to the higher plan's features right away.
- **Downgrading** (e.g., Agency → Solo, or Solo → Starter) takes effect **at the start of the next billing cycle**. The developer keeps their current plan features until that date.
- Pricing is **not prorated** between plans. Upgrades and downgrades change the renewal amount for the next cycle; no credit or charge adjustment is made mid-cycle.

### Annual Billing

Annual billing is **not currently offered**. All plans are billed monthly. Annual plans may be introduced in a future release.

---

## 6. Paywall Behavior

When a developer's trial expires and no paid plan is active, the following rules apply immediately:

### Developer Access (Dashboard)

- The developer's dashboard becomes **read-only**.
- The developer can view existing projects, reports, invoices, scope changes, files, and messages but **cannot create or edit** any records.
- The developer cannot generate new AI reports, send new messages, upload files, or create new invoices or scope change requests.
- The developer is shown a persistent banner prompting them to choose a paid plan. All primary action buttons are disabled until a plan is activated.

### Client Portal Access

- **Existing client portal URLs remain live** for clients during the paywall period.
- Clients can still view reports, files, messages, and invoices that were created before the trial expired.
- Clients **cannot submit new scope change requests** and will see no new reports, files, or messages because the developer cannot create them.

### Data Retention

- Workspace data (projects, reports, invoices, clients, files, messages) is retained for **90 days** after a trial expires with no plan activated, or after a paid subscription ends with no renewal.
- After 90 days, the workspace and all associated data are **permanently deleted** and cannot be recovered.
- Developers receive email reminders at 60 days and again at 80 days warning of upcoming deletion.

---

## 7. Admin Override

### What "Admin-Granted Plans" Means

An admin-granted plan is plan access that is manually assigned by a **ShipDesk platform-level admin** (a member of the ShipDesk operations or support team). It is used for:

- **Partnerships** — partner workspaces that have a commercial arrangement with ShipDesk
- **Beta testers** — invited beta participants who need plan access outside the normal trial flow
- **Support cases** — situations where a developer's access needs to be restored or extended due to a billing error or service issue

### What It Is Not

An admin-granted plan is **not** something a workspace owner or workspace member can issue. There is no in-product UI for a developer to grant plan access to themselves or to another workspace. Only ShipDesk staff operating at the platform level can assign or revoke an admin grant.

### Behavior

- Admin-granted plan recipients see their plan labeled with an **"Admin grant"** badge in the dashboard and Billing page.
- The Billing & Subscription Visibility countdown is not shown for admin-granted plans (there is no expiry date to display).
- Admin-granted access does not interfere with a developer's ability to start or maintain their own paid subscription. If a developer on an admin grant subscribes to a plan, the paid subscription takes precedence.

---

## 8. Technical Stack

The following implementation details are documented here for internal reference. They are not surfaced in user-facing product copy.

| Layer | Technology |
|---|---|
| AI report generation | Google Gemini 1.5 Pro |
| Payment processing | Lemon Squeezy (Merchant of Record — handles global VAT/GST) |
| File storage & CDN | Cloudinary |
| Rich text (scope change quotes) | Tiptap |
| Transactional email | Brevo / Resend |
| Auth (developer) | Clerk (email + Google OAuth) |
| Auth (client portal) | Magic link → session cookie (30-day sessions) |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL (Neon / Railway) |
| Frontend hosting | Vercel |
| Backend hosting | Railway |
