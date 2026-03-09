import BottomText from "@/components/BottomText";
import DateSection from "@/components/DateSection";
import Names from "@/components/Names";
import TopText from "@/components/TopText";
import LocationLink from "@/components/LocationLink";
import RSVP from "@/components/RSVP";
import { Guest } from "@/lib/types";
import Decorations from "./Decoration";
import { Cormorant_Garamond } from "next/font/google";
import { ChevronRightIcon } from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type MainPageProps = {
  slug?: string;
  mainGuest: string;
  mainGuestRsvp?: Guest;
  plusOne?: string;
  additionalGuests?: Guest[];
  direction: "ltr" | "rtl";
  personalizedMode?: boolean;
  onShowDetails: () => void;
};

export default function MainPage({
  slug,
  mainGuest,
  mainGuestRsvp,
  plusOne,
  additionalGuests,
  direction,
  personalizedMode = true,
  onShowDetails,
}: MainPageProps) {
  return (
    <Decorations direction={direction}>
      <TopText personalizedMode={personalizedMode} />
      <Names mainGuest={mainGuest} plusOne={plusOne} />
      <BottomText personalizedMode={personalizedMode} />
      <DateSection />
      <LocationLink />
      {slug && mainGuestRsvp && (
        <RSVP
          slug={slug}
          mainGuest={mainGuestRsvp}
          additionalGuests={additionalGuests ?? []}
        />
      )}
      <button
        onClick={onShowDetails}
        className={`${cormorant.className} relative z-20 mt-3 flex cursor-pointer items-center gap-1 text-base font-semibold tracking-widest text-[#834213] uppercase transition-colors hover:text-[#da9e20]`}
      >
        More Details
        <ChevronRightIcon className="size-4" />
      </button>
    </Decorations>
  );
}
