"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Moneroo, PaymentStatus } from "moneroo";

// Toutes les méthodes de payin disponibles via Moneroo/Paydunya
const ALL_PAYIN_METHODS = [
  "mtn_bj",       // MTN MoMo Bénin
  "moov_bj",      // Moov Money Bénin
  "moov_ci",      // Moov Money Côte d'Ivoire
  "moov_bf",      // Moov Burkina Faso
  "moov_ml",      // Moov Money Mali
  "moov_tg",      // Moov Money Togo
  "orange_ci",    // Orange Money Côte d'Ivoire
  "orange_bf",    // Orange Burkina Faso
  "orange_ml",    // Orange Money Mali
  "orange_sn",    // Orange Money Sénégal
  "wave_ci",      // Wave Côte d'Ivoire
  "wave_sn",      // Wave Sénégal
  "togocel",      // Togocel Money
  "e_money_sn",   // E-Money Sénégal
  "freemoney_sn", // Free Money Sénégal
  "wizall_sn",    // Wizall Sénégal
];

const COMMISSION_RATES: Record<string, number> = {
  free: 0.05,
  pro: 0.025,
};
const STARTER_MONTHLY_LIMIT = 100;

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
    // 1. Récupère le plan du marchand
    const merchant = await ctx.runQuery(internal.merchants.getByShop, {
      shop: args.shop,
    });
    const plan = merchant?.plan ?? "free";

    // 2. Vérifie le quota mensuel pour le plan Starter
    if (plan === "free") {
      const monthlyCount = await ctx.runQuery(
        internal.payments.countByShopThisMonthInternal,
        { shop: args.shop },
      );
      if (monthlyCount >= STARTER_MONTHLY_LIMIT) {
        throw new Error(
          `Quota mensuel atteint (${STARTER_MONTHLY_LIMIT} transactions). Passez au plan Pro pour continuer.`,
        );
      }
    }

    // 3. Calcule la commission
    const commissionRate = COMMISSION_RATES[plan] ?? COMMISSION_RATES.free;
    const commission = Math.round(args.amount * commissionRate);

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
      // Toutes les méthodes disponibles — ignore les méthodes passées en argument
      methods: ALL_PAYIN_METHODS,
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
      checkoutUrl,
      commission,
      commissionRate,
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
