# ShipDesk Deployment Guide

ShipDesk is a monorepo with two deployable services:

| Service | Platform | What it does |
|---|---|---|
| `server/` | **Railway** | Express API + Prisma + background scheduler |
| `client/` | **Vercel** | React + Vite SPA |

Both services share one PostgreSQL database (Neon recommended).

---

## Prerequisites

Before deploying, make sure you have accounts and credentials for:

- [Clerk](https://clerk.com) — authentication (developer sign-in)
- [Neon](https://neon.tech) (or any PostgreSQL provider) — database
- [Railway](https://railway.app) — backend hosting
- [Vercel](https://vercel.com) — frontend hosting

Optional services (features degrade gracefully if absent):

- [Cloudinary](https://cloudinary.com) — file uploads
- [Resend](https://resend.com) — transactional email
- [Lemon Squeezy](https://lemonsqueezy.com) — invoice payments
- [GitHub OAuth App](https://github.com/settings/developers) — GitHub integration
- [Google AI Studio](https://aistudio.google.com) — AI report generation

---

## Step 1 — Prepare the Database

1. Create a new PostgreSQL database on [Neon](https://neon.tech) (free tier works).
2. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Save it as `DATABASE_URL`. You will paste this into both Railway and any local `.env`.

---

## Step 2 — Deploy the Backend on Railway

### 2a. Create a new Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select the `shipdesk` repository.
3. Railway will detect `railway.toml` and use it automatically.

### 2b. Set environment variables on Railway

In your Railway service → **Variables**, add every variable from the table below.

**Required:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string from Step 1 |
| `CLERK_SECRET_KEY` | From Clerk dashboard → API Keys (starts with `sk_`) |
| `SESSION_SECRET` | Any random string ≥ 32 characters |
| `AES_ENCRYPTION_KEY` | Exactly 64 hex characters (32 bytes, used to encrypt OAuth tokens) |
| `FRONTEND_URL` | Your Vercel frontend URL, e.g. `https://shipdesk.vercel.app` |
| `NODE_ENV` | Set to `production` |

> **⚠️ Important — set `NODE_ENV=production` as a Railway Variable, NOT in `railway.toml`.**
> If `NODE_ENV=production` is in `railway.toml`'s `[environment]` block it applies during the build phase too, causing npm to skip `devDependencies` (including `typescript`), which breaks the build with `tsc: not found`.
> Setting it as a Railway Variable makes it runtime-only.

> **Generate secrets quickly:**
> ```bash
> # SESSION_SECRET
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> # AES_ENCRYPTION_KEY
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

**Optional:**

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key for report generation |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API key |
| `LEMONSQUEEZY_STORE_ID` | Lemon Squeezy store ID |
| `LEMONSQUEEZY_VARIANT_ID` | Lemon Squeezy variant ID for invoices |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy webhook signing secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook signing secret |
| `GITHUB_OAUTH_CALLBACK_URL` | Full OAuth callback URL, e.g. `https://your-backend.up.railway.app/api/github/callback` |
| `RESEND_API_KEY` | Resend API key for emails |
| `EMAIL_FROM` | From address, e.g. `noreply@yourdomain.com` |
| `CLIENT_PORTAL_BASE_URL` | Base URL for client portals, e.g. `https://portal.shipdesk.io` |

### 2c. Railway Settings (important)

In your Railway service → **Settings**, confirm:

| Setting | Value |
|---|---|
| **Source Repo** | your GitHub repo |
| **Branch** | `main` |
| **Root Directory** | *(leave blank — Railway reads `railway.toml` from repo root)* |
| **Builder** | Nixpacks *(auto-detected)* |
| **Auto-deploy on push** | Enabled |
| **Wait for CI** | Off *(unless you have GitHub Actions)* |

In **Settings → Networking**, click **Generate Domain** to get your public backend URL (e.g. `https://shipdesk-server.up.railway.app`). Add this URL to Clerk's allowed origins and to Vercel's `VITE_API_BASE_URL`.

### 2d. Deploy

Railway will automatically:
1. Run `npm install --include=dev` (installs all deps including TypeScript compiler)
2. Run `npx prisma generate`
3. Baseline the existing DB with `prisma migrate resolve --applied`
4. Run `npx prisma migrate deploy` (applies any pending migrations)
5. Run `npm run build` → compiles TypeScript to `dist/`
6. Start the server with `node dist/index.js`

The healthcheck hits `/health`. Once it returns `200`, your backend is live at a URL like:
```
https://shipdesk-server.up.railway.app
```

> **If the first deploy fails:** Check that `DATABASE_URL` is set correctly. Migration errors are the most common cause of failed deployments.

---

## Step 3 — Deploy the Frontend on Vercel

### 3a. Import the repository

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**.
2. Select the `shipdesk` repository.
3. Vercel reads `vercel.json` at the root — no extra framework settings needed.

### 3b. Set environment variables on Vercel

In **Project Settings → Environment Variables**, add:

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard → API Keys (starts with `pk_`) |
| `VITE_API_BASE_URL` | Your Railway backend URL, e.g. `https://shipdesk-server.up.railway.app` |

> `VITE_*` variables are embedded into the JavaScript bundle at build time. Never put secret keys here.

### 3c. Deploy

Vercel will automatically:
1. Run `npm install`
2. Run `npm run build --workspace=client` (TypeScript compile + Vite bundle)
3. Serve `client/dist/` as a static site
4. Redirect all routes to `index.html` (SPA routing)
5. Cache `/assets/*` files for 1 year (they are content-hashed)

---

## Step 4 — Run Database Migrations

Migrations run automatically on each Railway deploy via `prisma migrate deploy`.

To run them manually (e.g. from a local machine):

```bash
# From repo root
cd server
DATABASE_URL="your-connection-string" npx prisma migrate deploy
```

To create a new migration during development:

```bash
cd server
npm run db:migrate -- --name describe_your_change
```

To push schema changes without migrations (prototyping only):

```bash
cd server
npm run db:push
```

---

## Step 5 — Connect Clerk to Production

1. In the Clerk dashboard, go to **Domains** and add your Vercel frontend URL.
2. Add your Railway backend URL as an **Allowed origin**.
3. Switch to **Production** instance keys in Clerk and update both `CLERK_SECRET_KEY` (Railway) and `VITE_CLERK_PUBLISHABLE_KEY` (Vercel) with the production keys.

---

## Step 6 — Configure GitHub OAuth (Optional)

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**.
2. Set:
   - **Homepage URL**: your Vercel frontend URL
   - **Authorization callback URL**: `https://your-backend.up.railway.app/api/github/callback`
3. Copy the **Client ID** and **Client Secret** into Railway variables.

---

## Environment Variable Reference

### Railway (Backend) — Full list

```env
# Required
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
SESSION_SECRET=<32+ random chars>
AES_ENCRYPTION_KEY=<64 hex chars>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production

# AI
GEMINI_API_KEY=

# File uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=

# Payments
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_VARIANT_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=
GITHUB_OAUTH_CALLBACK_URL=https://your-backend.up.railway.app/api/github/callback

# Client portal
CLIENT_PORTAL_BASE_URL=https://portal.yourdomain.com
```

### Vercel (Frontend) — Full list

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

---

## Architecture Overview

```
Browser
  │
  ├──▶ Vercel (React SPA)         client/dist/
  │      └── /api/* proxied ──▶  Railway (Express API)    port from $PORT
  │                                   └── Neon PostgreSQL
  │
  └──▶ *.portal.shipdesk.io       Same Vercel deployment
         (client portal subdomain)     Detected via hostname
```

In production, the React app calls the backend directly via `VITE_API_BASE_URL`. CORS is configured on the backend to allow your Vercel domain.

---

## Troubleshooting

### Railway: `@prisma/client did not initialize yet`
Run the build manually to regenerate the client:
```bash
cd server && npx prisma generate
```
Make sure `DATABASE_URL` is set in Railway variables.

### Railway: `prisma migrate deploy` fails
- Check that `DATABASE_URL` points to a reachable database.
- If you see `P3005: database schema is not empty`, the database has tables but no migration history. Run a baseline:
  ```bash
  npx prisma migrate resolve --applied "migration_name"
  ```

### Vercel: blank page / 404 on refresh
Ensure `vercel.json` has the SPA rewrite rule:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### Vercel: API calls fail with CORS error
Set `FRONTEND_URL` on Railway to match your exact Vercel deployment URL (including `https://`).

### Vercel: `VITE_CLERK_PUBLISHABLE_KEY` not found
Environment variables must be set **before** the build runs. Add them in Vercel project settings and redeploy.

### Railway: deployment times out on healthcheck
Increase `healthcheckTimeout` in `railway.toml`. Default is 60s. Common cause: database connection hanging on startup.

---

## Redeployment Checklist

When pushing a new release:

- [ ] New migration? It runs automatically via `prisma migrate deploy` on Railway deploy.
- [ ] New `VITE_*` env var? Add it to Vercel project settings and trigger a redeploy.
- [ ] New server env var? Add it to Railway variables — Railway auto-redeploys on variable changes.
- [ ] Schema changed? Run `npm run db:generate` locally and commit the generated types if needed.
