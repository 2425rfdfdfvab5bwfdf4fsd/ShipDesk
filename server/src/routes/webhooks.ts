import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { Webhook } from "svix";
import crypto from "crypto";
import { db } from "../lib/prisma.js";
import { verifyWebhookSignature as verifyGitHub } from "../services/githubService.js";
import { verifyWebhookSignature as verifyLS } from "../services/lemonSqueezyService.js";

const router = Router();

router.post("/clerk", async (req: Request, res: Response) => {
  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSig = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSig) {
    res.status(401).json({ error: "Missing svix headers" });
    return;
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET || "";
  const wh = new Webhook(secret);

  let payload: { type: string; data: Record<string, unknown> };
  try {
    payload = wh.verify(req.body as string | Buffer, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSig,
    }) as typeof payload;
  } catch {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  try {
    if (payload.type === "user.created" || payload.type === "user.updated") {
      const data = payload.data as {
        id: string;
        email_addresses: { email_address: string; id: string }[];
        primary_email_address_id: string;
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };

      const primary = data.email_addresses.find(
        (e) => e.id === data.primary_email_address_id
      );
      const email = primary?.email_address || data.email_addresses[0]?.email_address || "";
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || email;

      await db.user.upsert({
        where: { clerkId: data.id },
        update: { email, name, avatarUrl: data.image_url },
        create: { clerkId: data.id, email, name, avatarUrl: data.image_url },
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/github", (req: Request, res: Response) => {
  const signature = req.headers["x-hub-signature-256"] as string;
  if (!signature || !verifyGitHub(req.body as Buffer, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const eventType = req.headers["x-github-event"] as string;
  if (!["push", "pull_request", "release"].includes(eventType)) {
    res.json({ received: true, skipped: "unsupported_event" });
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse((req.body as Buffer).toString()) as Record<string, unknown>;
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const repoFullName = (payload.repository as { full_name: string } | undefined)?.full_name;
  if (!repoFullName) {
    res.json({ received: true, skipped: "no_repo" });
    return;
  }

  db.project
    .findFirst({ where: { githubRepoFullName: repoFullName } })
    .then(async (project) => {
      if (!project) return;
      await db.gitHubEvent.create({
        data: {
          projectId: project.id,
          eventType: eventType as "push" | "pull_request" | "release",
          payload: payload as Prisma.InputJsonValue,
          repoFullName,
          status: "RECEIVED",
        },
      });
    })
    .catch(console.error);

  res.json({ received: true });
});

router.post("/lemonsqueezy", (req: Request, res: Response) => {
  const signature = req.headers["x-signature"] as string;
  if (!signature || !verifyLS(req.body as Buffer, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let payload: { meta: { event_name: string; custom_data?: Record<string, string> }; data: { id: string; attributes: Record<string, unknown> } };
  try {
    payload = JSON.parse((req.body as Buffer).toString()) as typeof payload;
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const orderId = payload.data.id;
  const customData = payload.meta.custom_data || {};

  if (payload.meta.event_name === "order_created") {
    const processOrder = async () => {
      const existingInvoice = await db.invoice.findFirst({
        where: { lsOrderId: orderId },
      });
      if (existingInvoice) {
        return { received: true, skipped: "duplicate" };
      }

      if (customData.scopeChangeId) {
        await db.scopeChange.update({
          where: { id: customData.scopeChangeId },
          data: { status: "PAID", paidAt: new Date(), lsOrderId: orderId },
        });
      } else if (customData.projectId) {
        const unpaidInvoice = await db.invoice.findFirst({
          where: { projectId: customData.projectId, status: { not: "PAID" } },
          orderBy: { createdAt: "desc" },
        });
        if (unpaidInvoice) {
          await db.invoice.update({
            where: { id: unpaidInvoice.id },
            data: { status: "PAID", paidAt: new Date(), lsOrderId: orderId },
          });
        }
      }
      return { received: true };
    };

    processOrder().then((r) => res.json(r)).catch((err) => {
      console.error("Lemon Squeezy webhook error:", err);
      res.status(500).json({ error: "Internal error" });
    });
  } else {
    res.json({ received: true });
  }
});

export default router;
