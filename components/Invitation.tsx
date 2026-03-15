"use client";

import { useState } from "react";
import DetailsPage from "@/components/DetailsPage";
import MainPage from "./MainPage";
import { type InvitationLanguage } from "@/lib/translations";

type InvitationProps = {
  slug?: string;
  mainGuest: string;
  plusOne?: string;
  language: InvitationLanguage;
  personalizedMode?: boolean;
};

export default function Invitation({
  slug,
  mainGuest,
  plusOne,
  language,
  personalizedMode = true,
}: InvitationProps) {
  const [page, setPage] = useState<"main" | "details">("main");
  const direction = language === "AR" ? "rtl" : "ltr";

  if (page === "details") {
    return (
      <div className="animate-in fade-in duration-500">
        <DetailsPage
          direction={direction}
          language={language}
          onBack={() => setPage("main")}
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <MainPage
        slug={slug}
        mainGuest={mainGuest}
        plusOne={plusOne}
        direction={direction}
        language={language}
        personalizedMode={personalizedMode}
        onShowDetails={() => setPage("details")}
      />
    </div>
  );
}
