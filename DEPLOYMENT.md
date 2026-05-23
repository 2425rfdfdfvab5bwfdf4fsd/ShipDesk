# ShipDesk Deployment Guide

ShipDesk is a monorepo with two independently deployed services:

| Service | Platform | What it does |
|---|---|---|
| `server/` | **Railway** | Express API + Prisma ORM + background scheduler |
| `client/` | **Vercel** | React + Vite SPA (static) |

Both services share one PostgreSQL database (Neon recommended).

---

## Prerequisites

Make sure you have accounts and credentials for:

- [Clerk](https://clerk.com) — developer authentication
- [Neon](https://neon.tech) or any PostgreSQL provider — database
- [Railway](https://railway.app) — backend hosting
- [Vercel](https://vercel.com) — frontend hosting

Optional (features degrade gracefully if absent):

- [Cloudinary](https://cloudinary.com) — file uploads
- [Resend](https://resend.com) — transactional email
- [Lemon Squeezy](https://lemonsqueezy.com) — invoice payments
- [GitHub OAuth App](https://github.com/settings/developers) — GitHub integration
- [Google AI Studio](https://aistudio.google.com) — AI report generation

---

## Step 1 — Prepare the Database

1. Create a PostgreSQL database on [Neon](https://neon.tech) (free tier works).
2. Copy the **connection string**:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Save it — you will paste it as `DATABASE_URL` in Railway.

---

## Step 2 — Deploy the Backend on Railway

### 2a. Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select the `shipdesk` repository.
3. Railway auto-detects `railway.toml` — no extra configuration needed.

### 2b. Set environment variables on Railway

In your Railway service → **Variables**, add the following.

> **Important:** Set `NODE_ENV=production` here as a Runtime Variable — **not** in `railway.toml`.
> If it's in the toml file it applies at build time too, causing npm to skip `devDependencies`
> (including `typescript` and `tsx`), which breaks the build with `tsc: not found`.

**Generate secrets:**
```bash
# SESSION_SECRET and AES_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Required variables:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string from Step 1 |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys (starts with `sk_live_`) |
| `SESSION_SECRET` | Random string, at least 32 characters |
| `AES_ENCRYPTION_KEY` | Exactly 64 hex characters (32 bytes) |
| `FRONTEND_URL` | Your Vercel frontend URL, e.g. `https://shipdesk.vercel.app` |
| `NODE_ENV` | `production` |

**Optional variables:**

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key — enables AI report generation |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset name |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API key |
| `LEMONSQUEEZY_STORE_ID` | Lemon Squeezy store ID |
| `LEMONSQUEEZY_VARIANT_ID` | Variant ID for invoice payment links |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy webhook signing secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook signing secret |
| `GITHUB_OAUTH_CALLBACK_URL` | `https://your-backend.up.railway.app/api/github/callback` |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | From address, e.g. `noreply@yourdomain.com` |
| `CLIENT_PORTAL_BASE_URL` | Base URL for client portals, e.g. `https://portal.shipdesk.io` |

> See `server/.env.example` for the full list with comments.

### 2c. Railway service settings

In Railway service → **Settings**, confirm:

| Setting | Value |
|---|---|
| Root Directory | *(leave blank — reads `railway.toml` from repo root)* |
| Builder | Nixpacks *(auto-detected from `nixpacks.toml`)* |
| Auto-deploy on push | Enabled |

In **Settings → Networking**, click **Generate Domain** to get your public backend URL
(e.g. `https://shipdesk-server.up.railway.app`). You will need this in Step 3.

### 2d. What happens on each Railway deploy

Railway runs these steps automatically:

1. `npm install` — installs all workspace dependencies including `devDependencies`
2. `npx prisma generate` — generates the Prisma client from `schema.prisma`
3. `npx tsc --project tsconfig.json` — compiles TypeScript to `server/dist/`
4. **On start:** `npx prisma migrate deploy` — applies any pending migrations
5. `node dist/index.js` — starts the Express server on `$PORT`

The healthcheck polls `/health`. Once it returns `200`, your backend is live.

> **If the deploy fails:** The most common cause is a missing or incorrect `DATABASE_URL`.
> Check Railway's deploy logs — the startup DB check logs a clear error message.

---

## Step 3 — Deploy the Frontend on Vercel

### 3a. Import the repository

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**.
2. Select the `shipdesk` repository.
3. Vercel reads `vercel.json` at the root — no framework or build settings to change.

### 3b. Set environment variables on Vercel

In **Project Settings → Environment Variables**, add:

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys (starts with `pk_live_`) |
| `VITE_API_BASE_URL` | Your Railway backend URL — **no trailing slash**, **no `/api`** |

Example value for `VITE_API_BASE_URL`:
```
https://shipdesk-server.up.railway.app
```

> `VITE_*` variables are embedded into the JS bundle at build time. Never put secret keys here.

> See `client/.env.example` for the full list.

### 3c. What happens on each Vercel deploy

1. `npm install` — installs all workspace dependencies
2. `npm run build --workspace=client` — Vite bundles React to `client/dist/`
3. `client/dist/` is served as a static site
4. All routes are rewritten to `index.html` (SPA routing — no 404s on refresh)
5. `/assets/*` files are cached for 1 year (they are content-hashed by Vite)

---

## Step 4 — Connect Clerk to Production

1. In the Clerk dashboard, go to **Domains** and add your Vercel frontend URL.
2. Add your Railway backend URL as an **Allowed origin**.
3. Switch to **Production** instance keys and update:
   - `CLERK_SECRET_KEY` in Railway variables
   - `VITE_CLERK_PUBLISHABLE_KEY` in Vercel environment variables
4. Trigger a redeploy on both Railway and Vercel after updating the keys.

---

## Step 5 — Configure GitHub OAuth (Optional)

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**.
2. Set:
   - **Homepage URL**: your Vercel frontend URL
   - **Authorization callback URL**: `https://your-backend.up.railway.app/api/github/callback`
3. Copy **Client ID** and **Client Secret** to Railway variables.

---

## Local Development

```bash
# 1. Clone the repo
git clone <repo-url>
cd shipdesk

# 2. Install all dependencies (npm workspaces — installs client + server)
npm install

# 3. Copy env files and fill in values
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# 4. Push DB schema (first time only)
cd server && npx prisma db push && cd ..

# 5. Start both servers
npm run dev
```

The Vite dev server runs on **port 5000** and proxies `/api/*` to the Express server on **port 3000**. No `VITE_API_BASE_URL` needed locally.

---

## Environment Variable Reference

### Railway (Backend) — required

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
SESSION_SECRET=<64 hex chars>
AES_ENCRYPTION_KEY=<64 hex chars>
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Vercel (Frontend) — required

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

---

## Architecture

```
Browser
  │
  ├──▶ Vercel (React SPA)              client/dist/
  │      All /api/* calls ────────▶   Railway (Express API)     $PORT
  │      via VITE_API_BASE_URL              └── Neon PostgreSQL
  │
  └──▶ Custom domain portals           Same Vercel deployment
       (e.g. client.agency.com)        Hostname detected client-side
```

In production the React app calls the Railway backend directly using `VITE_API_BASE_URL`. CORS on the backend is configured to allow your Vercel domain automatically.

---

## Troubleshooting

### Railway: `@prisma/client did not initialize yet`

Prisma client was not generated before TypeScript compilation. Check the build logs — if `prisma generate` did not run, verify the build command in `railway.json`:
```
npm install && npm run build --workspace=server
```
And confirm `server/package.json` build script starts with `npx prisma generate`.

### Railway: `prisma migrate deploy` fails on start

- Verify `DATABASE_URL` is set and the database is reachable.
- If the error is `P3005: database schema is not empty`, the DB has tables but no migration history. Run a baseline from your local machine:
  ```bash
  cd server
  DATABASE_URL="your-connection-string" npx prisma migrate resolve --applied "initial_migration"
  ```

### Railway: `tsc: not found` during build

`NODE_ENV=production` is set in the build environment, causing npm to skip `devDependencies`. Fix: remove `NODE_ENV` from `railway.toml` and set it only as a Railway Runtime Variable.

### Railway: healthcheck timeout

The default healthcheck timeout is 120 seconds. If your DB is slow to cold-start (common with Neon free tier), increase `healthcheckTimeout` in `railway.json`.

### Vercel: blank page or 404 on page refresh

The SPA rewrite in `vercel.json` must be present:
```json
{ "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }] }
```

### Vercel: all API calls return HTML (the React app itself)

`VITE_API_BASE_URL` is not set. Add it to Vercel project settings pointing to your Railway backend URL, then trigger a redeploy.

### Vercel: CORS error in browser console

Set `FRONTEND_URL` in Railway to your exact Vercel deployment URL (e.g. `https://shipdesk.vercel.app`). The backend uses this for the CORS allowed-origins list.

### Vercel: environment variables not found after adding them

Variables added to Vercel must be present **before** the build runs. After adding new `VITE_*` variables, trigger a manual redeploy in the Vercel dashboard.

---

## Redeployment Checklist

- [ ] New DB migration? Runs automatically via `prisma migrate deploy` on Railway startup.
- [ ] New `VITE_*` env var? Add to Vercel settings and trigger a redeploy.
- [ ] New server env var? Add to Railway Variables — Railway auto-redeploys on variable changes.
- [ ] Schema change without migration? Run `npm run db:push --workspace=server` locally then commit.
