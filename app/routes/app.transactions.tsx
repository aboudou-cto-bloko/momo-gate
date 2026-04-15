import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Payment = {
  _id: string;
  monerooId: string;
  shopifyOrderId?: string;
  shopifyOrderName?: string;
  amount: number;
  currency: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  checkoutUrl?: string;
  processedAt?: number;
  _creationTime: number;
};

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") ?? "all";

  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  const all: Payment[] = await client.query(api.payments.listByShop, {
    shop: session.shop,
  });

  const payments =
    statusFilter === "all"
      ? all
      : all.filter((p) => {
          if (statusFilter === "pending")
            return p.status === "pending" || p.status === "initiated";
          return p.status === statusFilter;
        });

  return { payments, statusFilter, total: all.length };
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

// ─── Component ────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "success", label: "Réussies" },
  { value: "failed", label: "Échouées" },
];

export default function Transactions() {
  const { payments, statusFilter, total } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  function applyFilter(value: string) {
    setSearchParams(value === "all" ? {} : { status: value });
  }

  return (
    <s-page heading="Transactions">
      {/* ── Filtres ── */}
      <s-section>
        <s-stack direction="inline" gap="tight">
          {FILTERS.map((f) => (
            <s-button
              key={f.value}
              variant={statusFilter === f.value ? "primary" : "tertiary"}
              onClick={() => applyFilter(f.value)}
            >
              {f.label}
            </s-button>
          ))}
        </s-stack>
      </s-section>

      {/* ── Liste ── */}
      <s-section
        heading={
          statusFilter === "all"
            ? `${total} transaction${total !== 1 ? "s" : ""}`
            : `${payments.length} résultat${payments.length !== 1 ? "s" : ""}`
        }
      >
        {payments.length === 0 ? (
          <s-stack direction="block" gap="base">
            <s-paragraph>
              {statusFilter === "all"
                ? "Aucune transaction pour le moment. Les paiements apparaîtront ici dès qu\u2019une commande sera créée."
                : `Aucune transaction avec le statut \u00ab\u00a0${STATUS_LABEL[statusFilter] ?? statusFilter}\u00a0\u00bb.`}
            </s-paragraph>
          </s-stack>
        ) : (
          <s-stack direction="block" gap="tight">
            {payments.map((p) => (
              <s-box
                key={p._id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="default"
              >
                <s-stack direction="inline" gap="base">
                  {/* Commande */}
                  <s-stack direction="block" gap="extraTight">
                    <s-text>
                      <strong>{p.shopifyOrderName ?? "—"}</strong>
                    </s-text>
                    <s-text variant="subdued" style={{ fontSize: "12px" }}>
                      {p.monerooId}
                    </s-text>
                  </s-stack>

                  {/* Client */}
                  <s-stack direction="block" gap="extraTight">
                    <s-text>{p.customerName ?? "—"}</s-text>
                    <s-text variant="subdued">{p.customerEmail ?? ""}</s-text>
                    {p.customerPhone && (
                      <s-text variant="subdued">{p.customerPhone}</s-text>
                    )}
                  </s-stack>

                  {/* Montant */}
                  <s-stack direction="block" gap="extraTight">
                    <s-text>
                      <strong>{formatAmount(p.amount, p.currency)}</strong>
                    </s-text>
                    <s-text variant="subdued">{formatDate(p._creationTime)}</s-text>
                  </s-stack>

                  {/* Statut */}
                  <s-badge tone={STATUS_TONE[p.status] ?? "default"}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </s-badge>

                  {/* Action */}
                  {p.checkoutUrl &&
                    (p.status === "initiated" || p.status === "pending") && (
                      <s-button
                        variant="tertiary"
                        onClick={() => navigator.clipboard.writeText(p.checkoutUrl!)}
                      >
                        Copier le lien de paiement
                      </s-button>
                    )}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
