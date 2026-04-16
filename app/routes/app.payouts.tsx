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
  const payouts = await client.query(api.payouts.listByShop, {
    shop: session.shop,
  });
  return { payouts };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

type StatusTone = "success" | "info" | "critical" | "warning" | "neutral";

const STATUS_TONE: Record<string, StatusTone> = {
  success: "success",
  pending: "info",
  failed: "critical",
};

const STATUS_LABEL: Record<string, string> = {
  success: "Reversé",
  pending: "En cours",
  failed: "Échoué",
};

const METHOD_LABEL: Record<string, string> = {
  mtn_bj: "MTN MoMo BJ",
  moov_bj: "Moov BJ",
  mtn_ci: "MTN CI",
  moov_ci: "Moov CI",
  orange_ci: "Orange CI",
  wave_ci: "Wave CI",
  orange_bf: "Orange BF",
  moov_bf: "Moov BF",
  orange_ml: "Orange ML",
  moov_ml: "Moov ML",
  orange_sn: "Orange SN",
  wave_sn: "Wave SN",
  moov_tg: "Moov TG",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Payouts() {
  const { payouts } = useLoaderData<typeof loader>();

  const totalSuccess = payouts
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  const currency = payouts[0]?.currency ?? "XOF";

  return (
    <s-page heading="Reversements">
      {/* ── Résumé ── */}
      <s-section heading="Résumé">
        <s-stack direction="inline" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
            <s-stack direction="block" gap="small-100">
              <s-text color="subdued">Total reversé</s-text>
              <s-text>
                <strong>{formatAmount(totalSuccess, currency)}</strong>
              </s-text>
            </s-stack>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
            <s-stack direction="block" gap="small-100">
              <s-text color="subdued">Reversements</s-text>
              <s-text>
                <strong>{payouts.filter((p) => p.status === "success").length}</strong>
              </s-text>
            </s-stack>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
            <s-stack direction="block" gap="small-100">
              <s-text color="subdued">En attente</s-text>
              <s-text>
                <strong>{payouts.filter((p) => p.status === "pending").length}</strong>
              </s-text>
            </s-stack>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
            <s-stack direction="block" gap="small-100">
              <s-text color="subdued">Échoués</s-text>
              <s-text>
                <strong>{payouts.filter((p) => p.status === "failed").length}</strong>
              </s-text>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      {/* ── Liste ── */}
      <s-section heading="Historique">
        {payouts.length === 0 ? (
          <s-paragraph>
            <s-text color="subdued">
              Aucun reversement pour l&apos;instant. Les reversements apparaissent
              automatiquement après chaque paiement confirmé.
            </s-text>
          </s-paragraph>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #E1E3E5",
                    textAlign: "left",
                  }}
                >
                  {["Date", "Montant", "Méthode", "Numéro", "Statut", "ID Moneroo"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 12px",
                          fontWeight: 600,
                          color: "#6D7175",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr
                    key={payout._id}
                    style={{ borderBottom: "1px solid #F1F2F3" }}
                  >
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "#6D7175" }}>
                      {payout.processedAt
                        ? formatDate(payout.processedAt)
                        : formatDate(payout._creationTime)}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontWeight: 600 }}>
                      {formatAmount(payout.amount, payout.currency)}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {METHOD_LABEL[payout.recipientMethod] ?? payout.recipientMethod}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6D7175" }}>
                      {payout.recipientPhone}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <s-badge tone={STATUS_TONE[payout.status] ?? "neutral"}>
                        {STATUS_LABEL[payout.status] ?? payout.status}
                      </s-badge>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#6D7175",
                      }}
                    >
                      {payout.monerooPayoutId ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </s-section>

      {/* ── Aside ── */}
      <s-section slot="aside" heading="Comment ça fonctionne">
        <s-stack direction="block" gap="small">
          <s-paragraph>
            <s-text color="subdued">
              Après chaque paiement Mobile Money confirmé, momo-gate envoie
              automatiquement le montant net (après commission) sur votre numéro
              configuré dans les{" "}
              <s-link href="/app/settings">paramètres</s-link>.
            </s-text>
          </s-paragraph>
          <s-paragraph>
            <s-text color="subdued">
              Un reversement <s-badge tone="info">En cours</s-badge> peut prendre
              quelques minutes selon l&apos;opérateur mobile money.
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
