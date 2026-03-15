import {
  getTranslation,
  invitationTranslations,
  type InvitationLanguage,
} from "@/lib/translations";

export default function TopText({
  personalizedMode = true,
  language,
}: {
  personalizedMode?: boolean;
  language: InvitationLanguage;
}) {
  return (
    <div className="relative z-20 flex justify-center px-12 pt-2 text-center">
      <p className="max-w-3xl text-sm font-medium tracking-[0.3em] text-[#da9e20] uppercase sm:text-sm">
        {getTranslation(
          personalizedMode
            ? invitationTranslations.bottomText.personalized
            : invitationTranslations.bottomText.generic,
          language,
        )}
      </p>
    </div>
  );
}
