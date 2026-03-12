import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateGuestConfirmation = mutation({
  args: {
    slug: v.string(),
    additionalGuestId: v.optional(v.string()),
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
    if (!args.additionalGuestId) {
      throw new Error("Additional guest ID is required.");
    }

    const guestExists = additionalGuests.some(
      (guest) => guest.id === args.additionalGuestId,
    );

    if (!guestExists) {
      throw new Error(`No guest found with id ${args.additionalGuestId}`);
    }

    const updatedAdditionalGuests = additionalGuests.map((guest) =>
      guest.id === args.additionalGuestId
        ? {
            ...guest,
            confirmed: args.confirmed,
            confirmedAt: new Date().toISOString(),
          }
        : guest,
    );

    await ctx.db.patch(record._id, {
      additionalGuests: updatedAdditionalGuests,
    });
  },
});
