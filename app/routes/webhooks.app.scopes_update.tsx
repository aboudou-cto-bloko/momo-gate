import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current as string[];
  if (session) {
    const client = new ConvexHttpClient(process.env.CONVEX_URL!);
    await client.mutation(api.sessions.store, {
      shopifyId: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: current.toString(),
      accessToken: session.accessToken ?? "",
      accountOwner: false,
    });
  }

  return new Response();
};
