import {
  extension,
  BlockStack,
  Text,
  Link,
  SkeletonText,
} from "@shopify/ui-extensions/checkout";

const APP_URL = "https://momo-gate-one.vercel.app";
const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;
const FETCH_TIMEOUT_MS = 3000;

export default extension("purchase.thank-you.block.render", (root, api) => {
  const order = api.order;
  const shop = api.shop;

  // ── UI nodes ────────────────────────────────────────────────────────────────

  const skeleton = root.createComponent(BlockStack, { spacing: "tight" });
  skeleton.appendChild(root.createComponent(SkeletonText, { size: "medium" }));
  skeleton.appendChild(root.createComponent(SkeletonText, { size: "small" }));

  // Start in loading state
  root.appendChild(skeleton);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function showReady(checkoutUrl: string) {
    root.removeChild(skeleton);

    const stack = root.createComponent(BlockStack, { spacing: "tight" });

    const title = root.createComponent(Text, { emphasis: "bold" });
    title.appendChild(root.createText("Finalisez votre paiement Mobile Money"));

    const sub = root.createComponent(Text, {
      size: "small",
      appearance: "subdued",
    });
    sub.appendChild(
      root.createText(
        "Votre commande est réservée. Complétez le paiement par MTN MoMo, Orange Money, Wave ou Moov Money pour la confirmer définitivement.",
      ),
    );

    const link = root.createComponent(Link, {
      to: checkoutUrl,
      external: true,
    });
    link.appendChild(root.createText("Payer maintenant →"));

    stack.appendChild(title);
    stack.appendChild(sub);
    stack.appendChild(link);
    root.appendChild(stack);
  }

  function hide() {
    try {
      root.removeChild(skeleton);
    } catch {
      // already removed
    }
  }

  // ── Polling ─────────────────────────────────────────────────────────────────

  async function poll(orderId: string, shopDomain: string, attempt: number) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(
        `${APP_URL}/api/payment-url` +
          `?order=${encodeURIComponent(orderId)}` +
          `&shop=${encodeURIComponent(shopDomain)}`,
        { signal: controller.signal },
      );
      clearTimeout(timer);

      if (res.status === 202) {
        retry(orderId, shopDomain, attempt);
        return;
      }

      if (!res.ok) {
        hide();
        return;
      }

      const data = (await res.json()) as {
        ready?: boolean;
        status?: string;
        checkoutUrl?: string;
      };

      if (data.status === "success" || data.status === "failed" || data.status === "cancelled") {
        hide();
        return;
      }

      if (data.ready && data.checkoutUrl) {
        showReady(data.checkoutUrl);
        return;
      }

      retry(orderId, shopDomain, attempt);
    } catch {
      retry(orderId, shopDomain, attempt);
    }
  }

  function retry(orderId: string, shopDomain: string, attempt: number) {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => poll(orderId, shopDomain, attempt + 1), POLL_INTERVAL_MS);
    } else {
      hide();
    }
  }

  // ── Start ────────────────────────────────────────────────────────────────────

  const orderId = order?.current?.id;
  const shopDomain = shop?.myshopifyDomain?.current;

  if (orderId && shopDomain) {
    poll(orderId, shopDomain, 0);
  } else {
    hide();
  }
});
