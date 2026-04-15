# Recommandations Shopify App Store — Application Mobile Money

> **Type d'app** : Payments App + Checkout App  
> **Distribution** : Shopify App Store (publique)  
> **Version** : 1.0  
> **Date** : 2026-04-15

---

## 📑 Table des Matières

1. [Vue d'ensemble des exigences](#1-vue-densemble-des-exigences)
2. [Payments Apps — Exigences (Req. 5.2)](#2-payments-apps--exigences-req-52)
3. [Checkout Apps — Exigences (Req. 5.6)](#3-checkout-apps--exigences-req-56)
4. [Apps dans l'Admin Shopify (Req. 2.2)](#4-apps-dans-ladmin-shopify-req-22)
5. [Design Guidelines — Anti Dark Patterns](#5-design-guidelines--anti-dark-patterns)
6. [Checklist de Conformité](#6-checklist-de-conformité)
7. [Préparation de la Soumission](#7-préparation-de-la-soumission)

---

## 1. Vue d'ensemble des exigences

Ton application combine **trois types** d'apps Shopify :

| Type | Fonction | Exigence App Store |
|------|----------|-------------------|
| **Payments App** | Traitement des paiements Mobile Money | Req. 5.2 |
| **Checkout App** | Extensions UI dans le checkout | Req. 5.6 |
| **Admin App** | Dashboard marchand dans l'admin | Req. 2.2 |

### ⚠️ Points Critiques

```
┌─────────────────────────────────────────────────────────────────┐
│                    RÈGLES NON-NÉGOCIABLES                       │
├─────────────────────────────────────────────────────────────────┤
│ ❌ Pas de upsell dans le flux de paiement                       │
│ ❌ Pas de bannières/logos décoratifs dans checkout              │
│ ❌ Pas de timers de compte à rebours                            │
│ ❌ Pas de frais optionnels activés par défaut                   │
│ ❌ Pas de collecte d'infos déjà capturées par Shopify           │
│ ✅ Temps de réponse réseau < 1 seconde                          │
│ ✅ Skeleton components au chargement                            │
│ ✅ Annulation de paiement possible par l'acheteur               │
│ ✅ Redirections propres checkout ↔ paiement ↔ confirmation      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Payments Apps — Exigences (Req. 5.2)

### 2.1. Exigences Minimales Produit

| Exigence | Implémentation requise |
|----------|----------------------|
| **API uniquement** | Utiliser exclusivement la Payments Apps API |
| **Screencasts** | Soumettre des vidéos du flux de paiement pour TOUS les navigateurs supportés |
| **Annulation** | Permettre aux acheteurs d'annuler le paiement à tout moment |
| **Redirections** | Checkout → Flux paiement → Page confirmation (aller-retour propre) |
| **Cohérence** | Afficher les MÊMES informations de paiement que dans le checkout |
| **Pas de upsell** | ❌ Aucun produit additionnel proposé dans le flux de paiement |

### 2.2. Naming de l'App

```
❌ INTERDIT                          ✅ AUTORISÉ
─────────────────────────────────────────────────────────────
"PayBridge - Le meilleur            "PayBridge"
paiement Mobile Money d'Afrique!"   
                                    
"🚀 Kpayo - Paiement Rapide 🚀"     "Kpayo"

"MoMoGate - #1 Mobile Money"        "MoMoGate"
```

**Règle** : Utiliser ton **nom légal d'entreprise** sans texte marketing. Les marchands découvrent les apps de paiement par les **méthodes de paiement offertes**, pas par le nom.

### 2.3. Flux de Paiement Conforme

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX DE PAIEMENT MOBILE MONEY                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CHECKOUT SHOPIFY                                            │
│     └── Acheteur clique "Payer par Mobile Money"                │
│                                                                 │
│  2. REDIRECTION VERS TON FLUX                                   │
│     └── Page de paiement avec:                                  │
│         • Même montant que checkout ✅                          │
│         • Même devise ✅                                        │
│         • Même description produits ✅                          │
│         • Bouton "Annuler" visible ✅                           │
│         • PAS de produits additionnels ❌                       │
│                                                                 │
│  3. PAIEMENT MOBILE MONEY                                       │
│     └── Acheteur reçoit push USSD / entre code                  │
│                                                                 │
│  4. REDIRECTION RETOUR                                          │
│     └── Page confirmation Shopify                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4. Documents de Test à Fournir

Pour la soumission App Store, préparer :

| Document | Contenu |
|----------|---------|
| **Test Store** | URL du dev store avec l'app installée |
| **Credentials** | Compte test Moneroo (sandbox) |
| **Instructions paiement** | Comment effectuer un paiement test |
| **Instructions remboursement** | Comment tester un refund |
| **Scénarios spécifiques** | 3D Secure, timeout, échec réseau |

### 2.5. Screencasts Requis

Créer des vidéos du flux complet sur :

```
☐ Chrome (Desktop)
☐ Firefox (Desktop)
☐ Safari (Desktop)
☐ Edge (Desktop)
☐ Chrome Mobile (Android)
☐ Safari Mobile (iOS)
```

Chaque vidéo doit montrer :
1. Sélection de Mobile Money au checkout
2. Redirection vers le flux de paiement
3. Saisie du numéro de téléphone
4. Confirmation USSD (simulée)
5. Redirection vers page confirmation
6. Test d'annulation

---

## 3. Checkout Apps — Exigences (Req. 5.6)

### 3.1. APIs Documentées Uniquement

```typescript
// ✅ AUTORISÉ - APIs documentées
import {
  reactExtension,
  Banner,
  Text,
  BlockStack,
} from "@shopify/ui-extensions-react/checkout";

// ❌ INTERDIT - APIs non documentées ou hacks
// Manipulation directe du DOM
// Injection de scripts externes
// Accès à window/document
```

### 3.2. Interdictions Absolues

| Interdit | Raison |
|----------|--------|
| **Demander infos de paiement** | Shopify gère déjà le paiement |
| **Countdown timers** | Dark pattern créant urgence artificielle |
| **Collecter infos déjà capturées** | Email, adresse, téléphone déjà dans checkout |
| **Auto-promotion excessive** | L'extension doit apporter de la valeur, pas de la pub |

### 3.3. Performance Réseau

```typescript
// ✅ CONFORME - Skeleton + temps de réponse < 1s

function PaymentStatusExtension() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de 1 seconde max
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);

    fetchPaymentStatus({ signal: controller.signal })
      .then(setStatus)
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }, []);

  // Skeleton pendant le chargement
  if (loading) {
    return (
      <BlockStack spacing="tight">
        <SkeletonText />
        <SkeletonText />
      </BlockStack>
    );
  }

  return <Text>{status}</Text>;
}
```

### 3.4. Targets Autorisés pour Checkout UI

```toml
# ✅ AUTORISÉS pour Payments App
[[extensions.targeting]]
target = "purchase.checkout.cart-line-item.render-after"

[[extensions.targeting]]
target = "purchase.thank-you.cart-line-item.render-after"

[[extensions.targeting]]
target = "customer-account.order-status.cart-line-item.render-after"

# ✅ Blocs généraux
[[extensions.targeting]]
target = "purchase.checkout.block.render"

[[extensions.targeting]]
target = "purchase.thank-you.block.render"
```

### 3.5. Design des Extensions — À Éviter

```tsx
// ❌ INTERDIT - Bannière décorative avec logo
function BadExtension() {
  return (
    <BlockStack>
      <Image source="https://myapp.com/logo.png" />  {/* ❌ Logo décoratif */}
      <Banner status="info">                          {/* ❌ Bannière promo */}
        <Text>Powered by MyApp - Le meilleur!</Text>
      </Banner>
    </BlockStack>
  );
}

// ✅ AUTORISÉ - Information utile sans décoration
function GoodExtension() {
  return (
    <BlockStack spacing="tight">
      <Text>
        Paiement Mobile Money en attente de confirmation.
      </Text>
      <Text appearance="subdued" size="small">
        Vous recevrez un SMS une fois le paiement validé.
      </Text>
    </BlockStack>
  );
}
```

---

## 4. Apps dans l'Admin Shopify (Req. 2.2)

### 4.1. Shopify App Bridge

```typescript
// ✅ CONFORME - Utiliser App Bridge pour OAuth
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // App Bridge gère automatiquement OAuth
  const { admin, session } = await authenticate.admin(request);
  
  return json({ shop: session.shop });
}
```

### 4.2. Authentification

| Méthode | Statut |
|---------|--------|
| **Session Tokens** | ✅ Requis |
| **Third-party cookies** | ❌ Interdit (ne fonctionne pas partout) |
| **localStorage** | ❌ Interdit (ne fonctionne pas en incognito) |

### 4.3. Test Mode Incognito

**Obligation** : L'app DOIT fonctionner en mode incognito Chrome.

```bash
# Test obligatoire avant soumission
1. Ouvrir Chrome en mode incognito
2. Aller sur ton Dev Store
3. Ouvrir l'app dans l'admin
4. Vérifier que TOUT fonctionne
```

### 4.4. Max Modal (Full Screen)

Si tu utilises le mode plein écran :

```typescript
// ❌ INTERDIT - Lancer max modal depuis la navigation
// L'app s'ouvre directement en plein écran

// ✅ AUTORISÉ - Lancer depuis une interaction utilisateur
function SettingsPage() {
  const handleOpenEditor = () => {
    // Ouvrir max modal pour un éditeur complexe
    shopify.modal.open('advanced-config', { fullScreen: true });
  };

  return (
    <Button onClick={handleOpenEditor}>
      Ouvrir la configuration avancée
    </Button>
  );
}
```

---

## 5. Design Guidelines — Anti Dark Patterns

### 5.1. Principe Fondamental

> **L'acheteur doit toujours recevoir le total le plus bas par défaut.**
> Tous les frais additionnels doivent être clairement affichés et optionnels.

### 5.2. Frais Optionnels — Règles

| Règle | Explication |
|-------|-------------|
| **OFF par défaut** | Aucun frais optionnel ne doit être pré-sélectionné |
| **Clairement itemisé** | Chaque frais doit apparaître séparément, pas juste dans le total |
| **Opt-in explicite** | L'acheteur doit cocher/cliquer pour ajouter |

### 5.3. Exemples Conformes vs Non-Conformes

#### Exemple 1 : Option de livraison premium

```tsx
// ✅ CONFORME - Option OFF par défaut, clairement itemisée
function ShippingOptions() {
  const [premiumShipping, setPremiumShipping] = useState(false); // OFF par défaut

  return (
    <BlockStack>
      <Checkbox 
        checked={premiumShipping}
        onChange={setPremiumShipping}
      >
        <BlockStack spacing="extraTight">
          <Text>Livraison express (+5 000 XOF)</Text>
          <Text size="small" appearance="subdued">
            Livraison en 24h au lieu de 3-5 jours
          </Text>
        </BlockStack>
      </Checkbox>
    </BlockStack>
  );
}

// ❌ NON-CONFORME - Option ON par défaut
function BadShippingOptions() {
  const [premiumShipping, setPremiumShipping] = useState(true); // ❌ ON par défaut!

  return (
    <Checkbox checked={premiumShipping} onChange={setPremiumShipping}>
      Inclure un "cadeau" (+5 000 XOF)  {/* ❌ Terme trompeur */}
    </Checkbox>
  );
}
```

#### Exemple 2 : Boutons de checkout

```tsx
// ✅ CONFORME - Deux boutons clairs
<BlockStack>
  <Button onPress={checkoutWithProtection}>
    Payer 25 000 XOF (avec protection)
  </Button>
  <Button onPress={checkoutWithoutProtection} kind="secondary">
    Payer 23 000 XOF (sans protection)
  </Button>
  <Text size="small">
    Protection livraison: +2 000 XOF
  </Text>
</BlockStack>

// ❌ NON-CONFORME - Confusion sur quel bouton fait quoi
<BlockStack>
  <Button onPress={checkout1}>Checkout</Button>
  <Button onPress={checkout2}>Checkout rapide</Button>
  {/* Lequel ajoute des frais? Pas clair! */}
</BlockStack>
```

### 5.4. Options de Livraison

```
✅ CONFORME: L'option la moins chère est sélectionnée par défaut

┌─────────────────────────────────────────────────────┐
│ Choisissez votre livraison                          │
├─────────────────────────────────────────────────────┤
│ ● Livraison standard - 2 000 XOF (3-5 jours)  ← DEFAULT
│ ○ Livraison express - 5 000 XOF (24h)               │
│ ○ Livraison premium - 10 000 XOF (même jour)        │
└─────────────────────────────────────────────────────┘

❌ NON-CONFORME: L'option la plus chère est en premier et par défaut

┌─────────────────────────────────────────────────────┐
│ Choisissez votre livraison                          │
├─────────────────────────────────────────────────────┤
│ ● Livraison premium - 10 000 XOF (même jour)  ← DEFAULT ❌
│ ○ Livraison express - 5 000 XOF (24h)               │
│ ○ Livraison standard - 2 000 XOF (3-5 jours)        │
└─────────────────────────────────────────────────────┘
```

---

## 6. Checklist de Conformité

### 6.1. Payments App (Req. 5.2)

```
☐ Utilise uniquement la Payments Apps API
☐ Nom de l'app = nom légal (pas de marketing)
☐ Flux de paiement identique aux infos checkout
☐ Bouton d'annulation visible et fonctionnel
☐ Redirections propres (checkout ↔ paiement ↔ confirmation)
☐ AUCUN upsell dans le flux de paiement
☐ Screencasts préparés pour tous les navigateurs
☐ Test store + credentials prêts
☐ Instructions de test documentées
```

### 6.2. Checkout App (Req. 5.6)

```
☐ Utilise uniquement les APIs documentées
☐ Pas de demande d'infos de paiement
☐ Pas de countdown timers
☐ Pas de collecte d'infos déjà capturées
☐ Temps de réponse réseau < 1 seconde
☐ Skeleton components au chargement
☐ Pas de bannières/logos décoratifs
☐ Extension apporte une vraie valeur (pas juste promo)
☐ Targets checkout autorisés uniquement
```

### 6.3. Admin App (Req. 2.2)

```
☐ Utilise Shopify App Bridge pour OAuth
☐ Authentification par session tokens
☐ Pas de third-party cookies
☐ Pas de localStorage pour données critiques
☐ Fonctionne en mode incognito Chrome
☐ Max modal lancé uniquement depuis interaction utilisateur
```

### 6.4. Design Anti-Dark Patterns

```
☐ Frais optionnels OFF par défaut
☐ Tous les frais clairement itemisés
☐ Opt-in explicite pour tout frais additionnel
☐ Option de livraison la moins chère par défaut
☐ Boutons de checkout clairement différenciés
☐ Pas de termes trompeurs ("cadeau", "gratuit" pour frais cachés)
```

---

## 7. Préparation de la Soumission

### 7.1. Assets Requis

| Asset | Spécifications |
|-------|---------------|
| **App icon** | 1200x1200px PNG, fond transparent |
| **Screenshots** | 1600x900px minimum, montrant l'app en action |
| **Screencasts** | MP4, 1080p, montrant le flux complet par navigateur |
| **App listing** | Description, features, pricing |

### 7.2. Documents de Test

Créer un fichier `TESTING.md` :

```markdown
# Instructions de Test — [NOM APP]

## Environnement de Test

- **Test Store**: https://test-store-xxx.myshopify.com
- **Admin**: https://test-store-xxx.myshopify.com/admin
- **App installée**: Oui

## Credentials Moneroo (Sandbox)

- **API Key**: sk_test_xxxxx
- **Mode**: Sandbox

## Comment Tester un Paiement

1. Aller sur le test store
2. Ajouter un produit au panier
3. Procéder au checkout
4. Sélectionner "Mobile Money" comme méthode de paiement
5. Entrer le numéro de test: +229 97 00 00 00
6. Confirmer le paiement (auto-approuvé en sandbox)
7. Vérifier la redirection vers page de confirmation

## Comment Tester un Remboursement

1. Aller dans Admin > Orders
2. Sélectionner une commande payée
3. Cliquer sur "Refund"
4. Entrer le montant à rembourser
5. Confirmer le remboursement

## Scénarios Spécifiques

### Timeout Réseau
- Numéro de test: +229 97 00 00 01
- Comportement attendu: Message "Paiement en attente" + retry possible

### Paiement Échoué
- Numéro de test: +229 97 00 00 02
- Comportement attendu: Message d'erreur + option de réessayer

### Annulation par l'Utilisateur
- Cliquer sur "Annuler" pendant le flux de paiement
- Comportement attendu: Retour au checkout avec panier intact
```

### 7.3. Contenu de l'App Listing

```markdown
# [NOM APP]

## Tagline (70 caractères max)
Acceptez les paiements Mobile Money (MTN, Orange, Wave) en Afrique.

## Description courte (200 caractères)
Permettez à vos clients africains de payer par Mobile Money. 
Support MTN, Orange Money, Wave, Moov Money. Installation en 2 minutes.

## Description longue
[Nom App] permet aux marchands Shopify d'accepter les paiements 
Mobile Money populaires en Afrique de l'Ouest et Centrale.

### Méthodes de paiement supportées
- MTN Mobile Money (Bénin, Côte d'Ivoire, Cameroun, Ghana)
- Orange Money (Bénin, Côte d'Ivoire, Sénégal, Mali)
- Wave (Sénégal, Côte d'Ivoire)
- Moov Money (Bénin, Togo)

### Fonctionnalités
- Installation rapide en 2 minutes
- Dashboard temps réel des transactions
- Webhooks automatiques pour mise à jour des commandes
- Support multidevise (XOF, XAF, GHS)

### Tarification
- Starter: 5 000 XOF/mois (jusqu'à 50 transactions)
- Pro: 15 000 XOF/mois (transactions illimitées)

## Catégories
- Payments
- Checkout

## Régions supportées
- Bénin
- Côte d'Ivoire
- Sénégal
- Ghana
- Cameroun
- Togo
- Mali
```

---

## Résumé des Actions

### Avant le Développement

```
☐ Lire intégralement les requirements 5.2, 5.6, 2.2
☐ Planifier le flux de paiement conforme
☐ Définir les extensions checkout minimales
```

### Pendant le Développement

```
☐ Implémenter avec les APIs documentées uniquement
☐ Tester en mode incognito régulièrement
☐ Vérifier les temps de réponse < 1s
☐ Éviter tout dark pattern
```

### Avant la Soumission

```
☐ Remplir la checklist complète
☐ Créer tous les screencasts
☐ Préparer le test store
☐ Documenter les instructions de test
☐ Vérifier le naming (pas de marketing)
☐ Relire les guidelines une dernière fois
```
