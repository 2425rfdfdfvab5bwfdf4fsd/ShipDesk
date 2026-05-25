import type { Plan } from "@/types";

export const PLAN_PRICES: Record<Exclude<Plan, "FREE">, string> = {
  STARTER: "$5",
  SOLO: "$29",
  AGENCY: "$79",
};

export const PLAN_FEATURES: Record<Exclude<Plan, "FREE">, string[]> = {
  STARTER: [
    "3 client projects",
    "10 AI status reports/month",
    "Magic link client portal",
    "Invoice + payment links",
    "File uploads & sharing",
    "Async client messaging",
  ],
  SOLO: [
    "Up to 10 client projects",
    "Unlimited AI reports",
    "GitHub webhook integration",
    "Branded portal + client invites",
    "Invoice + payment collection",
    "Scope change requests & quoting",
    "File sharing & async messaging",
  ],
  AGENCY: [
    "Unlimited projects",
    "Unlimited AI reports",
    "GitHub integration",
    "Everything in Solo",
    "Priority support",
    "Team seats (coming soon)",
    "Linear & Vercel sync (coming soon)",
  ],
};
