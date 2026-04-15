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

  const [merchant, monthlyCount] = await Promise.all([
    client.query(api.merchants.get, { shop: session.shop }),
    client.query(api.payments.countByShopThisMonth, { shop: session.shop }),
  ]);

  return {
    shop: session.shop,
    isActive: merchant?.isActive ?? false,
    plan: merchant?.plan ?? null,
    installedAt: merchant?.installedAt ?? null,
    monthlyCount,
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

const COMMISSION_LABELS: Record<string, string> = {
  starter: "5 % par transaction",
  pro: "2,5 % par transaction",
};

const STARTER_LIMIT = 100;

// ─── Payment Methods Data ─────────────────────────────────────────────────────

const CDN = "https://assets.cdn.moneroo.io/icons/circle";

type PaymentMethod = {
  code: string;
  name: string;
  country: string;
  icon: string;
};

const PAYIN_METHODS: PaymentMethod[] = [
  {
    code: "mtn_bj",
    name: "MTN MoMo",
    country: "Bénin",
    icon: `${CDN}/momo.svg`,
  },
  {
    code: "moov_bj",
    name: "Moov Money",
    country: "Bénin",
    icon: `${CDN}/moov_money.svg`,
  },
  {
    code: "moov_ci",
    name: "Moov Money",
    country: "Côte d'Ivoire",
    icon: `${CDN}/moov_money.svg`,
  },
  {
    code: "moov_bf",
    name: "Moov",
    country: "Burkina Faso",
    icon: `${CDN}/moov_money.svg`,
  },
  {
    code: "moov_ml",
    name: "Moov Money",
    country: "Mali",
    icon: `${CDN}/moov_money.svg`,
  },
  {
    code: "moov_tg",
    name: "Moov Money",
    country: "Togo",
    icon: `${CDN}/moov_money.svg`,
  },
  {
    code: "orange_ci",
    name: "Orange Money",
    country: "Côte d'Ivoire",
    icon: `${CDN}/orange_money.svg`,
  },
  {
    code: "orange_bf",
    name: "Orange Money",
    country: "Burkina Faso",
    icon: `${CDN}/orange_money.svg`,
  },
  {
    code: "orange_ml",
    name: "Orange Money",
    country: "Mali",
    icon: `${CDN}/orange_money.svg`,
  },
  {
    code: "orange_sn",
    name: "Orange Money",
    country: "Sénégal",
    icon: `${CDN}/orange_money.svg`,
  },
  {
    code: "wave_ci",
    name: "Wave",
    country: "Côte d'Ivoire",
    icon: `${CDN}/wave.svg`,
  },
  {
    code: "wave_sn",
    name: "Wave",
    country: "Sénégal",
    icon: `${CDN}/wave.svg`,
  },
  {
    code: "togocel",
    name: "Togocel",
    country: "Togo",
    icon: `${CDN}/togocel.svg`,
  },
  {
    code: "e_money_sn",
    name: "E-Money",
    country: "Sénégal",
    icon: `${CDN}/e_money_sn.svg`,
  },
  {
    code: "freemoney_sn",
    name: "Free Money",
    country: "Sénégal",
    icon: `${CDN}/freemoney_sn.svg`,
  },
  {
    code: "wizall_sn",
    name: "Wizall",
    country: "Sénégal",
    icon: `${CDN}/wizall_sn.svg`,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Settings() {
  const { shop, isActive, plan, installedAt, monthlyCount } =
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
        </s-stack>
      </s-section>

      {/* ── Abonnement & Commission ── */}
      <s-section heading="Abonnement &amp; Commissions">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            <s-text>Plan actuel</s-text>
            {plan ? (
              <s-badge tone="info">{PLAN_LABELS[plan] ?? plan}</s-badge>
            ) : (
              <s-stack direction="inline" gap="small">
                <s-badge tone="warning">Aucun plan actif</s-badge>
                <s-link href="/app/billing">Choisir un plan</s-link>
              </s-stack>
            )}
          </s-stack>

          {plan && (
            <s-stack direction="inline" gap="base">
              <s-text>Commission appliquée</s-text>
              <s-text>
                <strong>{COMMISSION_LABELS[plan] ?? "—"}</strong>
              </s-text>
            </s-stack>
          )}

          {plan === "starter" && (
            <s-stack direction="block" gap="small">
              <s-stack direction="inline" gap="base">
                <s-text>Transactions ce mois</s-text>
                <s-text>
                  <strong>
                    {monthlyCount} / {STARTER_LIMIT}
                  </strong>
                </s-text>
                {monthlyCount >= STARTER_LIMIT * 0.9 && (
                  <s-badge tone="warning">Limite presque atteinte</s-badge>
                )}
              </s-stack>
              <s-paragraph>
                <s-text color="subdued">
                  Le plan Starter est limité à {STARTER_LIMIT} transactions par
                  mois. <s-link href="/app/billing">Passez au plan Pro</s-link>{" "}
                  pour des transactions illimitées et une commission réduite à
                  2,5 %.
                </s-text>
              </s-paragraph>
            </s-stack>
          )}
        </s-stack>
      </s-section>

      {/* ── Moyens de paiement ── */}
      <s-section heading="Moyens de Paiement Acceptés">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <s-text color="subdued">
              16 méthodes disponibles dans 7 pays d&apos;Afrique de
              l&apos;Ouest. Les méthodes actives dépendent du pays de votre
              acheteur.
            </s-text>
          </s-paragraph>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "8px",
            }}
          >
            {PAYIN_METHODS.map((m) => (
              <div
                key={m.code}
                style={{
                  border: "1px solid #E1E3E5",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  background: "#FFFFFF",
                }}
              >
                <img
                  src={m.icon}
                  alt={m.name}
                  width={40}
                  height={40}
                  style={{ borderRadius: "50%" }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "12px",
                    textAlign: "center",
                    color: "#202223",
                  }}
                >
                  {m.name}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#6D7175",
                    textAlign: "center",
                  }}
                >
                  {m.country}
                </span>
              </div>
            ))}
          </div>
        </s-stack>
      </s-section>

      {/* ── Aide ── */}
      <s-section slot="aside" heading="Aide &amp; Support">
        <s-stack direction="block" gap="small">
          <s-paragraph>
            Besoin d&apos;aide ?{" "}
            <s-link href="mailto:aboudouzinsou@yahoo.com">
              Contactez notre support
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
