"use client";

import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { Cormorant_Garamond } from "next/font/google";
import { useState } from "react";
import { Guest } from "@/lib/types";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type RSVPProps = {
  slug: string;
  guests: Guest[];
};

export default function RSVP({ slug, guests: initialGuests }: RSVPProps) {
  const [guests, setGuests] = useState(initialGuests);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const updateGuest = useMutation(api.rsvp.updateGuestConfirmation);
  if (!guests) return null;
  const allResponded = guests.every((g) => g.confirmed !== undefined);

  async function handleToggle(index: number, confirmed: boolean) {
    setLoadingIndex(index);
    try {
      await updateGuest({ slug, guestIndex: index, confirmed });
      setGuests((prev) =>
        prev.map((g, i) =>
          i === index
            ? { ...g, confirmed, confirmedAt: new Date().toISOString() }
            : g,
        ),
      );
    } finally {
      setLoadingIndex(null);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={`${cormorant.className} relative z-20 mt-4 cursor-pointer border border-[#834213] bg-transparent px-8 py-2 text-lg font-semibold tracking-widest text-[#834213] uppercase transition-colors hover:bg-[#834213]/10`}
        >
          RSVP
        </button>
      </DialogTrigger>
      <DialogContent className="border-[#834213]/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className={`${cormorant.className} text-center text-2xl font-semibold text-[#834213]`}
          >
            RSVP
          </DialogTitle>
          <DialogDescription className="text-center">
            Please confirm attendance for each guest.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {guests.map((guest, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-[#834213]/20 px-4 py-3"
            >
              <span
                className={`${cormorant.className} text-lg font-medium text-[#834213]`}
              >
                {guest.name}
              </span>

              <div className="flex items-center gap-2">
                {loadingIndex === index ? (
                  <Loader2Icon className="size-5 animate-spin text-[#834213]/50" />
                ) : (
                  <>
                    <button
                      onClick={() => handleToggle(index, true)}
                      className={`flex size-9 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                        guest.confirmed === true
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-emerald-500/40 text-emerald-500/40 hover:border-emerald-500 hover:text-emerald-500"
                      }`}
                      aria-label={`Confirm ${guest.name}`}
                    >
                      <CheckIcon className="size-5" />
                    </button>
                    <button
                      onClick={() => handleToggle(index, false)}
                      className={`flex size-9 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                        guest.confirmed === false
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-red-500/40 text-red-500/40 hover:border-red-500 hover:text-red-500"
                      }`}
                      aria-label={`Decline ${guest.name}`}
                    >
                      <XIcon className="size-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {allResponded && (
          <p
            className={`${cormorant.className} text-center text-sm text-[#834213]/70`}
          >
            Thank you for responding!
          </p>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
