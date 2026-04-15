import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // Le webhook peut déclencher plusieurs fois ou après désinstallation.
  // Si la session a déjà été supprimée, on ignore.
  if (session) {
    const client = new ConvexHttpClient(process.env.CONVEX_URL!);
    const sessions = await client.query(api.sessions.getByShop, { shop });
    const ids = sessions.map((s: { shopifyId: string }) => s.shopifyId);
    if (ids.length > 0) {
      await client.mutation(api.sessions.deleteMany, { shopifyIds: ids });
    }
  }

  return new Response();
};
