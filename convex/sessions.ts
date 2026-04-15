import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

/**
 * Récupère une session par son ID Shopify.
 * Public : appelé par ConvexHttpClient depuis le session adapter serveur.
 */
export const getByShopifyId = query({
  args: { shopifyId: v.string() },
  handler: async (ctx, { shopifyId }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_shopify_id", (q) => q.eq("shopifyId", shopifyId))
      .unique();
  },
});

/**
 * Récupère toutes les sessions d'un shop.
 * Public : appelé par ConvexHttpClient + interne pour shopify.ts.
 */
export const getByShop = query({
  args: { shop: v.string() },
  handler: async (ctx, { shop }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .collect();
  },
});

/**
 * Version interne de getByShop (pour les actions Convex).
 */
export const getByShopInternal = internalQuery({
  args: { shop: v.string() },
  handler: async (ctx, { shop }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .collect();
  },
});

/**
 * Crée ou met à jour une session (upsert par shopifyId).
 */
export const store = mutation({
  args: {
    shopifyId: v.string(),
    shop: v.string(),
    state: v.string(),
    isOnline: v.boolean(),
    scope: v.optional(v.string()),
    expires: v.optional(v.number()),
    accessToken: v.string(),
    userId: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    accountOwner: v.boolean(),
    locale: v.optional(v.string()),
    collaborator: v.optional(v.boolean()),
    emailVerified: v.optional(v.boolean()),
    refreshToken: v.optional(v.string()),
    refreshTokenExpires: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_shopify_id", (q) => q.eq("shopifyId", args.shopifyId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("sessions", args);
    }
    return true;
  },
});

/**
 * Supprime une session par son ID Shopify.
 */
export const deleteByShopifyId = mutation({
  args: { shopifyId: v.string() },
  handler: async (ctx, { shopifyId }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_shopify_id", (q) => q.eq("shopifyId", shopifyId))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return true;
  },
});

/**
 * Supprime plusieurs sessions par leurs IDs Shopify.
 */
export const deleteMany = mutation({
  args: { shopifyIds: v.array(v.string()) },
  handler: async (ctx, { shopifyIds }) => {
    for (const shopifyId of shopifyIds) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_shopify_id", (q) => q.eq("shopifyId", shopifyId))
        .unique();
      if (session) {
        await ctx.db.delete(session._id);
      }
    }
    return true;
  },
});
