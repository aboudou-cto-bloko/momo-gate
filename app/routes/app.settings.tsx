import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);

  const merchant = await client.query(api.merchants.get, {
    shop: session.shop,
  });

  const convexSiteUrl = process.env.VITE_CONVEX_SITE_URL ?? "";
  const webhookUrl = convexSiteUrl
    ? `${convexSiteUrl}/moneroo/webhook`
    : "Non configuré";

  return {
    shop: session.shop,
    isActive: merchant?.isActive ?? false,
    plan: merchant?.plan ?? null,
    installedAt: merchant?.installedAt ?? null,
    webhookUrl,
    monerooConfigured: !!process.env.MONEROO_SECRET_KEY,
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter — 5 000 XOF/mois",
  pro: "Pro — 15 000 XOF/mois",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Settings() {
  const { shop, isActive, plan, installedAt, webhookUrl, monerooConfigured } =
    useLoaderData<typeof loader>();

  return (
    <s-page heading="Paramètres">
      {/* ── Statut de l'application ── */}
      <s-section heading="Statut de l'Application">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            <s-text>Boutique</s-text>
            <s-text>
              <strong>{shop}</strong>
            </s-text>
          </s-stack>

          <s-stack direction="inline" gap="base">
            <s-text>Statut</s-text>
            <s-badge tone={isActive ? "success" : "critical"}>
              {isActive ? "Actif" : "Inactif"}
            </s-badge>
          </s-stack>

          {installedAt && (
            <s-stack direction="inline" gap="base">
              <s-text>Installé le</s-text>
              <s-text>{formatDate(installedAt)}</s-text>
            </s-stack>
          )}

          <s-stack direction="inline" gap="base">
            <s-text>Plan actuel</s-text>
            {plan ? (
              <s-badge tone="info">{PLAN_LABELS[plan] ?? plan}</s-badge>
            ) : (
              <s-stack direction="inline" gap="tight">
                <s-badge tone="warning">Aucun plan actif</s-badge>
                <s-link href="/app/billing">Choisir un plan</s-link>
              </s-stack>
            )}
          </s-stack>
        </s-stack>
      </s-section>

      {/* ── Intégration Moneroo ── */}
      <s-section heading="Intégration Moneroo">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            <s-text>Clé API</s-text>
            <s-badge tone={monerooConfigured ? "success" : "critical"}>
              {monerooConfigured ? "Configurée" : "Manquante"}
            </s-badge>
          </s-stack>

          <s-stack direction="block" gap="tight">
            <s-text>URL du Webhook Moneroo</s-text>
            <s-paragraph>
              Configurez cette URL dans votre{" "}
              <s-link
                href="https://app.moneroo.io/developers/webhooks"
                target="_blank"
              >
                dashboard Moneroo
              </s-link>{" "}
              pour recevoir les notifications de paiement.
            </s-paragraph>
            <s-box
              padding="tight"
              borderWidth="base"
              borderRadius="base"
              background="subdued"
            >
              <s-stack direction="inline" gap="base">
                <s-text style={{ fontFamily: "monospace", fontSize: "13px" }}>
                  {webhookUrl}
                </s-text>
                <s-button
                  variant="tertiary"
                  aria-label="Copier l'URL du webhook"
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                >
                  Copier
                </s-button>
              </s-stack>
            </s-box>
          </s-stack>

          <s-paragraph>
            <s-text variant="subdued">
              Les paiements Mobile Money (MTN, Orange, Wave) sont traités via
              Moneroo. Vos clients n'ont pas besoin de créer un compte Moneroo.
            </s-text>
          </s-paragraph>
        </s-stack>
      </s-section>

      {/* ── Moyens de paiement supportés ── */}
      <s-section slot="aside" heading="Moyens de Paiement">
        <s-unordered-list>
          <s-list-item>MTN Mobile Money (Bénin, Côte d'Ivoire, Ghana)</s-list-item>
          <s-list-item>Orange Money (Côte d'Ivoire, Sénégal, Burkina Faso)</s-list-item>
          <s-list-item>Wave (Sénégal, Côte d'Ivoire)</s-list-item>
          <s-list-item>Moov Money (Bénin, Côte d'Ivoire, Togo)</s-list-item>
        </s-unordered-list>
      </s-section>

      {/* ── Aide ── */}
      <s-section slot="aside" heading="Aide &amp; Support">
        <s-stack direction="block" gap="tight">
          <s-paragraph>
            <s-link
              href="https://docs.moneroo.io"
              target="_blank"
            >
              Documentation Moneroo
            </s-link>
          </s-paragraph>
          <s-paragraph>
            <s-link
              href="https://dashboard.convex.dev"
              target="_blank"
            >
              Dashboard Convex (logs &amp; data)
            </s-link>
          </s-paragraph>
          <s-paragraph>
            <s-link
              href="https://github.com/aboudou-cto-bloko/momo-gate"
              target="_blank"
            >
              Code source sur GitHub
            </s-link>
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
