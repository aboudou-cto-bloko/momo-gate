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

    // Appel Admin API Shopify pour ajouter une note de commande
    const shopifyDomain = payment.shop;
    const orderId = payment.shopifyOrderId.replace("gid://shopify/Order/", "");
    const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2025-10";

    const url = `https://${shopifyDomain}/admin/api/${apiVersion}/orders/${orderId}.json`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": offlineSession.accessToken,
      },
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
      console.error(`[shopify.fulfillOrder] Shopify API error ${response.status}: ${body}`);
      return;
    }

    console.log(`[shopify.fulfillOrder] Order ${payment.shopifyOrderName} updated for shop ${payment.shop}`);
  },
});
