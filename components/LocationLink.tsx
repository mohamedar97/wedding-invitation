import { MapPinIcon } from "lucide-react";
import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function LocationLink() {
  return (
    <a
      href="https://maps.app.goo.gl/eBPPt4s8BiJTbbE2A"
      target="_blank"
      rel="noopener noreferrer"
      className={`${cormorant.className} relative z-20 mt-3 flex items-center gap-1.5 text-lg font-medium text-[#834213] transition-colors hover:text-[#da9e20]`}
    >
      <MapPinIcon className="size-4" />
      Aurora Lounge
    </a>
  );
}
