import BottomLeftArch from "@/components/BottomLeftArch";
import { GoldenBorder } from "@/components/GoldenBorder";
import TopRightArch from "@/components/TopRightArch";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      <TopRightArch />
      <BottomLeftArch />
      <GoldenBorder />
    </main>
  );
}
