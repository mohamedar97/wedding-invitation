import BottomLeftArch from "@/components/BottomLeftArch";
import BottomText from "@/components/BottomText";
import DateSection from "@/components/DateSection";
import { GoldenBorder } from "@/components/GoldenBorder";
import Names from "@/components/Names";
import TopRightArch from "@/components/TopRightArch";
import TopText from "@/components/TopText";

type InvitationPageProps = {
  mainGuest: string;
  plusOne?: string;
  direction: "ltr" | "rtl";
};

export default function InvitationPage({
  mainGuest,
  plusOne,
  direction,
}: InvitationPageProps) {
  return (
    <main
      dir={direction}
      className="relative flex h-dvh max-h-dvh flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      <TopRightArch />
      <BottomLeftArch />
      <GoldenBorder />
      <TopText />
      <Names mainGuest={mainGuest} plusOne={plusOne} />
      <BottomText />
      <DateSection />
    </main>
  );
}
