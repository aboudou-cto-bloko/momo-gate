import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Payment = {
  _id: string;
  monerooId: string;
  shopifyOrderName?: string;
  amount: number;
  currency: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  checkoutUrl?: string;
  _creationTime: number;
};

type Stats = {
  total: number;
  successful: number;
  pending: number;
  failed: number;
  revenue: number;
  currency: string;
};

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);

  const payments: Payment[] = await client.query(api.payments.listByShop, {
    shop: session.shop,
  });

  const successful = payments.filter((p) => p.status === "success");
  const pending = payments.filter(
    (p) => p.status === "pending" || p.status === "initiated",
  );
  const failed = payments.filter(
    (p) => p.status === "failed" || p.status === "cancelled",
  );

  const stats: Stats = {
    total: payments.length,
    successful: successful.length,
    pending: pending.length,
    failed: failed.length,
    revenue: successful.reduce((sum, p) => sum + p.amount, 0),
    currency: payments[0]?.currency ?? "XOF",
  };

  const recent = payments.slice(0, 5);

  return { stats, recent };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  success: "Réussi",
  pending: "En attente",
  initiated: "Initié",
  failed: "Échoué",
  cancelled: "Annulé",
};

const STATUS_TONE: Record<string, string> = {
  success: "success",
  pending: "attention",
  initiated: "info",
  failed: "critical",
  cancelled: "warning",
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { stats, recent } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Tableau de Bord">
      {/* ── Stats ── */}
      <s-section heading="Vue d'ensemble">
        <s-stack direction="inline" gap="base">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="tight">
              <s-text variant="subdued">Total</s-text>
              <s-heading>{stats.total}</s-heading>
              <s-text variant="subdued">transactions</s-text>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="tight">
              <s-text variant="subdued">Réussies</s-text>
              <s-heading>{stats.successful}</s-heading>
              <s-badge tone="success">Payées</s-badge>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="tight">
              <s-text variant="subdued">En attente</s-text>
              <s-heading>{stats.pending}</s-heading>
              <s-badge tone="attention">À payer</s-badge>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="tight">
              <s-text variant="subdued">Revenus</s-text>
              <s-heading>
                {formatAmount(stats.revenue, stats.currency)}
              </s-heading>
              <s-text variant="subdued">paiements réussis</s-text>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      {/* ── Transactions récentes ── */}
      <s-section heading="5 Dernières Transactions">
        {recent.length === 0 ? (
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Aucune transaction pour le moment. Les paiements Mobile Money
              apparaîtront ici dès qu'une commande sera créée dans votre
              boutique.
            </s-paragraph>
            <s-button
              variant="primary"
              onClick={() => window.open("https://help.shopify.com/fr/manual/orders/create-orders", "_blank")}
            >
              Créer une commande test
            </s-button>
          </s-stack>
        ) : (
          <s-stack direction="block" gap="tight">
            {recent.map((p) => (
              <s-box
                key={p._id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="default"
              >
                <s-stack direction="inline" gap="base">
                  <s-stack direction="block" gap="extraTight">
                    <s-text>
                      <strong>{p.shopifyOrderName ?? p.monerooId}</strong>
                    </s-text>
                    <s-text variant="subdued">
                      {p.customerName ?? p.customerEmail ?? "—"}
                    </s-text>
                  </s-stack>

                  <s-stack direction="block" gap="extraTight">
                    <s-text>
                      <strong>{formatAmount(p.amount, p.currency)}</strong>
                    </s-text>
                    <s-text variant="subdued">{formatDate(p._creationTime)}</s-text>
                  </s-stack>

                  <s-badge tone={STATUS_TONE[p.status] ?? "default"}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </s-badge>

                  {p.checkoutUrl && p.status === "initiated" && (
                    <s-button
                      variant="tertiary"
                      onClick={() => navigator.clipboard.writeText(p.checkoutUrl!)}
                    >
                      Copier lien
                    </s-button>
                  )}
                </s-stack>
              </s-box>
            ))}

            <s-stack direction="inline" gap="base">
              <s-link href="/app/transactions">
                Voir toutes les transactions →
              </s-link>
            </s-stack>
          </s-stack>
        )}
      </s-section>

      {/* ── Aside ── */}
      <s-section slot="aside" heading="Flux de paiement">
        <s-stack direction="block" gap="tight">
          <s-paragraph>
            <s-badge tone="info">1</s-badge>{" "}
            <s-text>Commande créée sur Shopify</s-text>
          </s-paragraph>
          <s-paragraph>
            <s-badge tone="info">2</s-badge>{" "}
            <s-text>Lien Mobile Money généré via Moneroo</s-text>
          </s-paragraph>
          <s-paragraph>
            <s-badge tone="info">3</s-badge>{" "}
            <s-text>Client paie (MTN, Orange, Wave…)</s-text>
          </s-paragraph>
          <s-paragraph>
            <s-badge tone="success">4</s-badge>{" "}
            <s-text>Commande mise à jour automatiquement</s-text>
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Liens utiles">
        <s-unordered-list>
          <s-list-item>
            <s-link href="/app/transactions">Toutes les transactions</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/settings">Paramètres de l'app</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="https://dashboard.convex.dev" target="_blank">
              Dashboard Convex
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
