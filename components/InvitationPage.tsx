"use client";

import { useState } from "react";
import BottomText from "@/components/BottomText";
import DateSection from "@/components/DateSection";
import Names from "@/components/Names";
import TopText from "@/components/TopText";
import LocationLink from "@/components/LocationLink";
import RSVP from "@/components/RSVP";
import DetailsPage from "@/components/DetailsPage";
import { Guest } from "@/lib/types";
import Decorations from "./Decoration";
import { Cormorant_Garamond } from "next/font/google";
import { ChevronRightIcon } from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
  const [page, setPage] = useState<"invitation" | "details">("invitation");

  if (page === "details") {
    return (
      <div className="animate-in fade-in duration-500">
        <DetailsPage
          direction={direction}
          onBack={() => setPage("invitation")}
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <Decorations direction={direction}>
        <TopText personalizedMode={personalizedMode} />
        <Names mainGuest={mainGuest} plusOne={plusOne} />
        <BottomText personalizedMode={personalizedMode} />
        <DateSection />
        <LocationLink />
        {slug && guests && guests.length > 0 && (
          <RSVP slug={slug} guests={guests} />
        )}
        <button
          onClick={() => setPage("details")}
          className={`${cormorant.className} relative z-20 mt-3 flex cursor-pointer items-center gap-1 text-base font-semibold tracking-widest text-[#834213] uppercase transition-colors hover:text-[#da9e20]`}
        >
          More Details
          <ChevronRightIcon className="size-4" />
        </button>
      </Decorations>
    </div>
  );
}
