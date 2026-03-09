import BottomText from "@/components/BottomText";
import DateSection from "@/components/DateSection";
import Names from "@/components/Names";
import TopText from "@/components/TopText";
import LocationLink from "@/components/LocationLink";
import RSVP from "@/components/RSVP";
import { Guest } from "@/lib/types";
import Decorations from "./Decoration";

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
    <Decorations direction={direction}>
      <TopText personalizedMode={personalizedMode} />
      <Names mainGuest={mainGuest} plusOne={plusOne} />
      <BottomText personalizedMode={personalizedMode} />
      <DateSection />
      <LocationLink />
      {slug && guests && guests.length > 0 && (
        <RSVP slug={slug} guests={guests} />
      )}
    </Decorations>
  );
}
