import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// ─── Plans ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Starter" as const,
    label: "Starter",
    price: "8 USD / mois",
    priceLocal: "≈ 5 000 XOF",
    commission: "5 % par transaction",
    limit: "100 transactions / mois",
    features: [
      "MTN MoMo, Moov, Orange, Wave…",
      "Dashboard transactions",
      "Reversement automatique",
    ],
  },
  {
    name: "Pro" as const,
    label: "Pro",
    price: "25 USD / mois",
    priceLocal: "≈ 15 000 XOF",
    commission: "2,5 % par transaction",
    limit: "Transactions illimitées",
    features: [
      "Tout Starter inclus",
      "Commission réduite de moitié",
      "Support prioritaire",
    ],
  },
];

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);

  // Vérifier le statut d'abonnement actuel
  const { hasActivePayment, appSubscriptions } = await billing.check({
    plans: ["Starter", "Pro"],
    isTest: true,
  });

  // Synchroniser le plan dans Convex si une subscription active est détectée
  if (hasActivePayment && appSubscriptions.length > 0) {
    const sub = appSubscriptions[0];
    const planName = sub.name.toLowerCase() as "starter" | "pro";
    const client = new ConvexHttpClient(process.env.CONVEX_URL!);
    await client.mutation(api.merchants.setPlan, {
      shop: session.shop,
      plan: planName,
      billingId: sub.id,
    });
  }

  const currentPlan = hasActivePayment && appSubscriptions.length > 0
    ? appSubscriptions[0].name.toLowerCase()
    : null;

  return {
    shop: session.shop,
    currentPlan,
    subscriptionId: appSubscriptions[0]?.id ?? null,
  };
};

// ─── Action ───────────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const planName = formData.get("plan") as string;

  if (intent === "subscribe") {
    const confirmationUrl = await billing.request({
      plan: planName as "Starter" | "Pro",
      isTest: true,
      returnUrl: `${process.env.SHOPIFY_APP_URL}/app/billing`,
    });
    return redirect(confirmationUrl);
  }

  if (intent === "cancel") {
    const subscriptionId = formData.get("subscriptionId") as string;
    if (subscriptionId) {
      await billing.cancel({ subscriptionId, isTest: true, prorate: true });
    }
    return redirect("/app/billing");
  }

  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Billing() {
  const { currentPlan, subscriptionId } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  function subscribe(plan: "Starter" | "Pro") {
    submit({ intent: "subscribe", plan }, { method: "POST" });
  }

  function cancel() {
    if (!subscriptionId) return;
    submit({ intent: "cancel", subscriptionId }, { method: "POST" });
  }

  return (
    <s-page heading="Abonnement">
      <s-section heading="Choisissez votre plan">
        <s-stack direction="inline" gap="base">
          {PLANS.map((plan) => {
            const isActive = currentPlan === plan.name.toLowerCase();
            return (
              <s-box
                key={plan.name}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background={isActive ? "subdued" : "base"}
              >
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline" gap="small">
                    <s-heading>{plan.label}</s-heading>
                    {isActive && <s-badge tone="success">Actif</s-badge>}
                  </s-stack>

                  <s-stack direction="block" gap="small-100">
                    <s-text>
                      <strong>{plan.price}</strong>
                    </s-text>
                    <s-text color="subdued">{plan.priceLocal}</s-text>
                  </s-stack>

                  <s-stack direction="block" gap="small-100">
                    <s-badge tone="info">{plan.commission}</s-badge>
                    <s-text color="subdued">{plan.limit}</s-text>
                  </s-stack>

                  <s-stack direction="block" gap="small-100">
                    {plan.features.map((f) => (
                      <s-text key={f} color="subdued">
                        ✓ {f}
                      </s-text>
                    ))}
                  </s-stack>

                  {isActive ? (
                    <s-button
                      variant="tertiary"
                      disabled={isSubmitting}
                      onClick={() => cancel()}
                    >
                      Résilier
                    </s-button>
                  ) : (
                    <s-button
                      variant="primary"
                      disabled={isSubmitting}
                      onClick={() => subscribe(plan.name)}
                    >
                      {currentPlan ? "Changer de plan" : "Choisir ce plan"}
                    </s-button>
                  )}
                </s-stack>
              </s-box>
            );
          })}
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Comment ça fonctionne">
        <s-stack direction="block" gap="small">
          <s-paragraph>
            <s-text color="subdued">
              L'abonnement est facturé via Shopify. Vous pouvez changer de plan
              ou résilier à tout moment depuis cette page.
            </s-text>
          </s-paragraph>
          <s-paragraph>
            <s-text color="subdued">
              La commission est prélevée automatiquement à chaque transaction.
              Le montant net vous est reversé sur votre numéro Mobile Money
              configuré dans les{" "}
              <s-link href="/app/settings">paramètres</s-link>.
            </s-text>
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
