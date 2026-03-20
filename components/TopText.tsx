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
  const textClassName =
    language === "AR"
      ? "max-w-3xl text-sm font-medium text-[#da9e20]"
      : "max-w-3xl text-sm font-medium tracking-[0.3em] text-[#da9e20] uppercase";

  return (
    <div className="relative z-20 flex justify-center px-12 pb-2 text-center">
      <p className={textClassName}>
        {getTranslation(
          personalizedMode
            ? invitationTranslations.topText.personalized
            : invitationTranslations.topText.generic,
          language,
        )}
      </p>
    </div>
  );
}
