# ShipDesk — Deployment Guide

This guide walks you through deploying ShipDesk from scratch.

**Architecture:**
- The **frontend** (React app) is deployed to **Vercel** as a static site.
- The **backend** (Express API + database) is deployed to **Railway**.
- They talk to each other over HTTPS. The frontend calls the backend using the `VITE_API_BASE_URL` environment variable.

```
User's browser
      │
      ├──▶  Vercel  (React SPA — client/)
      │        │
      │        └──▶  Railway  (Express API — server/)
      │                  │
      │                  └──▶  PostgreSQL database  (Neon or Railway Postgres)
      │
      └──▶  Custom domain portals  (detected by hostname, same Vercel deployment)
```

**Estimated setup time: 30–45 minutes** (most of it is creating accounts and copying API keys).

---

## What You Will Need

Before you start, create free accounts on these services:

| Service | What it's for | Sign-up link |
|---|---|---|
| **Neon** | PostgreSQL database (free tier is plenty) | https://neon.tech |
| **Clerk** | Developer login / authentication | https://clerk.com |
| **Railway** | Hosting the Express backend | https://railway.app |
| **Vercel** | Hosting the React frontend | https://vercel.com |

**Optional** — the app works without these, but features will be disabled:

| Service | Feature it enables |
|---|---|
| Google AI Studio | AI-generated weekly status reports |
| Cloudinary | File uploads and sharing |
| Lemon Squeezy | Payment links on invoices |
| Resend | Transactional emails (magic links, notifications) |
| GitHub OAuth App | GitHub integration for pulling commits/PRs |

---

## Step 1 — Push the Code to GitHub

ShipDesk must be in a GitHub repository so Vercel and Railway can pull from it.

1. Create a new **private** repository on GitHub.
2. Push the codebase:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

---

## Step 2 — Create the Database (Neon)

> **Why Neon?** It's free, serverless PostgreSQL, and works perfectly with Railway. You can also use Railway's built-in Postgres if you prefer.

1. Go to [neon.tech](https://neon.tech) and sign in.
2. Click **New Project** → give it a name (e.g. `shipdesk-db`).
3. Select a region close to your Railway deployment (e.g. `US East`).
4. Once created, go to the **Dashboard** → **Connection Details**.
5. Set the connection type to **Pooled** and copy the connection string. It looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
6. **Save this string** — you will paste it into Railway in the next step.

---

## Step 3 — Deploy the Backend on Railway

### 3a. Create a new Railway project

1. Go to [railway.app](https://railway.app) → click **New Project**.
2. Choose **Deploy from GitHub repo**.
3. Authorize Railway to access your GitHub account, then select your `shipdesk` repository.
4. Railway will automatically detect `railway.toml` in the root. Click **Deploy Now**.

> At this point the deployment will **fail** — that's expected. You haven't added environment variables yet. Continue to the next step.

---

### 3b. Get your Clerk keys

You need Clerk API keys for both Railway (backend) and Vercel (frontend).

1. Go to [clerk.com](https://clerk.com) and sign in.
2. Click **Create application** → give it a name → choose your sign-in options (Google, email, etc.).
3. Once created, go to **API Keys** in the left sidebar.
4. Copy two values:
   - **Publishable Key** — starts with `pk_test_` or `pk_live_`. This goes on Vercel.
   - **Secret Key** — starts with `sk_test_` or `sk_live_`. This goes on Railway.

---

### 3c. Generate secure secrets

You need two random secret strings. Run these commands in your terminal:

```bash
# SESSION_SECRET — used to sign client session cookies
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# AES_ENCRYPTION_KEY — used to encrypt GitHub OAuth tokens
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy and save both outputs. Each will be a 64-character hex string.

---

### 3d. Set environment variables on Railway

1. In your Railway project, click on the service (it should show a failed deployment).
2. Click the **Variables** tab.
3. Add each variable below using the **+ New Variable** button.

#### Required variables (the app will not start without these)

| Variable | What to put here |
|---|---|
| `DATABASE_URL` | The Neon connection string from Step 2 |
| `CLERK_SECRET_KEY` | Your Clerk secret key (`sk_test_...` or `sk_live_...`) |
| `SESSION_SECRET` | The first random string you generated above |
| `AES_ENCRYPTION_KEY` | The second random string you generated above |
| `FRONTEND_URL` | Leave blank for now — you will fill this in after deploying Vercel |
| `NODE_ENV` | `production` |

> **Important — why `NODE_ENV` goes here and not in the config file:**
> If `NODE_ENV=production` is set at build time, npm skips installing `devDependencies`
> (which includes the TypeScript compiler). The build will fail with `tsc: not found`.
> Setting it here makes it a runtime variable only, which is the correct behavior.

#### Optional variables (add any that apply to you)

| Variable | What to put here |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key — get it at [aistudio.google.com](https://aistudio.google.com) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name (found in Cloudinary dashboard) |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | Name of an unsigned upload preset (create in Cloudinary settings) |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API key |
| `LEMONSQUEEZY_STORE_ID` | Your Lemon Squeezy store ID |
| `LEMONSQUEEZY_VARIANT_ID` | The variant ID for your invoice product |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy webhook signing secret |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | The from address for emails, e.g. `noreply@yourdomain.com` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID (see Step 7) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_WEBHOOK_SECRET` | A random string you choose — used to verify GitHub webhook payloads |
| `GITHUB_OAUTH_CALLBACK_URL` | `https://YOUR-RAILWAY-URL/api/github/callback` (fill in after getting your Railway URL) |
| `CLIENT_PORTAL_BASE_URL` | Base URL for client portals, e.g. `https://portal.yourdomain.com` |

---

### 3e. Trigger a redeploy

After adding all variables, click **Deploy** (or push a new commit) to trigger a fresh deployment.

Railway will automatically:
1. Install all dependencies including TypeScript and Prisma
2. Generate the Prisma client from `schema.prisma`
3. Compile TypeScript to JavaScript in `server/dist/`
4. On startup: apply any pending database migrations
5. Start the Express server on the port Railway assigns

The deployment log will show each step. Look for:
```
Database connection verified.
ShipDesk server running on port XXXX
Environment: production
```

Once the healthcheck at `/health` returns `200 OK`, your backend is live.

---

### 3f. Copy your Railway backend URL

1. In Railway, go to **Settings → Networking**.
2. Click **Generate Domain** if you haven't already.
3. You will get a URL like: `https://shipdesk-server-production.up.railway.app`
4. **Copy this URL** — you will need it in the next step.

---

## Step 4 — Deploy the Frontend on Vercel

### 4a. Import the repository

1. Go to [vercel.com](https://vercel.com) → click **Add New Project**.
2. Click **Import Git Repository** and select your `shipdesk` repo.
3. Vercel will detect `vercel.json` in the root automatically.
4. **Do not change** the framework preset or build settings — `vercel.json` handles everything.

---

### 4b. Set environment variables on Vercel

Before clicking Deploy, go to the **Environment Variables** section and add:

| Variable | What to put here |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key (`pk_test_...` or `pk_live_...`) |
| `VITE_API_BASE_URL` | Your Railway backend URL from Step 3f — **no trailing slash** |

Example:
```
VITE_API_BASE_URL = https://shipdesk-server-production.up.railway.app
```

> **Why this matters:** Vercel serves only static files. There is no server to proxy API calls.
> The React app uses `VITE_API_BASE_URL` to know where to send all `/api/*` requests.
> If this is missing, every API call will fail silently.

---

### 4c. Deploy

Click **Deploy**. Vercel will:
1. Install all workspace dependencies
2. Run `npm run build --workspace=client` — Vite bundles the React app
3. Serve `client/dist/` as a static site
4. Route all page navigations back to `index.html` (required for React Router)
5. Cache all static assets (`/assets/*`) for 1 year with immutable headers

Your frontend will be live at a URL like: `https://shipdesk-abc123.vercel.app`

---

## Step 5 — Connect Everything Together

### 5a. Update `FRONTEND_URL` on Railway

Now that you have your Vercel URL:

1. Go back to Railway → **Variables**.
2. Set `FRONTEND_URL` to your Vercel URL, e.g. `https://shipdesk-abc123.vercel.app`
3. Railway will auto-redeploy. This tells the backend which origin to allow in CORS headers.

---

### 5b. Add your URLs to Clerk

1. Go to your Clerk dashboard → click your application.
2. Go to **Domains** (or **Allowed origins** depending on Clerk version).
3. Add your Vercel frontend URL.
4. Add your Railway backend URL.

This allows Clerk's authentication flow to work across both domains.

---

### 5c. Verify everything is working

Open your Vercel URL in a browser. You should see the ShipDesk landing/login page.

1. Click **Sign In** — Clerk's login modal should appear.
2. Sign in with your account.
3. You should land on the dashboard and see the onboarding checklist.
4. Open your browser's developer tools → **Network** tab and confirm API calls return `200` (not `401` or `404`).

---

## Step 6 — Switch Clerk to Production (When Ready)

By default Clerk gives you **development keys** (`pk_test_`, `sk_test_`). These work fine for testing but show a warning banner.

When you are ready to go fully live:

1. In Clerk dashboard → click **Production** in the environment switcher.
2. Follow Clerk's checklist to configure your production domain.
3. Copy the new **production keys** (`pk_live_`, `sk_live_`).
4. Update `VITE_CLERK_PUBLISHABLE_KEY` in Vercel and redeploy.
5. Update `CLERK_SECRET_KEY` in Railway (it redeploys automatically).

---

## Step 7 — Configure GitHub OAuth (Optional)

This enables the GitHub integration — connecting repos and pulling commits for AI reports.

1. Go to [github.com/settings/developers](https://github.com/settings/developers).
2. Click **OAuth Apps** → **New OAuth App**.
3. Fill in:
   - **Application name**: ShipDesk (or your agency name)
   - **Homepage URL**: your Vercel frontend URL
   - **Authorization callback URL**: `https://YOUR-RAILWAY-URL/api/github/callback`
4. Click **Register application**.
5. On the next page, click **Generate a new client secret**.
6. Copy the **Client ID** and **Client Secret** into Railway variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_OAUTH_CALLBACK_URL` (the full callback URL you set above)

---

## Step 8 — Set Up a Custom Domain (Optional)

### Custom domain for the frontend (Vercel)

1. Go to Vercel → your project → **Settings → Domains**.
2. Add your domain (e.g. `app.yourdomain.com`).
3. Add the CNAME record in your DNS provider as Vercel instructs.

### Custom domain for client portals

ShipDesk supports per-workspace custom domains. Clients can access their portal at their own domain (e.g. `portal.yourclient.com`) instead of a subdomain.

To enable this:
1. Set `CLIENT_PORTAL_BASE_URL` in Railway to your portal base domain.
2. In the ShipDesk workspace settings, enter the custom domain.
3. The workspace settings page will show the required CNAME record for the client to add in their DNS.

---

## Database Migrations

Migrations run automatically every time Railway starts your backend.

**To create a new migration** (after changing `schema.prisma`):
```bash
cd server
npm run db:migrate -- --name describe_your_change
git add prisma/migrations
git commit -m "Add migration: describe_your_change"
git push
```
Railway will apply it automatically on the next deploy.

**To push schema changes without a migration** (for prototyping only):
```bash
cd server && npm run db:push
```

**To run migrations manually** against the production database:
```bash
cd server
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
```

---

## Environment Variable Quick Reference

### Railway — paste this as a starting template

```env
# ── Required ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
SESSION_SECRET=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
AES_ENCRYPTION_KEY=<output of same command, run again>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production

# ── AI (optional) ─────────────────────────────────────────────────────────────
GEMINI_API_KEY=

# ── File uploads (optional) ───────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=

# ── Payments (optional) ───────────────────────────────────────────────────────
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_VARIANT_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=

# ── Email (optional) ──────────────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# ── GitHub OAuth (optional) ───────────────────────────────────────────────────
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=
GITHUB_OAUTH_CALLBACK_URL=https://your-backend.up.railway.app/api/github/callback
```

### Vercel — paste this as a starting template

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

---

## Troubleshooting

### Railway build fails with `tsc: not found` or any devDependency binary missing

**Cause:** Railway runs a plain `npm install` at build time. When `NODE_ENV=production` is set (which Railway does by default, or when a custom build command is configured in the dashboard), npm skips all `devDependencies` — including TypeScript, Prisma CLI, and any `@types/*` packages. Any binary or type that lives only in `devDependencies` will be missing.

This also bypasses `nixpacks.toml` — even if `nixpacks.toml` specifies `npm install --include=dev`, a custom build command set in the Railway dashboard takes precedence and ignores the file entirely.

**Fix (permanent — already applied to this repo):** Move every package that is needed at **build time** out of `devDependencies` and into `dependencies` in `server/package.json`. This makes them always installed regardless of `NODE_ENV` or Railway dashboard settings:

```json
"dependencies": {
  "typescript": "^5.4.5",
  "prisma": "^5.22.0",
  "@types/express": "^4.17.21",
  "@types/node": "^20.14.2",
  "@types/cookie-parser": "^1.4.7",
  "@types/cors": "^2.8.17",
  "@types/jsonwebtoken": "^9.0.6",
  "@types/node-cron": "^3.0.11",
  "@types/sanitize-html": "^2.11.0"
}
```

Only `tsx` (the dev hot-reload runner) stays in `devDependencies` — Railway never needs it.

**Alternative fixes (if you don't want to touch `package.json`):**
- **Fix A:** Remove `NODE_ENV` from `railway.toml` entirely. Set it as a Railway **Variable** in the dashboard instead (runtime-only, not applied during the build phase).
- **Fix B:** Set a custom build command in the Railway dashboard: `npm install --include=dev && npm run build --workspace=server`

---

### Railway build fails with `TS7006: Parameter implicitly has an 'any' type`

**Cause:** Same root cause as above — `@types/express` (and other `@types/*` packages) are missing at compile time because Railway skipped `devDependencies`. Without these type definitions, TypeScript cannot infer Express parameter types (`req`, `res`, `next`) and reports them as implicit `any`, which fails under `strict: true`.

**Symptom in build log:**
```
src/routes/workspace.ts(255,33): error TS7006: Parameter 'next' implicitly has an 'any' type.
src/routes/workspace.ts(283,28): error TS7006: Parameter 'res' implicitly has an 'any' type.
```

**Fix (permanent — already applied to this repo):** All `@types/*` packages have been moved from `devDependencies` to `dependencies` in `server/package.json` (see fix above). They are now always installed.

---

### Railway deployment fails — `DATABASE_URL` error in logs

**Cause:** The database is unreachable or the connection string is wrong.

**Fix:**
1. Go to Railway → **Variables** and verify `DATABASE_URL` is set.
2. Copy the connection string from Neon and paste it again to rule out typos.
3. Make sure the Neon project is in the same region as your Railway service to avoid timeout issues.

---

### Railway: `prisma migrate deploy` fails with `P3005`

**Cause:** The database already has tables (maybe from `db:push`) but no migration history. Prisma doesn't know if the existing schema is up to date.

**Fix — run a baseline from your local machine:**
```bash
cd server
DATABASE_URL="your-connection-string" npx prisma migrate resolve --applied "0001_init"
```
Replace `0001_init` with the name of your first migration folder in `server/prisma/migrations/`.

---

### Vercel build fails — TypeScript errors

**Cause:** The `build` script previously ran `tsc && vite build`. TypeScript errors abort the build.

**Fix:** This project's `client/package.json` `build` script is now just `vite build`. Vite transpiles TypeScript via esbuild without type-checking, so the build succeeds even with type warnings. Type-check separately with `npm run typecheck --workspace=client`.

---

### Vercel: page shows blank or crashes on refresh

**Cause:** The SPA rewrite rule is missing, so Vercel returns a 404 for any URL that isn't the root.

**Fix:** Verify `vercel.json` in the repo root contains:
```json
{
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }]
}
```

---

### Vercel: all API calls fail (network errors or 404)

**Cause:** `VITE_API_BASE_URL` is not set in Vercel, so the React app sends API requests to the Vercel domain, which has no Express server.

**Fix:**
1. Go to Vercel → **Project Settings → Environment Variables**.
2. Add `VITE_API_BASE_URL` set to your full Railway backend URL (no trailing slash).
3. Click **Redeploy** — environment variables are baked in at build time, so you must redeploy after adding them.

---

### Vercel: CORS error in the browser console

**Cause:** The backend doesn't recognize the Vercel domain as an allowed origin.

**Fix:** Set `FRONTEND_URL` in Railway variables to your exact Vercel URL including `https://`. Example: `https://shipdesk-abc123.vercel.app`. Railway auto-redeploys on variable changes.

---

### Railway healthcheck keeps timing out

**Cause:** The database takes too long to respond on the first connection (common with Neon's free tier, which suspends after inactivity).

**Fix:** Increase `healthcheckTimeout` in `railway.json` to `180` or `300`. Neon's cold-start time is usually under 3 seconds but occasionally spikes.

---

### Magic link emails are not arriving

**Cause:** `RESEND_API_KEY` is not set.

**Fix:** Add a Resend API key. Without it, magic link emails are logged to the Railway console but not actually sent. You can paste the link from the logs during development.

---

## Redeployment Checklist

Use this checklist every time you push a new version:

- [ ] **New DB migration?** → Runs automatically on Railway startup via `prisma migrate deploy`. No action needed.
- [ ] **Changed `schema.prisma` without a migration?** → Run `npm run db:push --workspace=server` locally and commit.
- [ ] **Added a new `VITE_*` env var?** → Add it in Vercel settings, then trigger a manual redeploy (env vars are baked into the bundle at build time).
- [ ] **Added a new server env var?** → Add it in Railway Variables — Railway auto-redeploys.
- [ ] **Updated Clerk keys?** → Update both `CLERK_SECRET_KEY` (Railway) and `VITE_CLERK_PUBLISHABLE_KEY` (Vercel), then redeploy both.
