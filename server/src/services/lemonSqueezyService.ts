import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import crypto from "crypto";

lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY || "",
});

export async function createPaymentLink(opts: {
  title: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  buyerName: string | null;
  customData?: Record<string, string>;
}): Promise<string> {
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
