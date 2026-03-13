import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const languageMode = v.union(
  v.literal("english"),
  v.literal("arabic"),
  v.literal("franco"),
);

const gender = v.union(v.literal("male"), v.literal("female"));

const additionalGuestRelationship = v.union(
  v.literal("husband"),
  v.literal("wife"),
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

const additionalGuestValidator = v.array(
  v.object({
    id: v.optional(v.string()),
    name: v.string(),
    relationshipToGuest: additionalGuestRelationship,
    gender: gender,
    age: v.optional(v.number()),
    confirmed: v.optional(v.boolean()),
    confirmedAt: v.optional(v.string()),
  }),
);

const notesForAiValidator = v.object({
  languageMode: v.optional(languageMode),
  communicationStyle: v.optional(communicationStyle),
  relationshipToCouple: v.optional(relationshipToCouple),
  guestSide: v.optional(guestSide),
  relationship: v.optional(v.string()),
  personality: v.optional(v.string()),
  personalInfo: v.optional(v.string()),
  weddingContext: v.optional(v.string()),
  deepStuff: v.optional(v.string()),
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
    relationshipToGuest:
      | "husband"
      | "wife"
      | "son"
      | "daughter"
      | "brother"
      | "sister"
      | "father"
      | "mother"
      | "friend"
      | "colleague"
      | "other";
    gender: "male" | "female";
    age?: number;
    confirmed?: boolean;
    confirmedAt?: string;
  }[],
) {
  if (!additionalGuests?.length) {
    return undefined;
  }

  const usedIds = new Set<string>();
  const numericIds = additionalGuests
    .map((guest) => Number.parseInt(guest.id?.trim() ?? "", 10))
    .filter((id) => Number.isInteger(id) && id > 0);
  let nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;

  const normalized = additionalGuests
    .map((guest) => {
      const existingId = guest.id?.trim();
      const id =
        existingId && !usedIds.has(existingId)
          ? existingId
          : String(nextId++);

      usedIds.add(id);

      return {
        id,
        name: guest.name.trim(),
        relationshipToGuest: guest.relationshipToGuest,
        gender: guest.gender,
        age:
          guest.age !== undefined && Number.isFinite(guest.age)
            ? guest.age
            : undefined,
        confirmed: guest.confirmed,
        confirmedAt: normalizeOptionalString(guest.confirmedAt),
      };
    })
    .filter((guest) => guest.name);

  return normalized.length ? normalized : undefined;
}

function normalizeNotes(notes?: {
  languageMode?: "english" | "arabic" | "franco";
  communicationStyle?: "formal" | "warm" | "casual" | "playful";
  relationshipToCouple?:
    | "family"
    | "friend"
    | "colleague"
    | "family_friend"
    | "other";
  guestSide?: "groom" | "bride";
  relationship?: string;
  personality?: string;
  personalInfo?: string;
  weddingContext?: string;
  deepStuff?: string;
  extraNotes?: string;
}) {
  if (!notes) {
    return undefined;
  }

  const normalized = {
    languageMode: notes.languageMode,
    communicationStyle: notes.communicationStyle,
    relationshipToCouple: notes.relationshipToCouple,
    guestSide: notes.guestSide,
    relationship: normalizeOptionalString(notes.relationship),
    personality: normalizeOptionalString(notes.personality),
    personalInfo: normalizeOptionalString(notes.personalInfo),
    weddingContext: normalizeOptionalString(notes.weddingContext),
    deepStuff: normalizeOptionalString(notes.deepStuff),
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
    mainGuestGender: v.optional(gender),
    mainGuestAge: v.optional(v.number()),
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
      mainGuestGender: args.mainGuestGender,
      mainGuestAge: args.mainGuestAge,
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
    mainGuestGender: v.optional(gender),
    mainGuestAge: v.optional(v.number()),
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
    const mainGuestName = args.mainGuestName.trim();
    const slug = args.slug.trim();
    const phone = args.phone.trim();

    if (!mainGuestName) {
      throw new Error("Main guest name is required.");
    }

    if (!slug) {
      throw new Error("Slug is required.");
    }

    if (!phone) {
      throw new Error("Phone is required.");
    }

    const existingGuest = await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existingGuest && existingGuest._id !== args.guestId) {
      throw new Error("A guest with this slug already exists.");
    }

    await ctx.db.patch(args.guestId, {
      mainGuestName,
      mainGuestGender: args.mainGuestGender,
      mainGuestAge: args.mainGuestAge,
      mainGuestConfirmed: args.mainGuestConfirmed,
      plusOneName: normalizeOptionalString(args.plusOneName),
      additionalGuests: normalizeAdditionalGuests(args.additionalGuests),
      slug,
      email: normalizeOptionalString(args.email),
      phone,
      preferedLanguage: args.preferedLanguage,
      notesForAI: normalizeNotes(args.notesForAI),
    });
  },
});
