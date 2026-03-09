import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateGuestConfirmation = mutation({
  args: {
    slug: v.string(),
    guestIndex: v.number(),
    confirmed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!record) {
      throw new Error(`No guest record found for slug: ${args.slug}`);
    }

    const updatedGuests = [...record.guests];
    updatedGuests[args.guestIndex] = {
      ...updatedGuests[args.guestIndex],
      confirmed: args.confirmed,
      confirmedAt: new Date().toISOString(),
    };

    await ctx.db.patch(record._id, {
      guests: updatedGuests,
    });
  },
});
