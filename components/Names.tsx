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
          className={`${cormorant.className} text-5xl font-semibold tracking-[0.08em] sm:text-7xl md:text-8xl`}
        >
          {mainGuest}
        </h1>
        {plusOne ? (
          <>
            <span
              className={`${cormorant.className} my-4 text-3xl italic text-[#834213] sm:my-5 sm:text-4xl md:text-5xl`}
            >
              &
            </span>
            <h1
              className={`${cormorant.className} text-5xl font-semibold tracking-[0.08em] text-[#834213] sm:text-7xl md:text-8xl`}
            >
              {plusOne}
            </h1>
          </>
        ) : null}
      </div>
    </section>
  );
}
