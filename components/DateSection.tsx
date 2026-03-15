import {
  formatInvitationNumber,
  getTranslation,
  invitationTranslations,
  type InvitationLanguage,
} from "@/lib/translations";

function SideBox({ label }: { label: string }) {
  return (
    <div className="border-y border-[#834213] text-[#da9e20] uppercase py-1 w-24 text-center text-md font-medium">
      {label}
    </div>
  );
}

export default function DateSection({
  language,
}: {
  language: InvitationLanguage;
}) {
  return (
    <section
      className={`relative z-20 w-full pt-1 flex items-center justify-center gap-6`}
    >
      <SideBox
        label={getTranslation(invitationTranslations.date.day, language)}
      />
      <div className="flex flex-col items-center text-[#834213]">
        <span className={`text-lg font-medium`}>
          {getTranslation(invitationTranslations.date.month, language)}
        </span>
        <span className={`text-5xl font-semibold`}>
          {formatInvitationNumber(18, language)}
        </span>
        <span className={`text-lg font-medium`}>
          {formatInvitationNumber(2026, language)}
        </span>
      </div>
      <SideBox
        label={getTranslation(invitationTranslations.date.time, language)}
      />
    </section>
  );
}
