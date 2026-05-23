# ShipDesk

**AI-native client portal SaaS for freelance developers and agencies.**

ShipDesk eliminates the most painful part of client work — writing weekly updates. It connects to your GitHub, watches your commits and pull requests, and uses Google Gemini AI to write polished, plain-English status reports for your clients automatically, every week.

Clients get their own branded portal where they can read reports, send messages, approve invoices, review scope change requests, and download files — all without needing an account or password.

---

## Features

### For the Developer
- **AI Status Reports** — Connects to GitHub via OAuth. Reads commits and PRs. Generates professional client-ready weekly updates with one click (or on a schedule).
- **Client Portals** — Every project gets a branded portal on a custom subdomain or your own custom domain with full CNAME support.
- **Magic Link Auth** — Clients log in via a one-click email link. No passwords, no friction.
- **Invoices** — Create and send invoices with Lemon Squeezy payment links built in.
- **Scope Change Requests** — Formal scope change workflow with rich-text quotes (Tiptap editor) and client approval.
- **File Sharing** — Upload and share project files via Cloudinary. Clients can download directly from their portal.
- **Messaging** — Per-project message threads between developer and client with unread indicators.
- **Workspace Branding** — Custom agency name, logo, and primary color applied to all client-facing surfaces.
- **Onboarding Checklist** — Guided setup flow so new users reach their first value fast.
- **Report Scheduler** — Background cron job generates and delivers reports on a weekly schedule in production.

### For the Client
- Branded portal at `yourslug.shipdesk.io` or your own domain
- View AI-generated weekly status reports
- Read and reply to messages from the developer
- Download shared files
- Approve or request changes on scope change requests
- Pay invoices via Lemon Squeezy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Routing | Wouter |
| Data fetching | TanStack Query v5 |
| Rich text | Tiptap |
| Backend | Node.js, Express 4, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth (developer) | Clerk (JWT) |
| Auth (client) | Magic link → signed session cookie |
| AI | Google Gemini 1.5 Pro (`@google/generative-ai`) |
| File storage | Cloudinary |
| Payments | Lemon Squeezy |
| Email | Resend |
| GitHub integration | OAuth 2.0 + Webhooks |

---

## Project Structure

```
shipdesk/
├── client/                         # React SPA → deploy to Vercel
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/             # AppShell, ClientPortalLayout
│   │   │   ├── ui/                 # shadcn/ui primitives
│   │   │   ├── reports/            # ReportCard, ReportViewer, GenerateReportButton
│   │   │   ├── invoices/           # InvoiceCard, InvoiceForm, InvoiceStatusBadge
│   │   │   ├── scope/              # ScopeChangeCard, ScopeChangeForm, QuoteForm
│   │   │   ├── messages/           # MessageThread
│   │   │   ├── files/              # FileList
│   │   │   ├── onboarding/         # OnboardingChecklist
│   │   │   ├── workspace/          # WorkspaceSettingsForm, BrandingEditor
│   │   │   └── projects/           # ProjectCard
│   │   ├── pages/
│   │   │   ├── dev/                # Developer dashboard, projects, invoices, settings
│   │   │   └── client/             # Client portal pages (reports, messages, files, etc.)
│   │   ├── hooks/                  # React Query data hooks (one per resource)
│   │   ├── lib/                    # api.ts (axios), queryClient.ts, utils.ts
│   │   └── types/                  # Shared TypeScript types
│   ├── .env.example                # Frontend environment variable reference
│   └── vite.config.ts
│
├── server/                         # Express API → deploy to Railway
│   ├── src/
│   │   ├── routes/                 # workspace, projects, github, reports, clients,
│   │   │   │                       # files, messages, invoices, scopeChanges, portal, webhooks
│   │   ├── services/               # gemini, cloudinary, lemonSqueezy, email,
│   │   │   │                       # github, reportScheduler
│   │   ├── middleware/             # auth (Clerk JWT), clientAuth (session cookie),
│   │   │   │                       # errorHandler, rateLimiter
│   │   └── lib/                    # prisma.ts client singleton
│   ├── prisma/
│   │   └── schema.prisma           # Full database schema
│   ├── .env.example                # Backend environment variable reference
│   └── tsconfig.json
│
├── vercel.json                     # Vercel deployment config (SPA routing, headers)
├── railway.json                    # Railway deployment config
├── railway.toml                    # Railway deployment config (toml format)
├── nixpacks.toml                   # Railway build config — pins Node 20
├── .env.example                    # Combined environment variable reference
└── DEPLOYMENT.md                   # Step-by-step deployment guide for Vercel + Railway
```

---

## Auth Model

| Surface | Method |
|---|---|
| Developer dashboard (`/`) | Clerk (social login, email/password) |
| Client portal (`/portal/*`) | Magic link → signed session cookie (`shipdesk_client_session`) |

Developer API routes (`/api/*`) require a Clerk JWT in the `Authorization` header.
Client portal routes (`/api/portal/*`) require a valid session cookie set after magic link verification.

---

## Database Schema

Core models: `User`, `Workspace`, `Project`, `Client`, `Report`, `Invoice`, `ScopeChange`, `Message`, `File`, `GitHubInstallation`.

Full schema: [`server/prisma/schema.prisma`](server/prisma/schema.prisma)

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- A PostgreSQL database (local or [Neon](https://neon.tech) free tier)
- A [Clerk](https://clerk.com) account (free tier)

### Setup

```bash
# 1. Install all dependencies (npm workspaces installs client + server)
npm install

# 2. Set up backend environment variables
cp server/.env.example server/.env
# Edit server/.env — at minimum set DATABASE_URL, CLERK_SECRET_KEY, SESSION_SECRET

# 3. Set up frontend environment variables
cp client/.env.example client/.env.local
# Edit client/.env.local — set VITE_CLERK_PUBLISHABLE_KEY

# 4. Push the database schema (first time only)
cd server && npx prisma db push && cd ..

# 5. Start both servers
npm run dev
```

The app runs at **http://localhost:5000**. The Vite dev server proxies all `/api/*` requests to Express on port 3000 — no extra configuration needed.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend (port 5000) and backend (port 3000) concurrently |
| `npm run build` | Build both client and server for production |
| `npm run build:client` | Build frontend only |
| `npm run build:server` | Build backend only |
| `npm run start` | Start the production server |
| `npm run lint` | Type-check both workspaces |

From `server/`:

| Command | Description |
|---|---|
| `npm run db:migrate` | Create a new migration (`prisma migrate dev`) |
| `npm run db:push` | Push schema without migration (prototyping) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:deploy` | Apply pending migrations to production DB |

---

## Deployment

Frontend → **Vercel** | Backend → **Railway**

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full step-by-step guide.

### Quick overview

1. Deploy backend to Railway — set `DATABASE_URL`, `CLERK_SECRET_KEY`, `SESSION_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
2. Deploy frontend to Vercel — set `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL` (your Railway URL)
3. Add your Vercel URL to Clerk's allowed domains
4. Done

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Yes | Clerk server-side key (`sk_live_...`) |
| `SESSION_SECRET` | Yes | 32+ char random string for session cookies |
| `AES_ENCRYPTION_KEY` | Yes | 64 hex chars for encrypting OAuth tokens |
| `FRONTEND_URL` | Yes | Your Vercel app URL (used in CORS + email links) |
| `NODE_ENV` | Yes | `production` in production |
| `GEMINI_API_KEY` | Optional | Enables AI report generation |
| `CLOUDINARY_*` | Optional | Enables file uploads |
| `LEMONSQUEEZY_*` | Optional | Enables invoice payment links |
| `RESEND_API_KEY` | Optional | Enables transactional email |
| `GITHUB_*` | Optional | Enables GitHub integration |

### Frontend (`client/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend key (`pk_live_...`) |
| `VITE_API_BASE_URL` | Yes (production) | Railway backend URL — no trailing slash |

> Full list with descriptions: [`server/.env.example`](server/.env.example) and [`client/.env.example`](client/.env.example)

---

## License

MIT — see [LICENSE](LICENSE)
