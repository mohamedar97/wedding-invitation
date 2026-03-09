import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function Names() {
  return (
    <section className="relative z-20 flex flex-col items-center px-8 pt-16 text-center sm:pt-20 md:pt-24">
      <div className="flex flex-col items-center leading-none text-[#6f5114]">
        <h1
          className={`${cormorant.className} text-5xl font-semibold tracking-[0.08em] sm:text-7xl md:text-8xl`}
        >
          Mohamed
        </h1>
        <span
          className={`${cormorant.className} my-4 text-3xl italic text-[#b68a2d] sm:my-5 sm:text-4xl md:text-5xl`}
        >
          &
        </span>
        <h1
          className={`${cormorant.className} text-5xl font-semibold tracking-[0.08em] sm:text-7xl md:text-8xl`}
        >
          Habiba
        </h1>
      </div>
    </section>
  );
}
