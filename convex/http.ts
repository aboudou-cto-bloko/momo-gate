import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Webhook Moneroo → délègue à une action Node (pour node:crypto / vérification HMAC).
 * URL à configurer dans le dashboard Moneroo :
 *   https://<CONVEX_SITE_URL>/moneroo/webhook
 */
http.route({
  path: "/moneroo/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Moneroo-Signature") ?? "";

    const result = await ctx.runAction(internal.webhook_moneroo.handleMonerooWebhook, {
      rawBody,
      signature,
    });
    return new Response(result.body, { status: result.status });
  }),
});

export default http;
