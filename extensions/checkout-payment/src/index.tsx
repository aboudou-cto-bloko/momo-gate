import {
  reactExtension,
  useOrder,
  useShop,
  BlockStack,
  Text,
  Link,
  SkeletonText,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect, useCallback } from "react";

const APP_URL = "https://momo-gate-one.vercel.app";
const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 2000;
const FETCH_TIMEOUT_MS = 3000;

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiResponse = {
  ready: boolean;
  status?: string;
  checkoutUrl?: string;
};

type Phase =
  | { name: "loading" }
  | { name: "ready"; checkoutUrl: string }
  | { name: "paid" }
  | { name: "hidden" };

// ─── Extension exports ────────────────────────────────────────────────────────

export default reactExtension(
  "purchase.thank-you.block.render",
  () => <PaymentExtension />,
);

// ─── Component ───────────────────────────────────────────────────────────────

function PaymentExtension() {
  const order = useOrder();
  const shop = useShop();
  const [phase, setPhase] = useState<Phase>({ name: "loading" });

  const fetchPaymentUrl = useCallback(
    async (orderId: string, shopDomain: string, attempt: number) => {
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
          scheduleRetry(orderId, shopDomain, attempt);
          return;
        }

        if (!res.ok) {
          setPhase({ name: "hidden" });
          return;
        }

        const data = (await res.json()) as ApiResponse;

        if (data.status === "success") {
          setPhase({ name: "paid" });
          return;
        }

        if (data.status === "failed" || data.status === "cancelled") {
          setPhase({ name: "hidden" });
          return;
        }

        if (data.ready && data.checkoutUrl) {
          setPhase({ name: "ready", checkoutUrl: data.checkoutUrl });
          return;
        }

        scheduleRetry(orderId, shopDomain, attempt);
      } catch {
        scheduleRetry(orderId, shopDomain, attempt);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function scheduleRetry(orderId: string, shopDomain: string, attempt: number) {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(
        () => fetchPaymentUrl(orderId, shopDomain, attempt + 1),
        POLL_INTERVAL_MS,
      );
    } else {
      setPhase({ name: "hidden" });
    }
  }

  useEffect(() => {
    const orderId = order?.id;
    const shopDomain = shop?.myshopifyDomain;
    if (!orderId || !shopDomain) return;

    fetchPaymentUrl(orderId, shopDomain, 0);
  }, [order?.id, shop?.myshopifyDomain, fetchPaymentUrl]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (phase.name === "hidden" || phase.name === "paid") {
    return null;
  }

  if (phase.name === "loading") {
    return (
      <BlockStack spacing="tight">
        <SkeletonText size="medium" />
        <SkeletonText size="small" />
      </BlockStack>
    );
  }

  // phase.name === "ready"
  return (
    <BlockStack spacing="tight">
      <Text emphasis="bold">Finalisez votre paiement Mobile Money</Text>
      <Text size="small" appearance="subdued">
        Votre commande est réservée. Complétez le paiement par MTN MoMo,
        Orange Money, Wave ou Moov Money pour la confirmer définitivement.
      </Text>
      <Link to={phase.checkoutUrl} external>
        Payer maintenant →
      </Link>
    </BlockStack>
  );
}
