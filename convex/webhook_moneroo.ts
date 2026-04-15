"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { constructWebhookEvent, PaymentStatus } from "moneroo";

/**
 * Traitement du webhook Moneroo dans le runtime Node.js.
 * Nécessite "use node" pour node:crypto (vérification HMAC de la signature).
 */
export const handleMonerooWebhook = internalAction({
  args: {
    rawBody: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, { rawBody, signature }): Promise<{ status: number; body: string }> => {
    const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Moneroo webhook] MONEROO_WEBHOOK_SECRET is not set");
      return { status: 500, body: "Server misconfiguration" };
    }

    if (!signature) {
      return { status: 400, body: "Missing signature" };
    }

    let event: ReturnType<typeof constructWebhookEvent>;
    try {
      event = constructWebhookEvent(rawBody, signature, webhookSecret);
    } catch {
      return { status: 401, body: "Invalid signature" };
    }

    // Ignorer les événements non-payment
    if (!event.event.startsWith("payment.")) {
      return { status: 200, body: "OK" };
    }

    const monerooId = event.data.id;
    const newStatus = event.data.status as string;

    const isFinal = [
      PaymentStatus.Success,
      PaymentStatus.Failed,
      PaymentStatus.Cancelled,
    ].includes(event.data.status as PaymentStatus);

    await ctx.runMutation(internal.payments.updateStatus, {
      monerooId,
      status: newStatus,
      ...(isFinal && { processedAt: Date.now() }),
    });

    if (event.event === "payment.success") {
      await ctx.runAction(internal.shopify.fulfillOrder, { monerooId });
    }

    return { status: 200, body: "OK" };
  },
});
