import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Met à jour une commande Shopify après un paiement Moneroo réussi.
 * Ajoute une note à la commande et la marque comme payée (si l'API le permet).
 */
export const fulfillOrder = internalAction({
  args: { monerooId: v.string() },
  handler: async (ctx, { monerooId }) => {
    // Récupérer le paiement pour obtenir les infos Shopify
    const payment = await ctx.runQuery(internal.payments.getByMonerooId, { monerooId });
    if (!payment) {
      console.error(`[shopify.fulfillOrder] Payment not found: ${monerooId}`);
      return;
    }

    if (!payment.shopifyOrderId || !payment.shop) {
      console.warn(`[shopify.fulfillOrder] Missing shopifyOrderId or shop for ${monerooId}`);
      return;
    }

    // Récupérer le session offline du marchand pour appeler l'Admin API
    const sessions = await ctx.runQuery(internal.sessions.getByShopInternal, { shop: payment.shop });
    const offlineSession = sessions.find((s) => !s.isOnline);

    if (!offlineSession) {
      console.error(`[shopify.fulfillOrder] No offline session for shop: ${payment.shop}`);
      return;
    }

    const shopifyDomain = payment.shop;
    const orderId = payment.shopifyOrderId.replace("gid://shopify/Order/", "");
    const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2025-10";
    const headers = {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": offlineSession.accessToken,
    };

    // 1. Créer une transaction "sale" pour marquer la commande comme payée
    const txUrl = `https://${shopifyDomain}/admin/api/${apiVersion}/orders/${orderId}/transactions.json`;
    const txResponse = await fetch(txUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        transaction: {
          kind: "sale",
          status: "success",
          amount: payment.amount.toFixed(2),
          currency: payment.currency,
          gateway: "momo-gate",
          source: "external",
        },
      }),
    });

    if (!txResponse.ok) {
      const body = await txResponse.text();
      // 422 = transaction already exists / order already paid — acceptable, continue
      if (txResponse.status !== 422) {
        console.error(`[shopify.fulfillOrder] Transaction API error ${txResponse.status}: ${body}`);
      } else {
        console.warn(`[shopify.fulfillOrder] Order ${orderId} already paid, skipping transaction`);
      }
    } else {
      console.log(`[shopify.fulfillOrder] Transaction created for order ${payment.shopifyOrderName}`);
    }

    // 2. Mettre à jour la note et les tags de la commande
    const orderUrl = `https://${shopifyDomain}/admin/api/${apiVersion}/orders/${orderId}.json`;
    const response = await fetch(orderUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        order: {
          id: orderId,
          note: `Paiement Mobile Money confirmé — Moneroo ID: ${monerooId}`,
          tags: "momo-gate-paid",
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[shopify.fulfillOrder] Order update error ${response.status}: ${body}`);
      return;
    }

    console.log(`[shopify.fulfillOrder] Order ${payment.shopifyOrderName} marked as paid for shop ${payment.shop}`);
  },
});
