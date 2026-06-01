# Indie Hackers Post — ShipDesk Launch

## Title
I built an AI-native client portal for freelance developers — here's what I learned

---

## Body

Hey IH 👋

I'm a freelance developer, and like most of you, I was drowning in client communication.

Every week I'd spend hours:
- Writing status update emails from scratch
- Chasing clients for invoice approvals
- Answering "where are we on the project?" Slack messages
- Managing scope change requests over email threads

So I built **ShipDesk** — an AI-powered client portal for freelance developers.

---

### What it does

**ShipDesk connects to your GitHub and auto-generates weekly status reports using AI (Gemini).** Your clients get a branded portal where they can:

- Read AI-generated weekly progress reports (no more writing updates manually)
- View and approve invoices
- Submit and track scope change requests
- Message you directly
- Access shared project files

You get a professional, branded experience — they get transparency. Everyone wins.

---

### The problem I kept hitting

I tried tools like Notion, Basecamp, and even custom Google Sites for clients. None of them:

1. Connected to my actual work (GitHub commits, PRs)
2. Generated updates automatically
3. Handled invoices + scope changes in one place
4. Looked professional enough for client-facing use

I was either paying for enterprise tools I didn't need, or duct-taping 4 different apps together.

---

### What I built

- **AI Status Reports** — connects to GitHub, pulls your commits and PRs, generates a readable client-friendly summary weekly
- **Client Portal** — magic link auth (no password needed for clients), branded with your colors and logo
- **Invoices** — create, send, and accept payments via Lemon Squeezy
- **Scope Changes** — clients can request scope changes, you can quote them and accept payment
- **File Sharing & Messaging** — everything in one place

Stack: React + Vite + Node.js + Express + Prisma + Neon Postgres + Clerk Auth + Gemini AI

---

### Where I am now

- MVP is live
- Looking for freelance developers to try it and give feedback
- Especially interested in pain points around client communication

---

### Ask

If you're a freelance developer who hates writing client update emails — **try ShipDesk and tell me what's broken.**

I'd love brutal feedback on:
- What features are missing?
- Would you pay for this? What price feels right?
- What would make you switch from your current setup?

---

Thanks for reading. Happy to answer any questions in the comments.

— Saif

---

*ShipDesk — AI-native client portal for freelance developers*
*[app.shipdesk.io](https://app.shipdesk.io)*
