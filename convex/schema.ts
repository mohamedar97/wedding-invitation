import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const languageMode = v.union(
  v.literal("english"),
  v.literal("arabic"),
  v.literal("franco"),
);

const gender = v.union(v.literal("male"), v.literal("female"));

const additionalGuestRelationship = v.union(
  v.literal("husband"),
  v.literal("wife"),
  v.literal("Fiance"),
  v.literal("Fiancee"),
  v.literal("son"),
  v.literal("daughter"),
  v.literal("brother"),
  v.literal("sister"),
  v.literal("father"),
  v.literal("mother"),
  v.literal("friend"),
  v.literal("colleague"),
  v.literal("other"),
);

const communicationStyle = v.union(
  v.literal("formal"),
  v.literal("warm"),
  v.literal("casual"),
  v.literal("playful"),
);

const relationshipToCouple = v.union(
  v.literal("family"),
  v.literal("friend"),
  v.literal("colleague"),
  v.literal("family_friend"),
  v.literal("other"),
);

const guestSide = v.union(v.literal("groom"), v.literal("bride"));

export default defineSchema({
  guests: defineTable({
    mainGuestName: v.string(),
    mainGuestGender: v.optional(gender),
    mainGuestAge: v.optional(v.number()),
    mainGuestConfirmed: v.optional(v.boolean()),
    mainGuestConfirmedAt: v.optional(v.string()),
    guestSide: v.optional(guestSide),
    plusOneName: v.optional(v.string()),
    additionalGuests: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          relationshipToGuest: additionalGuestRelationship,
          gender: gender,
          age: v.optional(v.number()),
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
        languageMode: v.optional(languageMode),
        communicationStyle: v.optional(communicationStyle),
        relationshipToCouple: v.optional(relationshipToCouple),
        relationship: v.optional(v.string()),
        personality: v.optional(v.string()),
        personalInfo: v.optional(v.string()),
        weddingContext: v.optional(v.string()),
        deepStuff: v.optional(v.string()),
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
