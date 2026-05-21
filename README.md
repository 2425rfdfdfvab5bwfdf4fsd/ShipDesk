# ShipDesk

AI-native client portal for freelance developers. Automatically generates plain-English weekly project status reports from GitHub activity.

## Stack

- **Frontend:** React 18 + Vite 6 + TypeScript + TailwindCSS v4 + shadcn/ui + Wouter + TanStack Query v5
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Clerk
- **AI:** Google Gemini 1.5 Pro
- **Payments:** Lemon Squeezy
- **Files:** Cloudinary
- **Email:** Resend

## Setup

1. Copy `.env.example` to `.env` and fill in all values
2. `npm install`
3. `cd server && npx prisma migrate dev`
4. `npm run dev` from root

## Structure

```
shipdesk/
├── client/   # React frontend → Vercel
└── server/   # Express backend → Railway
```
# ShipDesk
# ShipDesk
