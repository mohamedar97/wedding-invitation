import BottomLeftArch from "@/components/BottomLeftArch";
import BottomText from "@/components/BottomText";
import DateSection from "@/components/DateSection";
import { GoldenBorder } from "@/components/GoldenBorder";
import Names from "@/components/Names";
import TopRightArch from "@/components/TopRightArch";
import TopText from "@/components/TopText";
import LocationLink from "@/components/LocationLink";
import RSVP from "@/components/RSVP";
import { Guest } from "@/lib/types";

type InvitationPageProps = {
  slug?: string;
  mainGuest: string;
  plusOne?: string;
  guests?: Guest[];
  direction: "ltr" | "rtl";
  personalizedMode?: boolean;
};

export default function InvitationPage({
  slug,
  mainGuest,
  plusOne,
  guests,
  direction,
  personalizedMode = true,
}: InvitationPageProps) {
  return (
    <main
      dir={direction}
      className="relative flex h-dvh max-h-dvh flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/background.webp')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      <TopRightArch />
      <BottomLeftArch />
      <GoldenBorder />
      <TopText personalizedMode={personalizedMode} />
      <Names mainGuest={mainGuest} plusOne={plusOne} />
      <BottomText personalizedMode={personalizedMode} />
      <DateSection />
      <LocationLink />
      {slug && guests && guests.length > 0 && (
        <RSVP slug={slug} guests={guests} />
      )}
    </main>
  );
}
