function SideBox({ label }: { label: string }) {
  return (
    <div className="border-y border-[#834213] text-[#da9e20] uppercase py-1 w-24 text-center text-md font-medium">
      {label}
    </div>
  );
}

export default function DateSection() {
  return (
    <section
      className={`relative z-20 w-full pt-2 flex items-center justify-center gap-6`}
    >
      <SideBox label="Saturday" />
      <div className="flex flex-col items-center text-[#834213]">
        <span className={`text-lg font-medium`}>April</span>
        <span className={`text-6xl font-semibold`}>18</span>
        <span className={`text-lg font-medium`}>2026</span>
      </div>
      <SideBox label="6 PM" />
    </section>
  );
}
