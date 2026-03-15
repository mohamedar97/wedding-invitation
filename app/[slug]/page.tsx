import Invitation from "@/components/Invitation";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { type InvitationLanguage } from "@/lib/translations";
import { notFound } from "next/navigation";

export const dynamic = "force-static";

type GuestPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await fetchQuery(api.getGuests.getSlugs);

  return slugs.map((slug) => ({ slug }));
}

export default async function GuestPage({ params }: GuestPageProps) {
  const { slug } = await params;
  const guest = await fetchQuery(api.getGuests.get, { slug });

  if (!guest) {
    notFound();
  }

  const language: InvitationLanguage =
    guest.preferedLanguage === "ar" ? "AR" : "EN";

  return (
    <Invitation
      slug={slug}
      mainGuest={guest.mainGuestName}
      plusOne={guest.plusOneName}
      language={language}
    />
  );
}
