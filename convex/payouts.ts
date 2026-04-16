import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

export const create = internalMutation({
  args: {
    shop: v.string(),
    monerooPaymentId: v.string(),
    monerooPayoutId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    recipientPhone: v.string(),
    recipientMethod: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payouts", args);
  },
});

export const updateStatus = internalMutation({
  args: {
    monerooPaymentId: v.string(),
    status: v.string(),
    monerooPayoutId: v.optional(v.string()),
  },
  handler: async (ctx, { monerooPaymentId, status, monerooPayoutId }) => {
    const payout = await ctx.db
      .query("payouts")
      .withIndex("by_payment", (q) => q.eq("monerooPaymentId", monerooPaymentId))
      .unique();
    if (!payout) return;
    await ctx.db.patch(payout._id, {
      status,
      ...(monerooPayoutId && { monerooPayoutId }),
      ...(["success", "failed"].includes(status) && { processedAt: Date.now() }),
    });
  },
});

export const getByPayment = internalQuery({
  args: { monerooPaymentId: v.string() },
  handler: async (ctx, { monerooPaymentId }) => {
    return await ctx.db
      .query("payouts")
      .withIndex("by_payment", (q) => q.eq("monerooPaymentId", monerooPaymentId))
      .unique();
  },
});

export const listByShop = query({
  args: { shop: v.string() },
  handler: async (ctx, { shop }) => {
    return await ctx.db
      .query("payouts")
      .withIndex("by_shop", (q) => q.eq("shop", shop))
      .order("desc")
      .collect();
  },
});
