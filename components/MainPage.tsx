import BottomText from "@/components/BottomText";
import DateSection from "@/components/DateSection";
import Names from "@/components/Names";
import TopText from "@/components/TopText";
import LocationLink from "@/components/LocationLink";
import RSVP from "@/components/RSVP";
import Decorations from "./Decoration";
import { ChevronLeftIcon, ChevronRightIcon, MessageCircle } from "lucide-react";
import {
  getTranslation,
  invitationTranslations,
  type InvitationLanguage,
} from "@/lib/translations";

type MainPageProps = {
  slug?: string;
  mainGuest: string;
  plusOne?: string;
  direction: "ltr" | "rtl";
  language: InvitationLanguage;
  personalizedMode?: boolean;
  onShowDetails: () => void;
};

export default function MainPage({
  slug,
  mainGuest,
  plusOne,
  direction,
  language,
  personalizedMode = true,
  onShowDetails,
}: MainPageProps) {
  const helpMessage = encodeURIComponent(
    getTranslation(invitationTranslations.actions.helpMessage, language),
  );
  const DetailsChevron = language === "AR" ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <Decorations direction={direction}>
      <TopText personalizedMode={personalizedMode} language={language} />
      <Names mainGuest={mainGuest} plusOne={plusOne} />
      <BottomText personalizedMode={personalizedMode} language={language} />
      <DateSection language={language} />
      <LocationLink language={language} />
      {slug && <RSVP slug={slug} language={language} direction={direction} />}
      <button
        onClick={onShowDetails}
        className={`relative z-20 mt-2 flex cursor-pointer items-center gap-1 text-base font-semibold tracking-widest text-[#834213] uppercase transition-colors hover:text-[#da9e20]`}
      >
        {getTranslation(invitationTranslations.actions.moreDetails, language)}
        <DetailsChevron className="size-4" />
      </button>
      <a
        href={`https://wa.me/+201130827410?text=${helpMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-20 mt-1 flex cursor-pointer items-center gap-1.5 text-sm font-medium tracking-wide text-[#834213]/70 transition-colors hover:text-[#25D366]"
      >
        <MessageCircle className="size-4" />
        {getTranslation(invitationTranslations.actions.needHelp, language)}
      </a>
    </Decorations>
  );
}
