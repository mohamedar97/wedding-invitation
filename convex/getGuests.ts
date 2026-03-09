import { v } from "convex/values";
import { query } from "./_generated/server";

export const get = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getSlugs = query({
  handler: async (ctx) => {
    const guests = await ctx.db.query("guests").collect();
    return guests.map(({ slug }) => slug);
  },
});
