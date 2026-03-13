import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type RevalidateGuestRequest = {
  slug?: string;
  previousSlug?: string;
};

function normalizeSlug(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RevalidateGuestRequest;
    const slug = normalizeSlug(body.slug);
    const previousSlug = normalizeSlug(body.previousSlug);

    if (!slug && !previousSlug) {
      return NextResponse.json(
        { error: "A slug or previous slug is required." },
        { status: 400 },
      );
    }

    if (slug) {
      revalidatePath(`/${slug}`);
    }

    if (previousSlug && previousSlug !== slug) {
      revalidatePath(`/${previousSlug}`);
    }

    return NextResponse.json({
      revalidated: true,
      slug,
      previousSlug,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revalidate guest path.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
