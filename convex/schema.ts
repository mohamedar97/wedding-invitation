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
          id: v.string(),
          name: v.string(),
          relationshipToGuest: v.string(),
          gender: v.string(),
          confirmed: v.optional(v.boolean()),
          confirmedAt: v.optional(v.string()),
        }),
      ),
    ),
    slug: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    preferedLanguage: v.union(v.literal("en"), v.literal("ar")),
    notesForAI: v.optional(
      v.object({
        relationshipToCouple: v.optional(v.string()),
        languageMode: v.optional(languageMode),
        communicationStyle: v.optional(v.string()),
        extraNotes: v.optional(v.string()),
      }),
    ),
    conversationId: v.optional(v.id("conversations")),
  })
    .index("by_slug", ["slug"])
    .index("by_phone", ["phone"]),
  conversations: defineTable({
    guestId: v.id("guests"),
    lastBatchId: v.number(),
    pendingBatchId: v.optional(v.number()),
    pendingScheduleVersion: v.optional(v.number()),
    pendingReplyStartedAt: v.optional(v.number()),
    pendingReplyDueAt: v.optional(v.number()),
    lastUserMessageAt: v.optional(v.number()),
    processingBatchId: v.optional(v.number()),
    processingScheduleVersion: v.optional(v.number()),
    lastReplyError: v.optional(v.string()),
  }).index("by_guestId", ["guestId"]),
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    batchId: v.optional(v.number()),
  }).index("by_conversationId", ["conversationId"]),
});
