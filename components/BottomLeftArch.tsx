import Image from "next/image";

export default function BottomLeftArch() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-10">
      <Image
        src="/bl.png"
        alt=""
        width={480}
        height={480}
        priority
        className="h-auto w-64 lg:w-full"
      />
    </div>
  );
}
