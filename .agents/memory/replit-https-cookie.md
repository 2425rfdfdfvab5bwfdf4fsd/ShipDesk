---
name: Replit HTTPS cookie fix
description: How to set secure cookies correctly on Replit where NODE_ENV is not "production" but HTTPS is always active.
---

## Rule
Never use `secure: process.env.NODE_ENV === "production"` for cookies on Replit.
Use `secure: req.secure || req.headers["x-forwarded-proto"]?.split(",")[0].trim() === "https"` instead.

**Why:** Replit proxies all traffic through HTTPS even in dev mode (NODE_ENV stays "development"). Browsers refuse to send cookies with `secure: false` back to the server when the page was loaded over HTTPS, breaking OAuth state cookies and client session cookies.

**How to apply:** Any time you set a cookie in Express on this project (GitHub OAuth state, client portal session, etc.), use the x-forwarded-proto check.
