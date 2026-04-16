import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const client = new ConvexHttpClient(process.env.CONVEX_URL!);

  // Supprimer les sessions OAuth
  if (session) {
    const sessions = await client.query(api.sessions.getByShop, { shop });
    const ids = sessions.map((s: { shopifyId: string }) => s.shopifyId);
    if (ids.length > 0) {
      await client.mutation(api.sessions.deleteMany, { shopifyIds: ids });
    }
  }

  // Marquer le marchand comme inactif
  await client.mutation(api.merchants.uninstall, { shop });

  return new Response();
};
