import BottomLeftArch from "@/components/BottomLeftArch";
import BottomText from "@/components/BottomText";
import { GoldenBorder } from "@/components/GoldenBorder";
import Names from "@/components/Names";
import TopRightArch from "@/components/TopRightArch";
import TopText from "@/components/TopText";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center"
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
      <Names />
      <BottomText />
    </main>
  );
}
