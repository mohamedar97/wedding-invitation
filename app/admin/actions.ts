"use server";

import { revalidatePath } from "next/cache";

export async function revalidateInvitationPaths({
  slug,
  previousSlug,
}: {
  slug: string;
  previousSlug?: string;
}) {
  const normalizedSlug = slug.trim();
  const normalizedPreviousSlug = previousSlug?.trim();

  if (!normalizedSlug) {
    throw new Error("Slug is required for revalidation.");
  }

  revalidatePath(`/${normalizedSlug}`);

  if (
    normalizedPreviousSlug &&
    normalizedPreviousSlug !== normalizedSlug
  ) {
    revalidatePath(`/${normalizedPreviousSlug}`);
  }
}
