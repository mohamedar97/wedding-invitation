import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const languageMode = v.union(
  v.literal("english"),
  v.literal("arabic"),
  v.literal("franco"),
);

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
    notesForAI: v.object({
      preferredName: v.optional(v.string()),
      relationshipToCouple: v.optional(v.string()),
      languageMode: v.optional(languageMode),
      communicationStyle: v.optional(v.string()),
      plusOneNames: v.optional(
        v.array(
          v.object({ name: v.string(), relationshipToGuest: v.string() }),
        ),
      ),
      memoryNotes: v.optional(v.string()),
      sensitiveNotes: v.optional(v.string()),
      lastInteractionSummary: v.optional(v.string()),
      extraNotes: v.optional(v.string()),
    }),
  })
    .index("by_slug", ["slug"])
    .index("by_phone", ["phone"]),
  conversations: defineTable({
    guestId: v.id("guests"),
  }).index("by_guestId", ["guestId"]),
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  }).index("by_conversationId", ["conversationId"]),
});
