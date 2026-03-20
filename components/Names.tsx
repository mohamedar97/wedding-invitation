import localFont from "next/font/local";
import { type InvitationLanguage } from "@/lib/translations";

const aboveTheScript = localFont({
  src: "../public/above-the-beyond-script.ttf",
});

const ukijDiy = localFont({
  src: "../public/UKIJDiY.ttf",
});

type NamesProps = {
  mainGuest: string;
  plusOne?: string;
  language: InvitationLanguage;
};

export default function Names({ mainGuest, plusOne, language }: NamesProps) {
  const scriptFontClassName =
    language === "AR" ? ukijDiy.className : aboveTheScript.className;

  return (
    <section className="relative z-20 flex flex-col items-center px-8 pt-2 pb-4 text-center">
      <div className="flex flex-col items-center leading-none text-[#834213]">
        <h1 className={`${scriptFontClassName} text-5xl tracking-[0.04em]`}>
          {mainGuest}
        </h1>
        {plusOne ? (
          <>
            <span
              className={`${scriptFontClassName} mt-4 mb-2 text-2xl italic text-[#834213] sm:mt-5 sm:mb-3 sm:text-3xl md:text-4xl`}
            >
              &
            </span>
            <h1
              className={`${scriptFontClassName} text-5xl tracking-[0.04em] text-[#834213]`}
            >
              {plusOne}
            </h1>
          </>
        ) : null}
      </div>
    </section>
  );
}
