import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import crypto from "crypto";

function setup() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY || "" });
}

export async function createPaymentLink(opts: {
  title: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  buyerName: string | null;
  customData?: Record<string, string>;
}): Promise<string> {
  setup();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID || "";
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID || "";

  const checkout = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: opts.buyerEmail,
      name: opts.buyerName || undefined,
      custom: opts.customData,
    },
    productOptions: {
      name: opts.title,
      description: `${opts.title} — ${opts.currency} ${opts.amount}`,
    },
  });

  if (checkout.error) {
    throw new Error(`Lemon Squeezy checkout creation failed: ${checkout.error.message}`);
  }

  return checkout.data?.data.attributes.url || "";
}

export async function createSubscriptionCheckout(opts: {
  plan: "SOLO" | "AGENCY";
  workspaceId: string;
  email: string;
  name: string;
  redirectUrl: string;
}): Promise<string> {
  setup();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID || "";
  const variantId =
    opts.plan === "SOLO"
      ? process.env.LEMONSQUEEZY_SOLO_VARIANT_ID || ""
      : process.env.LEMONSQUEEZY_AGENCY_VARIANT_ID || "";

  if (!variantId) {
    throw new Error(
      `Missing env var LEMONSQUEEZY_${opts.plan}_VARIANT_ID — add it to configure the ${opts.plan} subscription.`
    );
  }

  const checkout = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: opts.email,
      name: opts.name,
      custom: {
        workspaceId: opts.workspaceId,
        plan: opts.plan,
      },
    },
    productOptions: {
      redirectUrl: opts.redirectUrl,
    },
  });

  if (checkout.error) {
    throw new Error(`Lemon Squeezy subscription checkout failed: ${checkout.error.message}`);
  }

  return checkout.data?.data.attributes.url || "";
}

export async function getSubscriptionPortalUrl(subscriptionId: string): Promise<string> {
  setup();
  const result = await getSubscription(subscriptionId);
  if (result.error) {
    throw new Error(`Failed to fetch subscription: ${result.error.message}`);
  }
  const attrs = result.data?.data.attributes as Record<string, unknown> | undefined;
  const urls = attrs?.urls as Record<string, string> | undefined;
  return urls?.customer_portal || urls?.update_payment_method || "";
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}
