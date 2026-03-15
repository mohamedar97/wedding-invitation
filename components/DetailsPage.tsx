import {
  CameraIcon,
  BabyIcon,
  LockKeyholeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "lucide-react";
import Decorations from "./Decoration";
import {
  getTranslation,
  invitationTranslations,
  type InvitationLanguage,
} from "@/lib/translations";

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Icon className="size-5 text-[#da9e20]" />
      <h3
        className={`text-lg font-semibold tracking-widest text-[#834213] uppercase`}
      >
        {title}
      </h3>
      <p className="max-w-xs text-xs leading-relaxed font-medium tracking-wide text-[#834213]/80">
        {children}
      </p>
    </div>
  );
}

type DetailsPageProps = {
  direction: "ltr" | "rtl";
  language: InvitationLanguage;
  onBack: () => void;
};

export default function DetailsPage({
  direction,
  language,
  onBack,
}: DetailsPageProps) {
  const BackChevron = language === "AR" ? ChevronRightIcon : ChevronLeftIcon;

  return (
    <Decorations direction={direction}>
      <div className="relative z-20 flex flex-col items-center gap-3 px-12">
        <h2
          className={`text-3xl font-semibold tracking-widest text-[#834213] sm:text-4xl`}
        >
          {getTranslation(invitationTranslations.details.title, language)}
        </h2>

        <div className="h-px w-16 bg-[#da9e20]/30" />

        <SectionCard
          icon={CameraIcon}
          title={getTranslation(
            invitationTranslations.details.photoGalleryTitle,
            language,
          )}
        >
          <a
            href="https://drive.google.com/drive/folders/1aoR_R2I-IJar0GbiRHpDYpJ2F0sCDCED?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#834213] underline underline-offset-2 transition-colors hover:text-[#da9e20]"
          >
            {getTranslation(
              invitationTranslations.details.photoGalleryBody,
              language,
            )}
          </a>
        </SectionCard>

        <div className="h-px w-16 bg-[#da9e20]/30" />

        <SectionCard
          icon={BabyIcon}
          title={getTranslation(
            invitationTranslations.details.adultsOnlyTitle,
            language,
          )}
        >
          {getTranslation(invitationTranslations.details.adultsOnlyBody, language)}
        </SectionCard>

        <div className="h-px w-16 bg-[#da9e20]/30" />

        <SectionCard
          icon={LockKeyholeIcon}
          title={getTranslation(
            invitationTranslations.details.invitationNoteTitle,
            language,
          )}
        >
          {getTranslation(
            invitationTranslations.details.invitationNoteBody,
            language,
          )}
        </SectionCard>

        <div className="h-px w-16 bg-[#da9e20]/30" />
      </div>

      <button
        onClick={onBack}
        className={`relative z-20 mt-4 flex cursor-pointer items-center gap-1 text-base font-semibold tracking-widest text-[#834213] uppercase transition-colors hover:text-[#da9e20]`}
      >
        <BackChevron className="size-4" />
        {getTranslation(invitationTranslations.actions.back, language)}
      </button>
    </Decorations>
  );
}
