"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Moneroo } from "moneroo";

function getMonerooClient(): Moneroo {
  const secretKey = process.env.MONEROO_SECRET_KEY;
  if (!secretKey) throw new Error("MONEROO_SECRET_KEY is not set");
  return new Moneroo({ secretKey });
}

/**
 * Déclenche le reversement au marchand après un paiement confirmé.
 * momo-gate possède le compte Moneroo — aucune config requise côté marchand
 * sauf son numéro mobile money enregistré dans ses paramètres.
 *
 * Montant reversé = montant total - commission (5% Starter / 2,5% Pro)
 */
export const triggerMerchantPayout = internalAction({
  args: { monerooPaymentId: v.string() },
  handler: async (ctx, { monerooPaymentId }) => {
    // 1. Récupérer le paiement
    const payment = await ctx.runQuery(internal.payments.getByMonerooId, {
      monerooId: monerooPaymentId,
    });

    if (!payment) {
      console.error(`[payout] Payment not found: ${monerooPaymentId}`);
      return;
    }

    // 2. Récupérer les infos de payout du marchand
    const merchant = await ctx.runQuery(internal.merchants.getByShop, {
      shop: payment.shop,
    });

    if (!merchant?.payoutPhone || !merchant?.payoutMethod) {
      console.warn(
        `[payout] No payout info configured for shop ${payment.shop} — skipping`,
      );
      return;
    }

    // 3. Calcul du montant net (commission stockée à la création du paiement)
    const commission = payment.commission ?? Math.round(payment.amount * 0.05);
    const netAmount = payment.amount - commission;

    if (netAmount <= 0) {
      console.warn(`[payout] Net amount ≤ 0 for payment ${monerooPaymentId}`);
      return;
    }

    // 4. Vérifier qu'un payout n'a pas déjà été déclenché pour ce paiement
    const existing = await ctx.runQuery(internal.payouts.getByPayment, {
      monerooPaymentId,
    });
    if (existing) {
      console.warn(
        `[payout] Payout already exists for payment ${monerooPaymentId} (status: ${existing.status})`,
      );
      return;
    }

    // 5. Appel Moneroo payout — depuis notre compte, vers le mobile money du marchand
    const moneroo = getMonerooClient();

    try {
      const response = await moneroo.payouts.initialize({
        amount: netAmount,
        currency: payment.currency,
        description: `Reversement ${payment.shopifyOrderName ?? monerooPaymentId}`,
        method: merchant.payoutMethod,
        customer: {
          email: merchant.payoutEmail ?? `marchand@${payment.shop}`,
          first_name: merchant.payoutFirstName ?? "Marchand",
          last_name: merchant.payoutLastName ?? "",
        },
        recipient: {
          msisdn: merchant.payoutPhone,
        },
      });

      await ctx.runMutation(internal.payouts.create, {
        shop: payment.shop,
        monerooPaymentId,
        monerooPayoutId: response.data.id,
        amount: netAmount,
        currency: payment.currency,
        status: "pending",
        recipientPhone: merchant.payoutPhone,
        recipientMethod: merchant.payoutMethod,
      });

      console.log(
        `[payout] ${response.data.id} — ${netAmount} ${payment.currency} → ${merchant.payoutPhone} (${merchant.payoutMethod})`,
      );
    } catch (err) {
      console.error(`[payout] Failed for payment ${monerooPaymentId}:`, err);

      // Enregistrer l'échec pour pouvoir le relancer manuellement
      await ctx.runMutation(internal.payouts.create, {
        shop: payment.shop,
        monerooPaymentId,
        amount: netAmount,
        currency: payment.currency,
        status: "failed",
        recipientPhone: merchant.payoutPhone,
        recipientMethod: merchant.payoutMethod,
      });
    }
  },
});
