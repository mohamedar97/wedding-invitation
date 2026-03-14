import BottomText from "@/components/BottomText";
import DateSection from "@/components/DateSection";
import Names from "@/components/Names";
import TopText from "@/components/TopText";
import LocationLink from "@/components/LocationLink";
import RSVP from "@/components/RSVP";
import Decorations from "./Decoration";
import { ChevronRightIcon, MessageCircle } from "lucide-react";

type MainPageProps = {
  slug?: string;
  mainGuest: string;
  plusOne?: string;
  direction: "ltr" | "rtl";
  personalizedMode?: boolean;
  onShowDetails: () => void;
};

export default function MainPage({
  slug,
  mainGuest,
  plusOne,
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
      {slug && <RSVP slug={slug} />}
      <button
        onClick={onShowDetails}
        className={`relative z-20 mt-2 flex cursor-pointer items-center gap-1 text-base font-semibold tracking-widest text-[#834213] uppercase transition-colors hover:text-[#da9e20]`}
      >
        More Details
        <ChevronRightIcon className="size-4" />
      </button>
      <a
        href="https://wa.me/+201130827410?text=Hi%20I%20need%20some%20help"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-20 mt-1 flex cursor-pointer items-center gap-1.5 text-sm font-medium tracking-wide text-[#834213]/70 transition-colors hover:text-[#25D366]"
      >
        <MessageCircle className="size-4" />
        Need help?
      </a>
    </Decorations>
  );
}
