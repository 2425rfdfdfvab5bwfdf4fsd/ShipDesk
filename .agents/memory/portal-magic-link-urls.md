---
name: Portal magic link URLs
description: How to construct client portal URLs in backend emails.
---

## Rule
Always check `CLIENT_PORTAL_BASE_URL` first. If set, use subdomain URL. If not set, fall back to `FRONTEND_URL/portal/{slug}/...`.

Pattern (TypeScript):
```ts
const url = process.env.CLIENT_PORTAL_BASE_URL
  ? `https://${slug}.${process.env.CLIENT_PORTAL_BASE_URL.replace(/^https?:\/\//, "")}/...`
  : `${process.env.FRONTEND_URL || "http://localhost:5000"}/portal/${slug}/...`;
```

**Why:** Production uses subdomains; Replit dev uses path routing. If CLIENT_PORTAL_BASE_URL is absent (Replit), the subdomain construct produces broken links.

**How to apply:** Applies to `clients.ts` (magic link), `messages.ts` (notification URL), `portal.ts` (scope change notification), and any future email that includes a portal link.
