# Clerk Setup Guide for ShipDesk

This guide walks you through setting up Clerk authentication for ShipDesk
from scratch — from creating your Clerk account all the way to a working
login flow in both development and production.

---

## How Clerk Is Used in This Project

Before you start, here is what Clerk does in ShipDesk:

| What | Where | How |
|---|---|---|
| Sign in / Sign up UI | `client/src/main.tsx` | `<ClerkProvider>` wraps the app |
| Protect developer routes | `client/src/App.tsx` | `useAuth()` checks `isSignedIn` |
| Attach JWT to API calls | `client/src/lib/api.ts` | `getToken()` → `Authorization: Bearer` header |
| Verify JWT on the server | `server/src/middleware/auth.ts` | `verifyToken()` from `@clerk/backend` |
| Sync user to database | `server/src/routes/webhooks.ts` | Clerk webhook → `user.created` / `user.updated` |
| Show user avatar + name | `client/src/components/layout/AppShell.tsx` | `useUser()` hook |

The **client portal** (for clients, not freelancers) does **not** use Clerk —
it uses magic-link sessions instead. Clerk is only for the developer side.

---

## Step 1 — Create a Clerk Account and Application

1. Go to [https://clerk.com](https://clerk.com) and click **Start building for free**.
2. Sign up with your GitHub or Google account.
3. After signing in, you land on the **Clerk Dashboard**.
4. Click **Create application**.
5. Give it a name — e.g. `ShipDesk`.
6. Under **How will your users sign in?**, enable:
   - ✅ **Email address**
   - ✅ **GitHub** (recommended — freelancers often have GitHub accounts)
   - ✅ **Google** (optional but useful)
7. Click **Create application**.

You are now inside your Clerk application dashboard.

---

## Step 2 — Copy Your API Keys

1. In the left sidebar, click **API Keys**.
2. You will see two keys:

   | Key | Variable name | Goes where |
   |---|---|---|
   | **Publishable key** | `VITE_CLERK_PUBLISHABLE_KEY` | Vercel (frontend) |
   | **Secret key** | `CLERK_SECRET_KEY` | Railway (backend) |

3. Copy both keys. Keep the secret key private — never commit it to Git.

> The publishable key starts with `pk_test_` (development) or `pk_live_` (production).  
> The secret key starts with `sk_test_` or `sk_live_`.

---

## Step 3 — Set Environment Variables

### In Vercel (Frontend)

1. Go to your Vercel project → **Settings** → **Environment Variables**.
2. Add the following variable:

   ```
   Name:   VITE_CLERK_PUBLISHABLE_KEY
   Value:  pk_live_xxxxxxxxxxxxxxxxxxxx   (your publishable key)
   ```

3. Make sure the environment is set to **Production**, **Preview**, and **Development**.
4. Click **Save**.
5. Redeploy the frontend for the variable to take effect.

### In Railway (Backend)

1. Go to your Railway project → click your service → **Variables** tab.
2. Add the following variable:

   ```
   Name:   CLERK_SECRET_KEY
   Value:  sk_live_xxxxxxxxxxxxxxxxxxxx   (your secret key)
   ```

3. Railway auto-redeploys when you save a variable.

### In Replit (Local Development)

1. In Replit, open the **Secrets** panel (lock icon in the left sidebar).
2. Add both secrets:

   ```
   VITE_CLERK_PUBLISHABLE_KEY = pk_test_xxxxxxxxxxxxxxxxxxxx
   CLERK_SECRET_KEY           = sk_test_xxxxxxxxxxxxxxxxxxxx
   ```

   Use the **test** keys (`pk_test_` / `sk_test_`) for local development.
   Clerk gives you a separate set of test keys that work without affecting
   your production data.

---

## Step 4 — Configure Allowed Origins (CORS)

Clerk needs to know which domains are allowed to use your application.

1. In the Clerk Dashboard, go to **Domains** (in the left sidebar).
2. You will see your default development domain already added.
3. Click **Add domain** and add your production frontend URL:

   ```
   https://shipdesk-nine.vercel.app
   ```

4. If you have a custom domain (e.g. `https://app.shipdesk.io`), add that too.

---

## Step 5 — Enable GitHub OAuth (Recommended)

Since ShipDesk connects to GitHub, it makes sense for users to sign in with GitHub.

1. In the Clerk Dashboard, go to **User & Authentication** → **Social connections**.
2. Click **GitHub** → toggle it **ON**.
3. For the **development environment**, Clerk provides its own GitHub OAuth app —
   you do not need to create one. It works out of the box.
4. For **production**, you will need to create your own GitHub OAuth App:
   - Go to [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
   - Application name: `ShipDesk`
   - Homepage URL: `https://shipdesk-nine.vercel.app`
   - Authorization callback URL: copy this from the Clerk dashboard
     (it looks like `https://accounts.xxxx.clerk.accounts.dev/v1/oauth_callback`)
   - Click **Register application**
   - Copy the **Client ID** and generate a **Client Secret**
   - Paste both into the Clerk GitHub Social Connection settings
5. Click **Save**.

---

## Step 6 — Set Up Clerk Webhooks

Clerk webhooks sync user data (email, name, avatar) to your Railway database
every time a user signs up or updates their profile.

### Create the webhook endpoint

1. In the Clerk Dashboard, go to **Webhooks** (in the left sidebar).
2. Click **Add endpoint**.
3. Set the endpoint URL to your Railway backend:

   ```
   https://shipdesk-production.up.railway.app/api/webhooks/clerk
   ```

4. Under **Message Filtering**, subscribe to these events:
   - ✅ `user.created`
   - ✅ `user.updated`
5. Click **Create**.

### Copy the webhook secret

1. After creating the endpoint, click on it to open its details.
2. Find the **Signing secret** — it starts with `whsec_`.
3. Copy it.

### Add the secret to Railway

1. Go to Railway → your service → **Variables**.
2. Add:

   ```
   Name:   CLERK_WEBHOOK_SECRET
   Value:  whsec_xxxxxxxxxxxxxxxxxxxx
   ```

This secret is used in `server/src/routes/webhooks.ts` to verify that
incoming webhook requests are genuinely from Clerk (not spoofed).

---

## Step 7 — Verify the Frontend Integration

The frontend is already wired up. Here is what each file does so you
understand the setup:

### `client/src/main.tsx`

Wraps the app in `<ClerkProvider>` using your publishable key:

```tsx
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// ClerkProvider is only added for the developer-facing app,
// NOT for the client portal (which uses magic links instead)
root.render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <App />
  </ClerkProvider>
);
```

### `client/src/App.tsx`

Uses `useAuth()` to check if a developer is signed in:

```tsx
import { useAuth } from "@clerk/clerk-react";

const { isLoaded, isSignedIn } = useAuth();

// If not signed in, show the sign-in page
// If signed in, show the dashboard
```

Also uses `getToken()` to attach the Clerk JWT to every API request:

```tsx
const { getToken } = useAuth();

useEffect(() => {
  const interval = setInterval(async () => {
    const token = await getToken();
    setApiToken(token);  // stored in window.__clerkToken
  }, 60_000);
}, [getToken]);
```

### `client/src/lib/api.ts`

Reads `window.__clerkToken` and attaches it as a Bearer token:

```ts
// Every outgoing API request automatically gets:
// Authorization: Bearer <clerk-jwt>
```

### `server/src/middleware/auth.ts`

Verifies the JWT on every protected route:

```ts
import { verifyToken } from "@clerk/backend";

const { sub: clerkUserId } = await verifyToken(token, {
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Also auto-creates the User record in the DB if it doesn't exist yet
```

---

## Step 8 — Test the Full Flow Locally

1. Make sure both workflows are running in Replit:
   - **Start application** (runs both client and server with `npm run dev`)

2. Open the app at the Replit preview URL.

3. You should see the **landing page** or a **sign-in prompt**.

4. Click **Sign in** — you should see the Clerk sign-in modal/page.

5. Sign in with GitHub or email.

6. After signing in you should be redirected to `/onboarding` (first time)
   or `/dashboard` (returning user).

7. Check the Replit server console — you should see:
   ```
   Database connection verified.
   ShipDesk server running on port 3000
   ```

8. Go to the Clerk Dashboard → **Users** — your test account should appear there.

---

## Step 9 — Test the Webhook Locally (Optional)

To test webhooks in local development, you need to expose your local server
to the internet so Clerk can send events to it.

1. Install ngrok or use Cloudflare Tunnel:
   ```bash
   npx ngrok http 3000
   ```

2. Copy the public URL (e.g. `https://abc123.ngrok.io`).

3. In the Clerk Dashboard → **Webhooks**, add a second endpoint:
   ```
   https://abc123.ngrok.io/api/webhooks/clerk
   ```

4. Subscribe to `user.created` and `user.updated`.

5. Sign up with a new account — the webhook should fire and you should see
   the user appear in your local database.

> You can verify by checking the webhook logs in Clerk Dashboard →
> Webhooks → your endpoint → **Logs** tab.

---

## Step 10 — Go Live (Production Checklist)

Before pushing to production, verify the following:

- [ ] `VITE_CLERK_PUBLISHABLE_KEY` is set in Vercel (use `pk_live_` key)
- [ ] `CLERK_SECRET_KEY` is set in Railway (use `sk_live_` key)
- [ ] `CLERK_WEBHOOK_SECRET` is set in Railway
- [ ] Webhook endpoint points to `https://shipdesk-production.up.railway.app/api/webhooks/clerk`
- [ ] Webhook events `user.created` and `user.updated` are subscribed
- [ ] Your production domain is added in Clerk Dashboard → Domains
- [ ] GitHub OAuth app is using your production callback URL (if using GitHub login)
- [ ] You have signed in successfully on the live site at least once

---

## Troubleshooting

### "Missing authorization header" — API calls return 401

- Check that `VITE_CLERK_PUBLISHABLE_KEY` is set in Vercel and the frontend
  was rebuilt after adding it.
- Check that `getToken()` is running before the first API call.
- Open browser DevTools → Network — look for an `Authorization: Bearer ...`
  header on API requests. If it is missing, the token is not being set.

### "Invalid token" — server returns 401

- Confirm `CLERK_SECRET_KEY` is set correctly in Railway.
- Make sure you are using the **same environment** (test vs live) for both
  frontend and backend keys. Mixing `pk_test_` (frontend) with `sk_live_`
  (backend) will not work.

### User not appearing in your database after sign-up

- The webhook may not be configured or may be failing.
- Go to Clerk Dashboard → Webhooks → your endpoint → **Logs** tab.
- Look for failed deliveries. Common causes:
  - Wrong endpoint URL
  - `CLERK_WEBHOOK_SECRET` is missing or incorrect in Railway
  - Railway server is not running

### Sign-in page shows but redirects to blank page

- Check that `VITE_CLERK_PUBLISHABLE_KEY` starts with `pk_` and is not empty.
- Check the browser console for errors like `ClerkJS: Invalid publishable key`.

### "Multiple ClerkProvider instances" error in development

- This is handled automatically in this project via the `import.meta.hot.dispose`
  cleanup in `client/src/main.tsx`. If you still see it, restart the dev server.

---

## Environment Variable Summary

| Variable | Value | Where to set |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Vercel environment variables |
| `CLERK_SECRET_KEY` | `sk_live_...` | Railway environment variables |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` | Railway environment variables |

For local development, add all three to Replit Secrets using the `pk_test_`
and `sk_test_` variants.
