import InvitationPage from "@/components/InvitationPage";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;

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

  return (
    <InvitationPage
      slug={slug}
      mainGuest={guest.mainGuestName}
      plusOne={guest.plusOneName}
      guests={guest.guests}
      direction={guest.preferedLanguage === "ar" ? "rtl" : "ltr"}
    />
  );
}
