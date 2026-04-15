"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Moneroo, PaymentStatus } from "moneroo";

function getMonerooClient(): Moneroo {
  const secretKey = process.env.MONEROO_SECRET_KEY;
  const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!secretKey) throw new Error("MONEROO_SECRET_KEY is not set");
  return new Moneroo({ secretKey, webhookSecret });
}

/**
 * Initialise un paiement Moneroo pour une commande Shopify.
 * Appelé depuis le webhook ORDERS_CREATE.
 */
export const initializePayment = action({
  args: {
    shop: v.string(),
    shopifyOrderId: v.string(),
    shopifyOrderName: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    returnUrl: v.string(),
    customer: v.object({
      email: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      phone: v.optional(v.string()),
    }),
    methods: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const moneroo = getMonerooClient();

    const response = await moneroo.payments.initialize({
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      return_url: args.returnUrl,
      customer: {
        email: args.customer.email,
        first_name: args.customer.firstName,
        last_name: args.customer.lastName,
        phone: args.customer.phone,
      },
      methods: args.methods,
      metadata: {
        shopifyOrderId: args.shopifyOrderId,
        shopifyOrderName: args.shopifyOrderName,
        shop: args.shop,
      },
    });

    const { id: monerooId, checkout_url: checkoutUrl } = response.data;

    await ctx.runMutation(internal.payments.create, {
      shop: args.shop,
      monerooId,
      shopifyOrderId: args.shopifyOrderId,
      shopifyOrderName: args.shopifyOrderName,
      amount: args.amount,
      currency: args.currency,
      status: PaymentStatus.Initiated,
      customerEmail: args.customer.email,
      customerName: `${args.customer.firstName} ${args.customer.lastName}`.trim(),
      customerPhone: args.customer.phone,
      checkoutUrl,
    });

    return { monerooId, checkoutUrl };
  },
});

/**
 * Vérifie le statut d'un paiement auprès de Moneroo (source of truth).
 * À appeler avant de confirmer une commande.
 */
export const verifyPayment = internalAction({
  args: { monerooId: v.string() },
  handler: async (ctx, { monerooId }) => {
    const moneroo = getMonerooClient();
    const response = await moneroo.payments.verify(monerooId);
    const payment = response.data;

    const isFinal = [
      PaymentStatus.Success,
      PaymentStatus.Failed,
      PaymentStatus.Cancelled,
    ].includes(payment.status);

    await ctx.runMutation(internal.payments.updateStatus, {
      monerooId,
      status: payment.status,
      ...(isFinal && { processedAt: Date.now() }),
    });

    return payment;
  },
});
