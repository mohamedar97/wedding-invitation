import Image from "next/image";

export default function TopRightArch() {
  return (
    <div className="pointer-events-none fixed top-0 right-0 z-10">
      <Image
        src="/tr.png"
        alt=""
        width={300}
        height={300}
        priority
        className="h-auto w-48 lg:w-full"
      />
    </div>
  );
}
