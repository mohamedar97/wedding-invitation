import { v } from "convex/values";
import { query } from "./_generated/server";

function normalizePhone(phone: string) {
  return phone.replace(/^whatsapp:/, "").replace(/\D/g, "");
}

function phoneVariants(phone: string) {
  const normalized = normalizePhone(phone);
  const variants = new Set([normalized]);

  if (normalized.startsWith("20") && normalized.length > 2) {
    variants.add(`0${normalized.slice(2)}`);
  }

  if (normalized.startsWith("0") && normalized.length > 1) {
    variants.add(normalized.slice(1));
  }

  return variants;
}

function phonesMatch(a: string, b: string) {
  const aVariants = phoneVariants(a);
  const bVariants = phoneVariants(b);

  for (const aVariant of aVariants) {
    for (const bVariant of bVariants) {
      if (aVariant === bVariant) {
        return true;
      }

      if (
        aVariant.length >= 10 &&
        bVariant.length >= 10 &&
        (aVariant.endsWith(bVariant) || bVariant.endsWith(aVariant))
      ) {
        return true;
      }
    }
  }

  return false;
}

export const get = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getByPhone = query({
  args: {
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const exactMatch = await ctx.db
      .query("guests")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();

    if (exactMatch) {
      return exactMatch;
    }

    const guests = await ctx.db.query("guests").collect();

    return guests.find((guest) => phonesMatch(guest.phone, args.phone));
  },
});

export const getSlugs = query({
  handler: async (ctx) => {
    const guests = await ctx.db.query("guests").collect();
    return guests.map(({ slug }) => slug);
  },
});
