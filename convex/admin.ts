import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const languageMode = v.union(
  v.literal("english"),
  v.literal("arabic"),
  v.literal("franco"),
);

const additionalGuestValidator = v.array(
  v.object({
    name: v.string(),
    confirmed: v.optional(v.boolean()),
    confirmedAt: v.optional(v.string()),
  }),
);

const plusOneNamesValidator = v.array(
  v.object({
    name: v.string(),
    relationshipToGuest: v.string(),
  }),
);

const notesForAiValidator = v.object({
  preferredName: v.optional(v.string()),
  relationshipToCouple: v.optional(v.string()),
  languageMode: v.optional(languageMode),
  communicationStyle: v.optional(v.string()),
  plusOneNames: v.optional(plusOneNamesValidator),
  memoryNotes: v.optional(v.string()),
  sensitiveNotes: v.optional(v.string()),
  lastInteractionSummary: v.optional(v.string()),
  extraNotes: v.optional(v.string()),
});

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeNotes(
  notes?: {
    preferredName?: string;
    relationshipToCouple?: string;
    languageMode?: "english" | "arabic" | "franco";
    communicationStyle?: string;
    plusOneNames?: { name: string; relationshipToGuest: string }[];
    memoryNotes?: string;
    sensitiveNotes?: string;
    lastInteractionSummary?: string;
    extraNotes?: string;
  },
) {
  if (!notes) {
    return undefined;
  }

  const normalized = {
    preferredName: normalizeOptionalString(notes.preferredName),
    relationshipToCouple: normalizeOptionalString(notes.relationshipToCouple),
    languageMode: notes.languageMode,
    communicationStyle: normalizeOptionalString(notes.communicationStyle),
    plusOneNames:
      notes.plusOneNames && notes.plusOneNames.length > 0
        ? notes.plusOneNames
            .map((plusOne) => ({
              name: plusOne.name.trim(),
              relationshipToGuest: plusOne.relationshipToGuest.trim(),
            }))
            .filter(
              (plusOne) => plusOne.name && plusOne.relationshipToGuest,
            )
        : undefined,
    memoryNotes: normalizeOptionalString(notes.memoryNotes),
    sensitiveNotes: normalizeOptionalString(notes.sensitiveNotes),
    lastInteractionSummary: normalizeOptionalString(notes.lastInteractionSummary),
    extraNotes: normalizeOptionalString(notes.extraNotes),
  };

  return Object.values(normalized).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined,
  )
    ? normalized
    : undefined;
}

export const listGuests = query({
  args: {},
  handler: async (ctx) => {
    const guests = await ctx.db.query("guests").collect();

    return guests.sort((a, b) =>
      a.mainGuestName.localeCompare(b.mainGuestName, undefined, {
        sensitivity: "base",
      }),
    );
  },
});

export const updateGuest = mutation({
  args: {
    guestId: v.id("guests"),
    mainGuestName: v.string(),
    mainGuestConfirmed: v.optional(v.boolean()),
    plusOneName: v.optional(v.string()),
    additionalGuests: v.optional(additionalGuestValidator),
    slug: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    preferedLanguage: v.union(v.literal("en"), v.literal("ar")),
    notesForAI: v.optional(notesForAiValidator),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.guestId, {
      mainGuestName: args.mainGuestName.trim(),
      mainGuestConfirmed: args.mainGuestConfirmed,
      plusOneName: normalizeOptionalString(args.plusOneName),
      additionalGuests:
        args.additionalGuests && args.additionalGuests.length > 0
          ? args.additionalGuests.map((guest) => ({
              name: guest.name.trim(),
              confirmed: guest.confirmed,
              confirmedAt: normalizeOptionalString(guest.confirmedAt),
            }))
          : undefined,
      slug: args.slug.trim(),
      email: normalizeOptionalString(args.email),
      phone: args.phone.trim(),
      preferedLanguage: args.preferedLanguage,
      notesForAI: normalizeNotes(args.notesForAI),
    });
  },
});
