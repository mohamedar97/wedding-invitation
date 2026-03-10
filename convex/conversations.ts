import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByGuestId = query({
  args: {
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_guestId", (q) => q.eq("guestId", args.guestId))
      .first();
  },
});

export const create = mutation({
  args: {
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      guestId: args.guestId,
    });
  },
});

export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();
  },
});

export const createMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", args);
  },
});
