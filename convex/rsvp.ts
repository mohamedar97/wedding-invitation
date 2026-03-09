import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateGuestConfirmation = mutation({
  args: {
    slug: v.string(),
    guestIndex: v.optional(v.number()),
    isMainGuest: v.boolean(),
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

    if (args.isMainGuest) {
      await ctx.db.patch(record._id, {
        mainGuestConfirmed: args.confirmed,
        mainGuestConfirmedAt: new Date().toISOString(),
      });
      return;
    }

    const additionalGuests = record.additionalGuests ?? [];

    if (
      args.guestIndex === undefined ||
      !additionalGuests[args.guestIndex]
    ) {
      throw new Error(`No guest found at index ${args.guestIndex}`);
    }

    const updatedAdditionalGuests = [...additionalGuests];
    updatedAdditionalGuests[args.guestIndex] = {
      ...updatedAdditionalGuests[args.guestIndex],
      confirmed: args.confirmed,
      confirmedAt: new Date().toISOString(),
    };

    await ctx.db.patch(record._id, {
      additionalGuests: updatedAdditionalGuests,
    });
  },
});
