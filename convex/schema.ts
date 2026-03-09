import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  guests: defineTable({
    mainGuest: v.string(),
    plusOne: v.optional(v.string()),
    slug: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    confirmed: v.boolean(),
    preferedLanguage: v.union(v.literal("en"), v.literal("ar")),
    specialMessage: v.optional(v.string()),
  }).index("by_slug", ["slug"]),
});
