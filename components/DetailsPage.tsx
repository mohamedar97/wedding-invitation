import { Cormorant_Garamond } from "next/font/google";
import {
  ShirtIcon,
  CameraIcon,
  BabyIcon,
  LockKeyholeIcon,
  ClockIcon,
  ChevronLeftIcon,
} from "lucide-react";
import Decorations from "./Decoration";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
        className={`${cormorant.className} text-lg font-semibold tracking-widest text-[#834213] uppercase`}
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
  onBack: () => void;
};

export default function DetailsPage({ direction, onBack }: DetailsPageProps) {
  return (
    <Decorations direction={direction}>
      <div className="relative z-20 flex flex-col items-center gap-3 px-12">
        <h2
          className={`${cormorant.className} text-3xl font-semibold tracking-widest text-[#834213] sm:text-4xl`}
        >
          Details
        </h2>

        <div className="h-px w-24 bg-[#da9e20]/50" />

        <SectionCard icon={ShirtIcon} title="Dress Code">
          Formal Attire
        </SectionCard>

        <div className="h-px w-16 bg-[#da9e20]/30" />

        <SectionCard icon={CameraIcon} title="Photo Gallery">
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#834213] underline underline-offset-2 transition-colors hover:text-[#da9e20]"
          >
            Upload & view photos on Google Drive
          </a>
        </SectionCard>

        <div className="h-px w-16 bg-[#da9e20]/30" />

        <SectionCard icon={BabyIcon} title="Adults-Only Celebration">
          We wish your loved ones a lovely night. The event is adults-only.
        </SectionCard>

        <div className="h-px w-16 bg-[#da9e20]/30" />

        <SectionCard icon={LockKeyholeIcon} title="Invitation Note">
          This invitation is reserved especially for you. Please don't share it
          with anyone.
        </SectionCard>

        <div className="h-px w-16 bg-[#da9e20]/30" />
      </div>

      <button
        onClick={onBack}
        className={`${cormorant.className} relative z-20 mt-4 flex cursor-pointer items-center gap-1 text-base font-semibold tracking-widest text-[#834213] uppercase transition-colors hover:text-[#da9e20]`}
      >
        <ChevronLeftIcon className="size-4" />
        Back
      </button>
    </Decorations>
  );
}
