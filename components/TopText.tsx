export default function TopText({
  personalizedMode = true,
}: {
  personalizedMode?: boolean;
}) {
  return (
    <div className="relative z-20 flex justify-center px-12 pb-2 text-center">
      <p className="max-w-3xl text-sm font-medium tracking-[0.3em] text-[#da9e20] uppercase">
        {personalizedMode
          ? "Mohamed & Habiba, together with their families, invite"
          : "Together with their families with hearts full of love"}
      </p>
    </div>
  );
}
