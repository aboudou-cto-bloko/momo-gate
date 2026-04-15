import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

// ─── Queries internes ─────────────────────────────────────────────────────────

export const getByMonerooId = internalQuery({
  args: { monerooId: v.string() },
  handler: async (ctx, { monerooId }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_moneroo_id", (q) => q.eq("monerooId", monerooId))
      .unique();
  },
});

export const getByShopifyOrder = internalQuery({
  args: { shopifyOrderId: v.string() },
  handler: async (ctx, { shopifyOrderId }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_shopify_order", (q) => q.eq("shopifyOrderId", shopifyOrderId))
      .unique();
  },
});

// ─── Mutations internes ────────────────────────────────────────────────────────

export const create = internalMutation({
  args: {
    shop: v.string(),
    monerooId: v.string(),
    shopifyOrderId: v.optional(v.string()),
    shopifyOrderName: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payments", args);
  },
});

export const updateStatus = internalMutation({
  args: {
    monerooId: v.string(),
    status: v.string(),
    processedAt: v.optional(v.number()),
  },
  handler: async (ctx, { monerooId, status, processedAt }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_moneroo_id", (q) => q.eq("monerooId", monerooId))
      .unique();

    if (!payment) throw new Error(`Payment not found: ${monerooId}`);

    await ctx.db.patch(payment._id, {
      status,
      ...(processedAt && { processedAt }),
    });
    return payment;
  },
});

// ─── Queries publiques ────────────────────────────────────────────────────────

export const listByShop = query({
  args: {
    shop: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { shop, limit }) => {
    const q = ctx.db
      .query("payments")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .order("desc");
    return limit ? await q.take(limit) : await q.collect();
  },
});

export const getByOrderId = query({
  args: { shopifyOrderId: v.string() },
  handler: async (ctx, { shopifyOrderId }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_shopify_order", (q) => q.eq("shopifyOrderId", shopifyOrderId))
      .unique();
  },
});

// ─── Mutation publique (pour les loaders React Router) ────────────────────────

export const markViewed = mutation({
  args: { monerooId: v.string() },
  handler: async (ctx, { monerooId }) => {
    // No-op pour l'instant — peut servir à tracker les consultations
    return monerooId;
  },
});
