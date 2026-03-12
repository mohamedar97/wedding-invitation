import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const languageMode = v.union(
  v.literal("english"),
  v.literal("arabic"),
  v.literal("franco"),
);

const additionalGuestValidator = v.array(
  v.object({
    id: v.optional(v.string()),
    name: v.string(),
    relationshipToGuest: v.string(),
    gender: v.string(),
    confirmed: v.optional(v.boolean()),
    confirmedAt: v.optional(v.string()),
  }),
);

const notesForAiValidator = v.object({
  relationshipToCouple: v.optional(v.string()),
  languageMode: v.optional(languageMode),
  communicationStyle: v.optional(v.string()),
  extraNotes: v.optional(v.string()),
});

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeAdditionalGuests(
  additionalGuests?: {
    id?: string;
    name: string;
    relationshipToGuest: string;
    gender: string;
    confirmed?: boolean;
    confirmedAt?: string;
  }[],
) {
  if (!additionalGuests?.length) {
    return undefined;
  }

  const usedIds = new Set<string>();

  const normalized = additionalGuests
    .map((guest) => {
      const existingId = guest.id?.trim();
      const id =
        existingId && !usedIds.has(existingId)
          ? existingId
          : crypto.randomUUID();

      usedIds.add(id);

      return {
        id,
        name: guest.name.trim(),
        relationshipToGuest: guest.relationshipToGuest.trim(),
        gender: guest.gender.trim(),
        confirmed: guest.confirmed,
        confirmedAt: normalizeOptionalString(guest.confirmedAt),
      };
    })
    .filter((guest) => guest.name && guest.relationshipToGuest && guest.gender);

  return normalized.length ? normalized : undefined;
}

function normalizeNotes(notes?: {
  relationshipToCouple?: string;
  languageMode?: "english" | "arabic" | "franco";
  communicationStyle?: string;
  extraNotes?: string;
}) {
  if (!notes) {
    return undefined;
  }

  const normalized = {
    relationshipToCouple: normalizeOptionalString(notes.relationshipToCouple),
    languageMode: notes.languageMode,
    communicationStyle: normalizeOptionalString(notes.communicationStyle),
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

export const createGuest = mutation({
  args: {
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
    const slug = args.slug.trim();

    if (!args.mainGuestName.trim()) {
      throw new Error("Main guest name is required.");
    }

    if (!slug) {
      throw new Error("Slug is required.");
    }

    if (!args.phone.trim()) {
      throw new Error("Phone is required.");
    }

    const existingGuest = await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existingGuest) {
      throw new Error("A guest with this slug already exists.");
    }

    return await ctx.db.insert("guests", {
      mainGuestName: args.mainGuestName.trim(),
      mainGuestConfirmed: args.mainGuestConfirmed,
      plusOneName: normalizeOptionalString(args.plusOneName),
      additionalGuests: normalizeAdditionalGuests(args.additionalGuests),
      slug,
      email: normalizeOptionalString(args.email),
      phone: args.phone.trim(),
      preferedLanguage: args.preferedLanguage,
      notesForAI: normalizeNotes(args.notesForAI),
    });
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
      additionalGuests: normalizeAdditionalGuests(args.additionalGuests),
      slug: args.slug.trim(),
      email: normalizeOptionalString(args.email),
      phone: args.phone.trim(),
      preferedLanguage: args.preferedLanguage,
      notesForAI: normalizeNotes(args.notesForAI),
    });
  },
});
