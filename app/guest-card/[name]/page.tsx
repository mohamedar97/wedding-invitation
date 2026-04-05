import GuestNameCard from "@/components/GuestNameCard";

type GuestCardPreviewPageProps = {
  params: Promise<{
    name: string;
  }>;
  searchParams: Promise<{
    table?: string;
  }>;
};

export default async function GuestCardPreviewPage({
  params,
  searchParams,
}: GuestCardPreviewPageProps) {
  const { name } = await params;
  const { table } = await searchParams;
  const tableNumber = table ? Number.parseInt(table, 10) : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-200/70 px-6 py-10">
      <div className="rounded-[2rem] border border-stone-300/80 bg-white/70 p-6 shadow-2xl backdrop-blur-sm">
        <GuestNameCard
          name={decodeURIComponent(name)}
          tableNumber={Number.isFinite(tableNumber) ? tableNumber : undefined}
          className="overflow-hidden rounded-[1.5rem] shadow-xl"
        />
      </div>
    </main>
  );
}
