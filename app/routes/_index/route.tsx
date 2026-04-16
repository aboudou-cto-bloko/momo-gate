import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import s from "./styles.module.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous" as const,
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const CDN = "https://assets.cdn.moneroo.io/icons/circle";
const METHODS = [
  { name: "MTN MoMo", country: "Bénin", icon: `${CDN}/momo.svg` },
  { name: "Moov Money", country: "Bénin", icon: `${CDN}/moov_money.svg` },
  { name: "Orange Money", country: "Côte d'Ivoire", icon: `${CDN}/orange_money.svg` },
  { name: "Wave", country: "Sénégal", icon: `${CDN}/wave.svg` },
  { name: "MTN MoMo", country: "Côte d'Ivoire", icon: `${CDN}/momo.svg` },
  { name: "Orange Money", country: "Sénégal", icon: `${CDN}/orange_money.svg` },
  { name: "Moov Money", country: "Mali", icon: `${CDN}/moov_money.svg` },
  { name: "Togocel", country: "Togo", icon: `${CDN}/togocel.svg` },
  { name: "Wave", country: "Côte d'Ivoire", icon: `${CDN}/wave.svg` },
  { name: "Orange Money", country: "Burkina Faso", icon: `${CDN}/orange_money.svg` },
  { name: "E-Money", country: "Sénégal", icon: `${CDN}/e_money_sn.svg` },
  { name: "Free Money", country: "Sénégal", icon: `${CDN}/freemoney_sn.svg` },
  { name: "Wizall", country: "Sénégal", icon: `${CDN}/wizall_sn.svg` },
  { name: "Moov Money", country: "Togo", icon: `${CDN}/moov_money.svg` },
  { name: "Moov Money", country: "Burkina Faso", icon: `${CDN}/moov_money.svg` },
  { name: "Orange Money", country: "Mali", icon: `${CDN}/orange_money.svg` },
];

const STEPS = [
  {
    n: "01",
    title: "Le client passe commande",
    text: "Il finalise son panier sur votre boutique Shopify, comme d'habitude.",
  },
  {
    n: "02",
    title: "Le lien Mobile Money apparaît",
    text: 'Sur la page de confirmation, un bouton "Payer maintenant" s\'affiche instantanément via l\'extension Shopify.',
  },
  {
    n: "03",
    title: "Le client paie en 30 secondes",
    text: "Il entre son numéro et valide sur son téléphone. Aucune application ni compte bancaire requis.",
  },
  {
    n: "04",
    title: "Commande confirmée & reversement",
    text: "Shopify marque la commande comme payée. Le montant net vous est versé automatiquement sur votre mobile money.",
  },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Zéro friction pour le client",
    text: "Le lien de paiement s'affiche directement sur la page de confirmation. Pas de redirection tierce.",
  },
  {
    icon: "🔁",
    title: "Reversement automatique",
    text: "Après chaque paiement confirmé, le montant net (après commission) vous est versé sur votre numéro Mobile Money.",
  },
  {
    icon: "📊",
    title: "Dashboard en temps réel",
    text: "Suivez toutes vos transactions et reversements depuis votre admin Shopify. Statuts mis à jour instantanément.",
  },
  {
    icon: "🛡️",
    title: "Sécurisé de bout en bout",
    text: "Webhooks vérifiés par signature HMAC. Commission calculée et verrouillée à la création du paiement.",
  },
  {
    icon: "🌍",
    title: "16 méthodes, 7 pays",
    text: "MTN, Moov, Orange, Wave, Togocel… Couvrez l'ensemble de l'Afrique francophone en une seule intégration.",
  },
  {
    icon: "💳",
    title: "Zéro configuration technique",
    text: "Vous n'avez rien à configurer côté paiement. MomoGate gère les clés API, les encaissements et les reversements pour vous.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Landing() {
  const { showForm } = useLoaderData<typeof loader>();
  const marqueeItems = [...METHODS, ...METHODS];

  return (
    <>
      {/* ── Nav ── */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <a href="/" className={s.navLogo}>MomoGate</a>
          <div className={s.navLinks}>
            <a href="#how-it-works" className={s.navLink}>Comment ça marche</a>
            <a href="#pricing" className={s.navLink}>Tarifs</a>
            <a href="mailto:aboudouzinsou@yahoo.com" className={s.navLink}>Assistance</a>
          </div>
          <a href="#install" className={s.navCta}>Installer sur Shopify →</a>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className={s.hero}>
          <div className={s.heroBg} />
          <div className={s.heroEyebrow}>
            <span className={s.heroEyebrowDot} />
            Disponible sur Shopify App Store
          </div>
          <h1 className={s.heroTitle}>
            Vos clients paient en{" "}
            <span className={s.heroTitleAccent}>Mobile Money.</span>
          </h1>
          <p className={s.heroSub}>
            MomoGate connecte votre boutique Shopify aux 16 méthodes Mobile Money
            d'Afrique de l'Ouest. Paiement initié en 0 clic, reversement
            automatique, zéro intégration technique.
          </p>
          <div className={s.heroActions}>
            <a href="#install" className={s.btnPrimary}>
              Installer gratuitement →
            </a>
            <a href="#how-it-works" className={s.btnSecondary}>
              Voir comment ça marche
            </a>
          </div>
          <div className={s.heroStats}>
            <div className={s.stat}>
              <span className={s.statValue}>16</span>
              <span className={s.statLabel}>Méthodes de paiement</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>7</span>
              <span className={s.statLabel}>Pays couverts</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>30s</span>
              <span className={s.statLabel}>Temps de paiement moyen</span>
            </div>
            <div className={s.stat}>
              <span className={s.statValue}>0</span>
              <span className={s.statLabel}>Intégration technique requise</span>
            </div>
          </div>
        </section>

        {/* ── Marquee ── */}
        <div className={s.marqueeSection}>
          <div className={s.marqueeWrap}>
            <div className={s.marqueeTrack}>
              {marqueeItems.map((m, i) => (
                <div key={i} className={s.marqueeItem}>
                  <img
                    src={m.icon}
                    alt={m.name}
                    className={s.marqueeImg}
                    width={44}
                    height={44}
                  />
                  <span className={s.marqueeName}>
                    {m.name} — {m.country}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <section id="how-it-works" className={`${s.section} ${s.sectionCenter}`}>
          <p className={s.eyebrow}>Comment ça marche</p>
          <h2 className={s.sectionTitle}>Du panier au paiement en 4 étapes</h2>
          <p className={s.sectionSub}>
            MomoGate s'intègre silencieusement dans votre flux Shopify.
            Aucun développement, aucune configuration technique.
          </p>
          <div className={s.steps}>
            {STEPS.map((step) => (
              <div key={step.n} className={s.step}>
                <div className={s.stepNum}>{step.n}</div>
                <div className={s.stepTitle}>{step.title}</div>
                <p className={s.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className={s.sectionDivider} />

        {/* ── Features ── */}
        <section className={`${s.section} ${s.sectionCenter}`}>
          <p className={s.eyebrow}>Fonctionnalités</p>
          <h2 className={s.sectionTitle}>Tout ce dont vous avez besoin</h2>
          <p className={s.sectionSub}>
            Une intégration complète, pensée pour les marchands africains
            qui veulent encaisser sans friction.
          </p>
          <div className={s.features}>
            {FEATURES.map((f) => (
              <div key={f.title} className={s.featureCard}>
                <div className={s.featureIconWrap}>{f.icon}</div>
                <div className={s.featureTitle}>{f.title}</div>
                <p className={s.featureText}>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className={s.sectionDivider} />

        {/* ── Pricing ── */}
        <section id="pricing" className={`${s.section} ${s.sectionCenter}`}>
          <p className={s.eyebrow}>Tarifs</p>
          <h2 className={s.sectionTitle}>Simple, transparent</h2>
          <p className={s.sectionSub}>
            Un abonnement mensuel + une commission par transaction.
            Pas de frais cachés, pas d'engagement.
          </p>
          <div className={s.pricingGrid}>
            <div className={s.planCard}>
              <div className={s.planName}>Gratuit</div>
              <div>
                <span className={s.planPrice}>0</span>{" "}
                <span className={s.planPriceSub}>XOF/mois</span>
              </div>
              <div className={s.planCommission}>✦ 5 % par transaction</div>
              <ul className={s.planFeatures}>
                {[
                  "Jusqu'à 100 transactions / mois",
                  "16 méthodes Mobile Money",
                  "Dashboard transactions",
                  "Reversement automatique",
                  "Support par email",
                ].map((f) => (
                  <li key={f} className={s.planFeature}>
                    <span className={s.planCheck}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="#install" className={s.planBtn}>Démarrer gratuitement →</a>
            </div>

            <div className={`${s.planCard} ${s.planCardPro}`}>
              <div className={s.planBadge}>Recommandé</div>
              <div className={s.planName}>Pro</div>
              <div>
                <span className={s.planPrice}>5 000</span>{" "}
                <span className={s.planPriceSub}>XOF/mois</span>
              </div>
              <div className={s.planCommission}>✦ 2,5 % par transaction</div>
              <ul className={s.planFeatures}>
                {[
                  "Transactions illimitées",
                  "Commission réduite de moitié",
                  "Tout le plan Gratuit inclus",
                  "Historique reversements complet",
                  "Support prioritaire",
                ].map((f) => (
                  <li key={f} className={s.planFeature}>
                    <span className={s.planCheck}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="#install" className={`${s.planBtn} ${s.planBtnPro}`}>
                Prendre l'avantage Pro →
              </a>
            </div>
          </div>
        </section>

        <hr className={s.sectionDivider} />

        {/* ── Quote ── */}
        <div className={s.quoteSection}>
          <span className={s.quoteMark}>"</span>
          <blockquote className={s.quoteText}>
            "L'avenir du commerce africain ne se construira pas sur des promesses
            de paiement à la livraison, mais sur la certitude technologique.
            MomoGate est le pont entre l'ambition des marchands et la réalité
            numérique de nos clients."
          </blockquote>
          <div className={s.quoteAuthor}>
            <div className={s.quoteAvatar}>Z</div>
            <div>
              <div className={s.quoteName}>ZINSOU François</div>
              <div className={s.quoteRole}>CEO &amp; Fondateur, MomoGate</div>
            </div>
          </div>
        </div>

        {/* ── CTA / Install ── */}
        <section id="install" className={s.ctaSection}>
          <div className={s.ctaGlow} />
          <h2 className={s.ctaTitle}>Rejoignez la révolution.</h2>
          {showForm ? (
            <div className={s.loginSection}>
              <div className={s.loginCard}>
                <div className={s.loginTitle}>Installer MomoGate</div>
                <div className={s.loginSub}>
                  Entrez votre domaine Shopify pour commencer.
                </div>
                <Form method="post" action="/auth/login">
                  <div className={s.formGroup}>
                    <label className={s.formLabel} htmlFor="shop">
                      Domaine de la boutique
                    </label>
                    <input
                      className={s.formInput}
                      id="shop"
                      type="text"
                      name="shop"
                      placeholder="ma-boutique.myshopify.com"
                      autoComplete="off"
                    />
                    <span className={s.formHint}>
                      ex : ma-boutique.myshopify.com
                    </span>
                  </div>
                  <button type="submit" className={s.formBtn}>
                    Installer sur Shopify →
                  </button>
                </Form>
              </div>
            </div>
          ) : (
            <div className={s.ctaActions}>
              <a href="/auth/login" className={s.btnPrimary}>
                Installer sur Shopify →
              </a>
              <a
                href="mailto:aboudouzinsou@yahoo.com"
                className={s.btnSecondary}
              >
                Contacter l'équipe
              </a>
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerLogo}>MomoGate</div>
          <div className={s.footerLinks}>
            <a href="#" className={s.footerLink}>Documentation</a>
            <a href="mailto:aboudouzinsou@yahoo.com" className={s.footerLink}>Assistance</a>
            <a href="#" className={s.footerLink}>Conditions</a>
            <a href="#" className={s.footerLink}>Confidentialité</a>
          </div>
          <div className={s.footerCopy}>Made in Benin · © 2026 MomoGate Inc.</div>
        </div>
      </footer>
    </>
  );
}
