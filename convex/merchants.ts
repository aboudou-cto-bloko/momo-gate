import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

/**
 * Récupère un marchand par son shop domain.
 */
export const getByShop = internalQuery({
  args: { shop: v.string() },
  handler: async (ctx, { shop }) => {
    return await ctx.db
      .query("merchants")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .unique();
  },
});

/**
 * Crée ou met à jour un marchand (upsert par shop domain).
 * Appelé lors du webhook app/installed ou app/uninstalled.
 */
export const upsert = internalMutation({
  args: {
    shop: v.string(),
    isActive: v.boolean(),
    plan: v.optional(v.union(v.literal("starter"), v.literal("pro"))),
    billingId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("merchants")
      .withIndex("by_shop", (q) => q.eq("shop", args.shop))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: args.isActive,
        ...(args.plan !== undefined && { plan: args.plan }),
        ...(args.billingId !== undefined && { billingId: args.billingId }),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("merchants", {
        shop: args.shop,
        installedAt: Date.now(),
        isActive: args.isActive,
        plan: args.plan,
        billingId: args.billingId,
      });
    }
  },
});

/**
 * Met à jour le plan et l'ID de facturation d'un marchand.
 */
export const updatePlan = internalMutation({
  args: {
    shop: v.string(),
    plan: v.union(v.literal("starter"), v.literal("pro")),
    billingId: v.string(),
  },
  handler: async (ctx, { shop, plan, billingId }) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .unique();

    if (!merchant) throw new Error(`Merchant not found: ${shop}`);
    await ctx.db.patch(merchant._id, { plan, billingId });
    return true;
  },
});

// ─── Queries publiques (appelées depuis les loaders React Router) ──────────────

export const get = query({
  args: { shop: v.string() },
  handler: async (ctx, { shop }) => {
    return await ctx.db
      .query("merchants")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .unique();
  },
});

// ─── Mutations publiques ───────────────────────────────────────────────────────

export const install = mutation({
  args: { shop: v.string() },
  handler: async (ctx, { shop }) => {
    const existing = await ctx.db
      .query("merchants")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { isActive: true });
      return existing._id;
    }
    return await ctx.db.insert("merchants", {
      shop,
      installedAt: Date.now(),
      isActive: true,
    });
  },
});

/**
 * Met à jour le plan depuis la page billing (appelé par le loader après confirmation Shopify).
 * Public car appelé depuis un loader React Router via ConvexHttpClient.
 */
export const setPlan = mutation({
  args: {
    shop: v.string(),
    plan: v.union(v.literal("starter"), v.literal("pro")),
    billingId: v.string(),
  },
  handler: async (ctx, { shop, plan, billingId }) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .unique();
    if (!merchant) throw new Error(`Merchant not found: ${shop}`);
    await ctx.db.patch(merchant._id, { plan, billingId });
    return true;
  },
});

/**
 * Enregistre les infos de payout du marchand (numéro mobile money + méthode).
 * Public car appelé depuis un action React Router.
 */
export const updatePayoutInfo = mutation({
  args: {
    shop: v.string(),
    payoutPhone: v.string(),
    payoutMethod: v.string(),
    payoutFirstName: v.string(),
    payoutLastName: v.string(),
    payoutEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_shop", (q) => q.eq("shop", args.shop))
      .unique();
    if (!merchant) throw new Error(`Merchant not found: ${args.shop}`);
    await ctx.db.patch(merchant._id, {
      payoutPhone: args.payoutPhone,
      payoutMethod: args.payoutMethod,
      payoutFirstName: args.payoutFirstName,
      payoutLastName: args.payoutLastName,
      payoutEmail: args.payoutEmail,
    });
    return true;
  },
});

export const uninstall = mutation({
  args: { shop: v.string() },
  handler: async (ctx, { shop }) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .unique();
    if (merchant) {
      await ctx.db.patch(merchant._id, { isActive: false });
    }
    return true;
  },
});
