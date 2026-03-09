"use client";

import { useState } from "react";
import DetailsPage from "@/components/DetailsPage";
import { Guest } from "@/lib/types";
import MainPage from "./MainPage";

type InvitationProps = {
  slug?: string;
  mainGuest: string;
  mainGuestRsvp?: Guest;
  plusOne?: string;
  additionalGuests?: Guest[];
  direction: "ltr" | "rtl";
  personalizedMode?: boolean;
};

export default function Invitation({
  slug,
  mainGuest,
  mainGuestRsvp,
  plusOne,
  additionalGuests,
  direction,
  personalizedMode = true,
}: InvitationProps) {
  const [page, setPage] = useState<"main" | "details">("main");

  if (page === "details") {
    return (
      <div className="animate-in fade-in duration-500">
        <DetailsPage direction={direction} onBack={() => setPage("main")} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <MainPage
        slug={slug}
        mainGuest={mainGuest}
        mainGuestRsvp={mainGuestRsvp}
        plusOne={plusOne}
        additionalGuests={additionalGuests}
        direction={direction}
        personalizedMode={personalizedMode}
        onShowDetails={() => setPage("details")}
      />
    </div>
  );
}
