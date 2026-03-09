import BottomLeftArch from "./BottomLeftArch";
import { GoldenBorder } from "./GoldenBorder";
import TopRightArch from "./TopRightArch";

export default function Decorations({
  children,
  direction,
}: {
  direction: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  return (
    <main
      dir={direction}
      className="relative flex h-dvh max-h-dvh flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/background.webp')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      <TopRightArch />
      <BottomLeftArch />
      <GoldenBorder />
      {children}
    </main>
  );
}
