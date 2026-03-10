import { MapPinIcon } from "lucide-react";

export default function LocationLink() {
  return (
    <a
      href="https://maps.app.goo.gl/eBPPt4s8BiJTbbE2A"
      target="_blank"
      rel="noopener noreferrer"
      className={`relative z-20 mt-2 flex items-center gap-1.5 text-lg font-medium text-[#834213] transition-colors hover:text-[#da9e20] underline`}
    >
      <MapPinIcon className="size-4 animate-bounce" />
      Aurora Lounge
    </a>
  );
}
