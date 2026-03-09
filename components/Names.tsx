import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type NamesProps = {
  mainGuest: string;
  plusOne?: string;
};

export default function Names({ mainGuest, plusOne }: NamesProps) {
  return (
    <section className="relative z-20 flex flex-col items-center px-8 pt-4 text-center">
      <div className="flex flex-col items-center leading-none text-[#834213]">
        <h1
          className={`${cormorant.className} text-5xl font-semibold tracking-[0.08em]`}
        >
          {mainGuest}
        </h1>
        {plusOne ? (
          <>
            <span
              className={`${cormorant.className} my-2 text-3xl italic text-[#834213] sm:my-3 sm:text-4xl md:text-5xl`}
            >
              &
            </span>
            <h1
              className={`${cormorant.className} text-5xl font-semibold tracking-[0.08em] text-[#834213]`}
            >
              {plusOne}
            </h1>
          </>
        ) : null}
      </div>
    </section>
  );
}
