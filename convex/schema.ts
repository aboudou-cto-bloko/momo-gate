import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * Sessions Shopify OAuth (remplace Prisma).
   * Chaque entrée correspond à une session Shopify (offline ou online).
   */
  sessions: defineTable({
    shopifyId: v.string(),       // ID de session Shopify (clé primaire logique)
    shop: v.string(),            // ex: "my-store.myshopify.com"
    state: v.string(),
    isOnline: v.boolean(),
    scope: v.optional(v.string()),
    expires: v.optional(v.number()),          // timestamp ms (null = pas d'expiration)
    accessToken: v.string(),
    userId: v.optional(v.string()),           // BigInt Shopify sérialisé en string
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    accountOwner: v.boolean(),
    locale: v.optional(v.string()),
    collaborator: v.optional(v.boolean()),
    emailVerified: v.optional(v.boolean()),
    refreshToken: v.optional(v.string()),
    refreshTokenExpires: v.optional(v.number()),
  })
    .index("by_shopify_id", ["shopifyId"])
    .index("by_shop", ["shop"]),

  /**
   * Marchands installés.
   * Créé lors du webhook app/installed, mis à jour lors des changements de plan.
   */
  merchants: defineTable({
    shop: v.string(),
    installedAt: v.number(),
    plan: v.optional(v.union(v.literal("starter"), v.literal("pro"))),
    billingId: v.optional(v.string()),   // ID subscription Shopify Billing API
    isActive: v.boolean(),
  }).index("by_shop", ["shop"]),

  /**
   * Transactions de paiement Mobile Money.
   * Créé lors d'un ORDERS_CREATE, mis à jour via webhook Moneroo.
   */
  payments: defineTable({
    shop: v.string(),
    monerooId: v.string(),                    // ID Moneroo (py_xxx)
    shopifyOrderId: v.optional(v.string()),   // GID Shopify (gid://shopify/Order/xxx)
    shopifyOrderName: v.optional(v.string()), // ex: "#1001"
    amount: v.number(),                       // en centimes / unité entière (XOF)
    currency: v.string(),                     // "XOF", "GHS", etc.
    status: v.string(),                       // PaymentStatus: initiated|pending|success|failed|cancelled
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),      // URL de paiement Moneroo
    metadata: v.optional(v.any()),
    processedAt: v.optional(v.number()),      // timestamp ms quand final
  })
    .index("by_shop", ["shop"])
    .index("by_moneroo_id", ["monerooId"])
    .index("by_shopify_order", ["shopifyOrderId"]),
});
