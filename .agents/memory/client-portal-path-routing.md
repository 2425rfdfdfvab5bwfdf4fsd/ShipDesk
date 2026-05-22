---
name: Client portal path routing
description: How the client portal routing works on Replit vs production.
---

## Rule
The client portal has two routing modes:
- **Production**: subdomain `{slug}.portal.shipdesk.io` — detected by `getWorkspaceSlug()` checking `hostname.split(".")[1] === "portal"`. Uses `<ClientPortalApp>` directly.
- **Dev/Replit**: path-based `/portal/{slug}/*` — detected by `pathname.match(/^\/portal\/([a-z0-9-]+)/)`. Wrapped in `<Router base={/portal/${slug}>` from wouter so inner routes strip the prefix.

**Why:** Replit has a single domain with no subdomain routing. The path-based fallback makes the portal accessible in dev without needing DNS setup.

**How to apply:** `App.tsx` already handles both. If adding new portal pages, put them in `ClientPortalApp`'s `Switch` with path-relative routes (e.g. `/projects/:id`) — they work for both modes.
