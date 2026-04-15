import type { LoaderFunctionArgs } from "react-router";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Route publique — appelée par l'extension checkout UI depuis le navigateur du client.
// Retourne l'URL de paiement Moneroo pour une commande donnée.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("order"); // ex: "gid://shopify/Order/123"
  const shop = url.searchParams.get("shop");      // ex: "store.myshopify.com"

  if (!orderId || !shop) {
    return Response.json(
      { error: "Missing params" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  const payment = await client.query(api.payments.getByOrderId, {
    shopifyOrderId: orderId,
  });

  if (!payment) {
    // Webhook pas encore traité — le client peut réessayer
    return Response.json({ ready: false }, { status: 202, headers: CORS_HEADERS });
  }

  // Paiement déjà finalisé
  if (payment.status === "success") {
    return Response.json(
      { ready: true, status: "success" },
      { headers: CORS_HEADERS },
    );
  }

  // Paiement échoué ou annulé — inutile de rediriger
  if (payment.status === "failed" || payment.status === "cancelled") {
    return Response.json(
      { ready: true, status: payment.status },
      { headers: CORS_HEADERS },
    );
  }

  // Paiement initié ou en attente — retourner l'URL de checkout
  return Response.json(
    {
      ready: !!payment.checkoutUrl,
      status: payment.status,
      checkoutUrl: payment.checkoutUrl ?? null,
    },
    { headers: CORS_HEADERS },
  );
};
