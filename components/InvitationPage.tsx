import BottomLeftArch from "@/components/BottomLeftArch";
import BottomText from "@/components/BottomText";
import DateSection from "@/components/DateSection";
import { GoldenBorder } from "@/components/GoldenBorder";
import Names from "@/components/Names";
import TopRightArch from "@/components/TopRightArch";
import TopText from "@/components/TopText";
import RSVP from "@/components/RSVP";
type Guest = {
  name: string;
  confirmed?: boolean;
  confirmedAt?: string;
};

type InvitationPageProps = {
  slug?: string;
  mainGuest: string;
  plusOne?: string;
  guests?: Guest[];
  direction: "ltr" | "rtl";
};

export default function InvitationPage({
  slug,
  mainGuest,
  plusOne,
  guests,
  direction,
}: InvitationPageProps) {
  return (
    <main
      dir={direction}
      className="relative flex h-dvh max-h-dvh flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      <TopRightArch />
      <BottomLeftArch />
      <GoldenBorder />
      <TopText />
      <Names mainGuest={mainGuest} plusOne={plusOne} />
      <BottomText />
      <DateSection />
      {slug && guests && guests.length > 0 && (
        <RSVP slug={slug} guests={guests} />
      )}
    </main>
  );
}
