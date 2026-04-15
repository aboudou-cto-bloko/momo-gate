# CLAUDE.md — Application Shopify Mobile Money

> **Fichier d'instructions permanentes pour Claude Code**  
> Dernière mise à jour : 2026-04-15  
> Version : 0.2.0

---

## 📑 Table des Matières

1. [Contexte Projet](#1-contexte-projet)
2. [Stack Technique](#2-stack-technique)
3. [Structure du Projet](#3-structure-du-projet)
4. [Règles de Code](#4-règles-de-code)
5. [Utilisation des Skills](#5-utilisation-des-skills)
6. [Pipeline Git & Releases](#6-pipeline-git--releases)
7. [Environnements](#7-environnements)
8. [Conformité App Store](#8-conformité-app-store)
9. [Historique des Sessions](#9-historique-des-sessions)
10. [Décisions Techniques](#10-décisions-techniques)
11. [TODO](#11-todo)

---

## 1. Contexte Projet

### Description

Application Shopify publique permettant aux marchands africains d'accepter les paiements Mobile Money (MTN, Orange, Wave) via Moneroo.

### Problème Résolu

Shopify ne supporte pas nativement les paiements Mobile Money. Les marchands africains perdent ~70% de leurs clients potentiels qui n'ont pas de carte bancaire.

### Utilisateurs Cibles

- Marchands Shopify en Afrique de l'Ouest (Bénin, Sénégal, Côte d'Ivoire, Ghana, Togo, Cameroun)
- Qui vendent en ligne
- Dont les clients veulent payer par Mobile Money

### Modèle Économique

- Plans payants via **Shopify Billing API**
- **momo-gate possède les clés Moneroo** — le marchand n'a pas besoin de compte Moneroo
- Plans : Starter (5 000 XOF/mois), Pro (15 000 XOF/mois)

### Métriques de Succès MVP

| Métrique | Objectif | Délai |
|----------|----------|-------|
| Paiements réussis | 50 | 30 jours |
| Marchands actifs | 10 | 30 jours |
| MRR | 25 000 XOF | 60 jours |

---

## 2. Stack Technique

### Stack Principal

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| **Framework** | React Router v7 | Template officiel Shopify |
| **Backend** | Convex | Temps réel, serverless, webhooks natifs |
| **UI Shopify** | Polaris Web Components (CDN) | Obligatoire pour apps embarquées |
| **Auth** | OAuth Shopify | Via `@shopify/shopify-app-react-router` |
| **Sessions** | Custom Convex Adapter | `app/lib/convex-session-storage.ts` |
| **Paiements** | Moneroo (`moneroo` npm) | SDK TypeScript officiel, clés centralisées |
| **Email** | Resend | 3000 emails/mois gratuits |
| **Deploy** | Vercel + Convex Cloud | Serverless, 0€ au départ |

### Dépendances Critiques

```json
{
  "@shopify/shopify-app-react-router": "^1.1.0",
  "@shopify/shopify-api": "^11.0.0",
  "convex": "^1.35.1",
  "moneroo": "^0.1.1"
}
```

### Ce qu'on N'utilise PAS

| ❌ Ne pas utiliser | Raison |
|-------------------|--------|
| Prisma | **Supprimé** — remplacé par Convex |
| Convex Auth | OAuth Shopify est multi-tenant, géré par le package officiel |
| Polaris npm | Utiliser CDN Web Components |
| Next.js | Pas de template officiel Shopify |
| Tailwind sur Polaris | Incompatible avec les composants Polaris |

---

## 3. Structure du Projet

```
momo-gate/
├── app/                              # React Router App
│   ├── routes/
│   │   ├── app._index.tsx            # Dashboard principal
│   │   ├── app.tsx                   # Layout app (avec Polaris)
│   │   ├── app.settings.tsx          # Config (à créer)
│   │   ├── app.transactions.tsx      # Transactions temps réel (à créer)
│   │   ├── app.billing.tsx           # Abonnement (à créer)
│   │   ├── auth.$.tsx                # OAuth callback
│   │   ├── auth.login/               # Login
│   │   └── webhooks.*.tsx            # Webhooks handlers
│   ├── lib/
│   │   └── convex-session-storage.ts # Adapter Shopify → Convex
│   ├── shopify.server.ts             # Config Shopify + Convex adapter
│   └── root.tsx
│
├── convex/                           # Backend Convex
│   ├── _generated/                   # Auto-généré (committé — requis pour Vercel)
│   ├── schema.ts                     # Tables: sessions, merchants, payments
│   ├── sessions.ts                   # CRUD sessions (public + internal)
│   ├── merchants.ts                  # Marchands
│   ├── payments.ts                   # Queries + mutations (runtime Convex)
│   ├── payments_actions.ts           # Actions Moneroo API ("use node")
│   ├── shopify.ts                    # fulfillOrder — Admin API Shopify
│   ├── webhook_moneroo.ts            # Handler webhook Moneroo ("use node")
│   └── http.ts                       # HTTP router → /moneroo/webhook
│
├── extensions/                       # Checkout UI Extensions (à créer)
├── .github/workflows/
│   ├── ci.yml                        # Typecheck + lint
│   └── deploy.yml                    # Convex deploy sur main
├── .env.example
├── shopify.app.toml
├── shopify.web.toml
└── CLAUDE.md
```

---

## 4. Règles de Code

### 4.1. TypeScript

- TypeScript strict activé — pas de `any`
- Interfaces pour les objets, types pour les unions

### 4.2. React Router / Shopify

```typescript
// ✅ redirect via authenticate (pas react-router)
const { redirect } = await authenticate.admin(request);
return redirect("/app/settings");
```

### 4.3. Polaris (UI Embarquée)

```typescript
// ✅ Web Components CDN — pas d'import npm @shopify/polaris
// ❌ import { Page } from '@shopify/polaris'  // NON
```

### 4.4. Convex — Séparation des Runtimes

**CRITIQUE** : `moneroo` utilise `node:crypto` → incompatible avec le runtime Convex par défaut.

| Fichier | Runtime | Contenu autorisé |
|---------|---------|------------------|
| `payments.ts`, `sessions.ts`, `merchants.ts` | Convex | queries, mutations uniquement |
| `payments_actions.ts`, `webhook_moneroo.ts` | Node.js (`"use node"`) | actions qui appellent moneroo |
| `shopify.ts`, `http.ts` | Convex | actions sans node:*, httpAction |

```typescript
// ✅ Fichier "use node" — UNIQUEMENT des actions
"use node";
import { Moneroo } from "moneroo";
export const initializePayment = action({ ... });

// ❌ Ne jamais importer moneroo sans "use node"
// ❌ Ne jamais mettre queries/mutations dans un fichier "use node"
// ❌ Appels fetch dans des mutations
```

### 4.5. Sécurité

| Règle | Implementation |
|-------|----------------|
| Clés Moneroo | Variables d'env uniquement — jamais exposées aux marchands |
| Webhooks Shopify | `authenticate.webhook()` — HMAC auto |
| Webhooks Moneroo | `constructWebhookEvent()` du SDK — HMAC SHA-256 |
| Sessions | Convex via adapter custom |

---

## 5. Utilisation des Skills

| Je veux... | Skill |
|------------|-------|
| Route/page Shopify | `shopify-dev` |
| UI Polaris | `shopify-polaris-app-home` |
| Webhook Shopify | `shopify-functions` |
| Checkout Extension | `shopify-polaris-checkout-extensions` |
| Billing Shopify | `shopify-partner` |
| Convex functions | `convex-functions` |
| HTTP Action Convex | `convex` |

---

## 6. Pipeline Git & Releases

### Branches

```
main        ← Production (Vercel + Convex prod)
develop     ← Développement (preview)
feat/xxx    ← Features (depuis develop)
fix/xxx     ← Bug fixes
```

### Commits Conventionnels

```bash
feat(scope): description
fix(scope): description
chore(scope): description
ci(scope): description
```

### CI/CD

```
push feat/* ou develop  →  CI: typecheck + lint
push main               →  CI: typecheck + lint
                        →  Deploy: npx convex deploy
                        →  Vercel: build + deploy auto (GitHub integration)
```

**GitHub Secret requis :** `CONVEX_DEPLOY_KEY` (dashboard.convex.dev → Settings)

---

## 7. Environnements

| Env | Branche | Shopify | Convex | Moneroo |
|-----|---------|---------|--------|---------|
| **Local** | feat/* | Dev Store | `npx convex dev` | Sandbox |
| **Preview** | develop | Dev Store | Preview | Sandbox |
| **Production** | main | App Store | `npx convex deploy` | Live |

### Variables d'Environnement

```bash
# SHOPIFY
SHOPIFY_API_KEY=599a86c67f2faee4410595ceb1a5762b
SHOPIFY_API_SECRET=          # .env.local uniquement
SCOPES=write_products,read_orders,write_orders,read_customers
SHOPIFY_APP_URL=https://momo-gate.vercel.app
SHOPIFY_API_VERSION=2025-10

# CONVEX
CONVEX_URL=https://zany-viper-853.convex.cloud
VITE_CONVEX_URL=https://zany-viper-853.convex.cloud
VITE_CONVEX_SITE_URL=https://zany-viper-853.convex.site

# MONEROO (clés momo-gate — jamais exposées marchands)
MONEROO_SECRET_KEY=          # .env.local uniquement
MONEROO_WEBHOOK_SECRET=      # .env.local uniquement
# Webhook URL : https://zany-viper-853.convex.site/moneroo/webhook
```

### Commandes

```bash
npx convex dev    # Terminal 1
shopify app dev   # Terminal 2
pnpm typecheck
pnpm lint
```

---

## 8. Conformité App Store

### Req. 5.2 — Payments App

| Exigence | Status |
|----------|--------|
| Utiliser uniquement Payments Apps API | ☐ |
| Nom = nom légal | ☐ |
| Screencasts tous navigateurs | ☐ |
| Annulation possible par acheteur | ☐ |
| Pas de upsell dans flux paiement | ☐ |

### Req. 5.6 — Checkout App

| Exigence | Status |
|----------|--------|
| APIs documentées uniquement | ☐ |
| Pas de countdown timers | ☐ |
| Temps réponse < 1s | ☐ |
| Skeleton components au chargement | ☐ |

### Req. 2.2 — Admin App

| Exigence | Status |
|----------|--------|
| App Bridge pour OAuth | ☐ |
| Session tokens (pas cookies) | ☐ |
| Fonctionne en mode incognito | ☐ |

---

## 9. Historique des Sessions

### Session 2026-04-15 (Setup Initial)
- ✅ Guide de setup v3 créé (React Router + Convex + Extensions)
- ✅ Document conformité App Store créé
- ✅ CLAUDE.md v0.1 rédigé

### Session 2026-04-15 (Intégration Convex + Moneroo)
- ✅ Convex installé, Prisma **supprimé définitivement**
- ✅ Schema Convex : `sessions`, `merchants`, `payments`
- ✅ Adapter `ConvexSessionStorage` (remplace `PrismaSessionStorage`)
- ✅ SDK `moneroo` intégré — clés centralisées (Option 1, pas de compte marchand requis)
- ✅ Séparation runtimes : `payments_actions.ts` + `webhook_moneroo.ts` avec `"use node"`
- ✅ HTTP action webhook → `convex.site/moneroo/webhook`
- ✅ Action `fulfillOrder` — update commandes Shopify après paiement réussi
- ✅ Repo GitHub public `aboudou-cto-bloko/momo-gate` + branches `main`/`develop`
- ✅ CI/CD GitHub Actions (typecheck/lint + Convex deploy sur main)
- ✅ `shopify.app.toml` + `shopify.web.toml` nettoyés (sans Prisma)
- 📝 Prochaine étape : Vercel + MVP (webhook orders/create, settings, transactions)

---

## 10. Décisions Techniques

| Date | Décision | Justification |
|------|----------|---------------|
| 2026-04-15 | React Router v7 | Template officiel Shopify |
| 2026-04-15 | Convex (pas Prisma) | Temps réel natif, webhooks faciles |
| 2026-04-15 | Polaris CDN | Template React Router utilise Web Components |
| 2026-04-15 | Pas Convex Auth | OAuth Shopify multi-tenant géré par package officiel |
| 2026-04-15 | Moneroo clés centralisées | Onboarding simplifié — pas de compte Moneroo requis |
| 2026-04-15 | `"use node"` dans fichiers actions séparés | `moneroo` utilise `node:crypto`, incompatible runtime Convex |
| 2026-04-15 | `convex/_generated/` committé | Nécessaire pour build Vercel sans `npx convex dev` |

---

## 11. TODO

### Setup restant
- [ ] Connecter Vercel au repo GitHub
- [ ] Ajouter variables d'env sur Vercel
- [ ] Ajouter `CONVEX_DEPLOY_KEY` dans GitHub Secrets
- [ ] Mettre à jour `SHOPIFY_APP_URL` dans `shopify.app.toml` avec l'URL Vercel finale

### MVP Core
- [ ] Webhook `orders/create` → init paiement Moneroo (`convex/payments_actions.ts`)
- [ ] Page settings (dashboard marchand — scopes, statut)
- [ ] Dashboard transactions temps réel (Convex query réactive)
- [ ] Webhook Moneroo → update statut + fulfillOrder

### Checkout Extensions
- [ ] Extension pre-purchase (infos Mobile Money)
- [ ] Extension thank-you (statut paiement)
- [ ] Extension order-status (suivi)

### Billing
- [ ] Page billing Starter / Pro
- [ ] Intégration Shopify Billing API

### Soumission App Store
- [ ] Screencasts tous navigateurs
- [ ] Test store + credentials
- [ ] App listing complet
- [ ] Soumission
