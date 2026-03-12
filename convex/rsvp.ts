import { v } from "convex/values";
import { mutation } from "./_generated/server";

const confirmationStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("declined"),
);

function toConfirmationValue(status: "pending" | "confirmed" | "declined") {
  if (status === "pending") {
    return undefined;
  }

  return status === "confirmed";
}

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

export const setGuestConfirmationStatus = mutation({
  args: {
    slug: v.string(),
    targetType: v.union(
      v.literal("main_guest"),
      v.literal("additional_guest"),
    ),
    additionalGuestId: v.optional(v.string()),
    status: confirmationStatus,
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!record) {
      throw new Error(`No guest record found for slug: ${args.slug}`);
    }

    const confirmed = toConfirmationValue(args.status);
    const confirmedAt =
      args.status === "pending" ? undefined : new Date().toISOString();

    if (args.targetType === "main_guest") {
      await ctx.db.patch(record._id, {
        mainGuestConfirmed: confirmed,
        mainGuestConfirmedAt: confirmedAt,
      });

      return {
        targetType: args.targetType,
        status: args.status,
      };
    }

    if (!args.additionalGuestId) {
      throw new Error("Additional guest ID is required.");
    }

    const additionalGuests = record.additionalGuests ?? [];
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
            confirmed,
            confirmedAt,
          }
        : guest,
    );

    await ctx.db.patch(record._id, {
      additionalGuests: updatedAdditionalGuests,
    });

    return {
      targetType: args.targetType,
      additionalGuestId: args.additionalGuestId,
      status: args.status,
    };
  },
});
