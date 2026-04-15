# CLAUDE.md — Application Shopify Mobile Money

> **Fichier d'instructions permanentes pour Claude Code**  
> Dernière mise à jour : 2026-04-15  
> Version : 0.1.0

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

Application Shopify publique permettant aux marchands africains d'accepter les paiements Mobile Money (MTN, Orange, Wave) via un provider de paiement.

### Problème Résolu

Shopify ne supporte pas nativement les paiements Mobile Money. Les marchands africains perdent ~70% de leurs clients potentiels qui n'ont pas de carte bancaire.

### Utilisateurs Cibles

- Marchands Shopify en Afrique de l'Ouest (Bénin, Sénégal, Côte d'Ivoire, Ghana, Togo, Cameroun)
- Qui vendent en ligne
- Dont les clients veulent payer par Mobile Money

### Modèle Économique

- Plans payants via **Shopify Billing API**
- Le marchand utilise ses propres clés API du provider
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
| **Sessions** | Custom Convex Adapter | Remplace Prisma |
| **Email** | Resend | 3000 emails/mois gratuits |
| **Deploy** | Vercel + Convex Cloud | Serverless, 0€ au départ |

### Dépendances Critiques

```json
{
  "@shopify/shopify-app-react-router": "^1.0.0",
  "@shopify/shopify-api": "^11.0.0",
  "convex": "^1.16.0",
  "resend": "^4.0.0"
}
```

### Ce qu'on N'utilise PAS

| ❌ Ne pas utiliser | Raison |
|-------------------|--------|
| Convex Auth | OAuth Shopify est multi-tenant, géré par le package officiel |
| Prisma | Remplacé par Convex |
| Polaris npm | Utiliser CDN Web Components |
| Next.js | Pas de template officiel Shopify |
| Tailwind sur Polaris | Incompatible avec les composants Polaris |

---

## 3. Structure du Projet

```
[nom-app]/
├── app/                              # React Router App
│   ├── routes/                       # Routes (file-based routing)
│   │   ├── app._index.tsx            # Dashboard principal
│   │   ├── app.tsx                   # Layout app (avec Polaris)
│   │   ├── app.settings.tsx          # Config provider paiement
│   │   ├── app.transactions.tsx      # Liste transactions
│   │   ├── app.billing.tsx           # Gestion abonnement
│   │   ├── auth.$.tsx                # OAuth callback
│   │   ├── auth.login/               # Login
│   │   └── webhooks.*.tsx            # Webhooks handlers
│   │
│   ├── lib/
│   │   └── convex-session-storage.ts # Adapter Shopify → Convex
│   │
│   ├── shopify.servepnpm convex:devr.ts             # Config Shopify + Convex adapter
│   └── root.tsx                      # Root layout
│
├── convex/                           # Backend Convex
│   ├── _generated/                   # Auto-généré
│   ├── schema.ts                     # Tables: sessions, merchants, payments
│   ├── sessions.ts                   # CRUD sessions Shopify
│   ├── merchants.ts                  # Config marchands
│   ├── payments.ts                   # Transactions
│   └── http.ts                       # HTTP Actions (webhooks entrants)
│
├── extensions/                       # Checkout UI Extensions
│   └── payment-status/
│       ├── src/
│       │   ├── Checkout.tsx          # Pre-purchase
│       │   ├── ThankYou.tsx          # Post-purchase
│       │   └── OrderStatus.tsx       # Order status
│       └── shopify.extension.toml
│
├── scripts/                          # Scripts utilitaires
│   ├── new-session.sh
│   └── close-session.sh
│
├── sessions/                         # Sessions de travail archivées
│
├── .mcp.json                         # Config MCP (inclus dans template)
├── shopify.app.toml                  # Config app Shopify
├── vite.config.ts                    # Config Vite
├── CLAUDE.md                         # Ce fichier
├── SESSION.md                        # Template session
└── LICENSE                           # License propriétaire
```

---

## 4. Règles de Code

### 4.1. TypeScript

```typescript
// ✅ Correct
interface PaymentData {
  amount: number;
  currency: 'XOF' | 'XAF' | 'GHS';
  customerId: string;
}

// ❌ Incorrect
const data: any = { ... };
```

- TypeScript strict activé
- Pas de `any` — toujours typer explicitement
- Interfaces pour les objets, types pour les unions

### 4.2. React Router / Shopify

```typescript
// ✅ Correct — loader pour data fetching
export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  // Fetch data...
  return json({ data });
}

// ✅ Correct — action pour mutations
export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  // Process...
  return json({ success: true });
}

// ✅ Correct — useLoaderData dans le composant
export default function SettingsPage() {
  const { data } = useLoaderData();
  return ...;
}

// ❌ Incorrect — redirect de react-router
import { redirect } from "react-router";  // NON!

// ✅ Correct — redirect de authenticate
const { redirect } = await authenticate.admin(request);
return redirect("/app/settings");
```

### 4.3. Polaris (UI Embarquée)

```typescript
// ✅ Correct — Polaris Web Components (CDN)
// Les composants sont disponibles globalement via le template

// ❌ Incorrect — Import npm de Polaris
import { Page, Card } from '@shopify/polaris';  // NON avec React Router template

// ❌ Incorrect — Tailwind sur Polaris
  // NON!
```

**Note** : Le template React Router utilise Polaris via CDN (Web Components), pas via npm.

### 4.4. Convex

```typescript
// ✅ Mutations = écritures en base
export const createPayment = mutation({
  args: { amount: v.number(), shopDomain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert('payments', { 
      ...args,
      createdAt: Date.now(),
    });
  },
});

// ✅ Queries = lectures (temps réel)
export const listPayments = query({
  args: { shopDomain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query('payments')
      .withIndex('by_shop', q => q.eq('shopDomain', args.shopDomain))
      .order('desc')
      .collect();
  },
});

// ✅ Actions = appels API externes
export const initializePayment = action({
  args: { amount: v.number(), phone: v.string() },
  handler: async (ctx, args) => {
    // Appels API externes ici
    const response = await fetch('https://api.provider.com/payments', {
      method: 'POST',
      body: JSON.stringify(args),
    });
    return await response.json();
  },
});

// ✅ HTTP Actions = webhooks entrants
export const paymentWebhook = httpAction(async (ctx, request) => {
  const payload = await request.json();
  // Vérifier signature, traiter...
  return new Response('OK', { status: 200 });
});

// ❌ Incorrect — Appel HTTP dans une mutation
export const badMutation = mutation({
  handler: async (ctx) => {
    await fetch('https://api.example.com/...');  // NON!
  },
});
```

### 4.5. Checkout UI Extensions

```typescript
// ✅ Pour checkout et thank-you
import { ... } from "@shopify/ui-extensions-react/checkout";

// ✅ Pour order-status (customer account)
import { ... } from "@shopify/ui-extensions-react/customer-account";

// ❌ Pas de bannières/logos décoratifs
  // NON!

// ❌ Pas de countdown timers
Plus que 5:00 pour commander!  // NON!
```

### 4.6. Sécurité

| Règle | Implementation |
|-------|----------------|
| Clés API | Variables d'environnement uniquement |
| Clés marchands | Chiffrées AES-256 avant stockage Convex |
| Webhooks Shopify | Vérification HMAC obligatoire |
| Webhooks Provider | Vérification signature obligatoire |
| Sessions | Stockées dans Convex via adapter custom |

---

## 5. Utilisation des Skills

### 5.1. Tableau de Décision

| Je veux... | Skill | Notes |
|------------|-------|-------|
| Créer une route/page | `shopify-dev` | Utiliser loader/action |
| UI Polaris | `shopify-polaris-app-home` | Web Components CDN |
| Webhook Shopify | `shopify-functions` | Vérifier HMAC |
| Checkout Extension | `shopify-checkout-ui` | Targets multi-page |
| Billing Shopify | `shopify-partner` | Shopify Billing API |
| Mutation Convex | `convex-functions` | Pour écritures |
| Query Convex | `convex-functions` | Pour lectures temps réel |
| Action Convex | `convex-functions` | Pour API externes |
| HTTP Action Convex | `convex-http-actions` | Pour webhooks entrants |
| Schema Convex | `convex-schema-validator` | Définir tables |
| Envoyer email | `resend` | Templates transactionnels |

### 5.2. Skills Auto-Chargés

Ces skills sont toujours actifs :
- `shopify-ai-toolkit`
- `convex`

### 5.3. Workflow par Fonctionnalité

#### Nouvelle page embarquée
```
1. Skills: shopify-dev + shopify-polaris-app-home
2. Créer app/routes/app.ma-page.tsx
3. Implémenter loader() pour data
4. Utiliser Polaris pour UI
5. Connecter aux queries Convex
```

#### Webhook Shopify
```
1. Skills: shopify-dev + shopify-functions
2. Créer app/routes/webhooks.orders.create.tsx
3. Vérifier HMAC avec authenticate.webhook()
4. Appeler mutation/action Convex
```

#### Webhook Provider (entrant)
```
1. Skills: convex-http-actions
2. Créer convex/http.ts avec httpAction
3. Vérifier signature du provider
4. Mettre à jour payment dans Convex
5. Mettre à jour commande Shopify via API
```

---

## 6. Pipeline Git & Releases

### 6.1. Branches

```
main                    ← Production
  │
  ├── develop           ← Développement (preview)
  │     │
  │     ├── feat/xxx    ← Features
  │     ├── fix/xxx     ← Bug fixes
  │     └── refactor/xxx
  │
  └── release/v1.0.0    ← Préparation release
```

### 6.2. Commits Conventionnels

```bash
feat(scope): description     # Nouvelle fonctionnalité
fix(scope): description      # Correction de bug
docs(scope): description     # Documentation
refactor(scope): description # Refactoring
test(scope): description     # Tests
chore(scope): description    # Maintenance
```

### 6.3. Workflow Feature

```bash
# 1. Créer la branche
git checkout develop
git pull origin develop
git checkout -b feat/settings-page

# 2. Développer avec commits conventionnels
git commit -m "feat(settings): add payment config form"
git commit -m "fix(settings): handle empty API key"

# 3. Push et PR vers develop
git push origin feat/settings-page
```

### 6.4. Workflow Release

```bash
# 1. Créer release branch
git checkout develop
git checkout -b release/v1.0.0

# 2. Bump version + CHANGELOG
git commit -m "chore: prepare release v1.0.0"

# 3. Merger dans main
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main --tags

# 4. Back-merge dans develop
git checkout develop
git merge main
git push origin develop
```

### 6.5. Semantic Versioning

```
v1.0.0
│ │ │
│ │ └── PATCH: Bug fixes
│ └──── MINOR: Nouvelles fonctionnalités (rétrocompatibles)
└────── MAJOR: Breaking changes
```

### 6.6. CI/CD Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                         PIPELINE                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  push develop ──► Test ──► Build ──► Deploy Preview           │
│                    │         │         │                      │
│              TypeCheck   Vite     Vercel Preview              │
│              ESLint              Convex Preview                │
│                                                               │
│  push main ──► Test ──► Build ──► Deploy Production           │
│                    │         │         │                      │
│              TypeCheck   Vite     Vercel Prod                 │
│              ESLint              Convex Prod                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Environnements

### 7.1. Tableau des Environnements

| Env | Branche | Shopify | Convex | Provider |
|-----|---------|---------|--------|----------|
| **Local** | feat/* | Dev Store | `npx convex dev` | Sandbox |
| **Preview** | develop | Dev Store | Preview deployment | Sandbox |
| **Production** | main | App Store | `npx convex deploy` | Live |

### 7.2. Variables d'Environnement

```bash
# === SHOPIFY ===
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=read_orders,write_orders,read_customers
SHOPIFY_APP_URL=

# === CONVEX ===
CONVEX_URL=https://xxx.convex.cloud

# === PAYMENT PROVIDER (Sandbox/Live) ===
PAYMENT_SECRET_KEY=sk_test_xxx

# === RESEND ===
RESEND_API_KEY=re_xxx

# === ENCRYPTION ===
ENCRYPTION_KEY=xxx
```

### 7.3. Commandes par Environnement

```bash
# === LOCAL ===
npx convex dev          # Terminal 1
shopify app dev         # Terminal 2

# === PREVIEW ===
# Automatique via Vercel sur push develop

# === PRODUCTION ===
shopify app deploy      # Deploy Shopify
npx convex deploy       # Deploy Convex
```

---

## 8. Conformité App Store

### 8.1. Exigences Payments App (Req. 5.2)

| Exigence | Status |
|----------|--------|
| Utiliser uniquement Payments Apps API | ☐ |
| Nom = nom légal (pas de marketing) | ☐ |
| Screencasts tous navigateurs | ☐ |
| Annulation possible par acheteur | ☐ |
| Mêmes infos que checkout | ☐ |
| Pas de upsell dans flux paiement | ☐ |

### 8.2. Exigences Checkout App (Req. 5.6)

| Exigence | Status |
|----------|--------|
| APIs documentées uniquement | ☐ |
| Pas de countdown timers | ☐ |
| Pas de bannières/logos décoratifs | ☐ |
| Temps réponse réseau < 1s | ☐ |
| Skeleton components au chargement | ☐ |

### 8.3. Exigences Admin App (Req. 2.2)

| Exigence | Status |
|----------|--------|
| App Bridge pour OAuth | ☐ |
| Session tokens (pas cookies) | ☐ |
| Fonctionne en mode incognito | ☐ |

### 8.4. Anti Dark Patterns

| Règle | Status |
|-------|--------|
| Frais optionnels OFF par défaut | ☐ |
| Frais clairement itemisés | ☐ |
| Option livraison la moins chère par défaut | ☐ |

---

## 9. Historique des Sessions

<!-- Les conclusions des sessions s'ajoutent ici -->

### Session 2026-04-15 (Setup Initial)
- ✅ Guide de setup v3 créé (React Router + Convex + Extensions)
- ✅ Document conformité App Store créé
- ✅ CLAUDE.md réécrit pour nouveau stack
- 📝 Prochaine étape : Créer les comptes et initialiser le projet

---

## 10. Décisions Techniques

| Date | Décision | Justification |
|------|----------|---------------|
| 2026-04-15 | React Router v7 (pas Next.js) | Template officiel Shopify |
| 2026-04-15 | Convex (pas Prisma) | Temps réel natif, webhooks faciles |
| 2026-04-15 | Polaris CDN (pas npm) | Template React Router utilise Web Components |
| 2026-04-15 | Pas Convex Auth | OAuth Shopify multi-tenant, géré par package officiel |
| 2026-04-15 | Chiffrement AES-256 | Standard sécurité pour clés marchands |
| 2026-04-15 | Resend pour emails | 3000/mois gratuits, API simple |

---

## 11. TODO

### Setup Initial
- [ ] Créer compte Shopify Partners
- [ ] Créer Development Store
- [ ] Créer compte Convex
- [ ] Créer compte provider paiement (sandbox)
- [ ] Initialiser projet avec template React Router
- [ ] Intégrer Convex (remplacer Prisma)
- [ ] Push vers GitHub

### MVP Core
- [ ] OAuth Shopify fonctionnel
- [ ] Page settings (config API key)
- [ ] Webhook ORDERS_CREATE
- [ ] Intégration provider paiement
- [ ] Webhook provider → update order
- [ ] Dashboard transactions temps réel

### Checkout Extensions
- [ ] Extension pre-purchase (infos Mobile Money)
- [ ] Extension thank-you (statut paiement)
- [ ] Extension order-status (suivi)

### Billing
- [ ] Page billing avec plans
- [ ] Intégration Shopify Billing API

### Soumission
- [ ] Screencasts tous navigateurs
- [ ] Test store + credentials
- [ ] Instructions de test
- [ ] App listing complet
- [ ] Soumission App Store

---

## Commandes Rapides

```bash
# === DEV ===
npx convex dev          # Terminal 1
shopify app dev         # Terminal 2

# === SESSION ===
./scripts/new-session.sh
./scripts/close-session.sh

# === GIT ===
git checkout -b feat/xxx
git commit -m "feat(scope): description"

# === DEPLOY ===
shopify app deploy
npx convex deploy

# === EXTENSIONS ===
shopify app generate extension
```

---

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
