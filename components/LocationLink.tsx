import { MapPinIcon } from "lucide-react";
import {
  getTranslation,
  invitationTranslations,
  type InvitationLanguage,
} from "@/lib/translations";

export default function LocationLink({
  language,
}: {
  language: InvitationLanguage;
}) {
  return (
    <a
      href="https://maps.app.goo.gl/eBPPt4s8BiJTbbE2A"
      target="_blank"
      rel="noopener noreferrer"
      className={`relative z-20 mt-1 flex items-center gap-1.5 text-lg font-medium text-[#834213] transition-colors hover:text-[#da9e20] underline`}
    >
      <MapPinIcon className="size-4 animate-bounce" />
      {getTranslation(invitationTranslations.location.venue, language)}
    </a>
  );
}
