import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

interface ShopifyCustomer {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface ShopifyAddress {
  first_name?: string;
  last_name?: string;
}

interface ShopifyOrder {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  total_price: string;
  currency: string;
  order_status_url?: string;
  customer?: ShopifyCustomer;
  billing_address?: ShopifyAddress;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.log(`[webhook] ${topic} for ${shop}`);

  const order = payload as ShopifyOrder;

  const customer = {
    email: order.email || order.customer?.email || `order-${order.id}@${shop}`,
    firstName:
      order.billing_address?.first_name ||
      order.customer?.first_name ||
      "Client",
    lastName:
      order.billing_address?.last_name || order.customer?.last_name || "",
    phone: order.phone || order.customer?.phone || undefined,
  };

  // XOF et la plupart des devises africaines sont des entiers (pas de centimes)
  const amount = Math.round(parseFloat(order.total_price));

  const returnUrl =
    order.order_status_url ||
    `${process.env.SHOPIFY_APP_URL}/payment-status?shop=${encodeURIComponent(shop)}&order=${encodeURIComponent(order.name)}`;

  try {
    const client = new ConvexHttpClient(process.env.CONVEX_URL!);

    const result = await client.action(api.payments_actions.initializePayment, {
      shop,
      shopifyOrderId: `gid://shopify/Order/${order.id}`,
      shopifyOrderName: order.name,
      amount,
      currency: order.currency,
      description: `Commande ${order.name}`,
      returnUrl,
      customer,
    });

    console.log(
      `[orders/create] Payment initialized — ID: ${result.monerooId}`,
    );
  } catch (err) {
    console.error(
      `[orders/create] Failed to initialize payment for ${order.name}:`,
      err,
    );
  }

  return new Response();
};
