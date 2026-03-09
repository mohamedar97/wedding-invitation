import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  guests: defineTable({
    mainGuestName: v.string(),
    mainGuestConfirmed: v.optional(v.boolean()),
    mainGuestConfirmedAt: v.optional(v.string()),
    plusOneName: v.optional(v.string()),
    additionalGuests: v.optional(
      v.array(
        v.object({
          name: v.string(),
          confirmed: v.optional(v.boolean()),
          confirmedAt: v.optional(v.string()),
        }),
      ),
    ),
    slug: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    preferedLanguage: v.union(v.literal("en"), v.literal("ar")),
    specialMessage: v.optional(v.string()),
  }).index("by_slug", ["slug"]),
});
