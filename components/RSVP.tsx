"use client";

import { api } from "@/convex/_generated/api";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQuery } from "convex/react";
import { CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getTranslation,
  invitationTranslations,
  type InvitationLanguage,
} from "@/lib/translations";

type RSVPProps = {
  slug: string;
  language: InvitationLanguage;
  direction: "ltr" | "rtl";
};

type RSVPEntry = {
  kind: "main" | "guest";
  guestId?: string;
  name: string;
  confirmed?: boolean;
  confirmedAt?: string;
};

export default function RSVP({ slug, language, direction }: RSVPProps) {
  const guestRecord = useQuery(api.getGuests.get, { slug });
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);
  const updateGuest = useMutation(api.rsvp.updateGuestConfirmation);
  const rsvpEntries: RSVPEntry[] = !guestRecord
    ? []
    : [
        {
          kind: "main",
          name: guestRecord.mainGuestName,
          confirmed: guestRecord.mainGuestConfirmed,
          confirmedAt: guestRecord.mainGuestConfirmedAt,
        },
        ...(guestRecord.additionalGuests ?? []).map((guest) => ({
          ...guest,
          kind: "guest" as const,
          guestId: guest.id,
        })),
      ];
  const allResponded = rsvpEntries.every(
    (guest) => guest.confirmed !== undefined,
  );

  async function handleToggle(entry: RSVPEntry, confirmed: boolean) {
    const loadingKey =
      entry.kind === "main" ? "main" : `guest-${entry.guestId}`;
    setLoadingTarget(loadingKey);
    try {
      await updateGuest({
        slug,
        isMainGuest: entry.kind === "main",
        additionalGuestId: entry.guestId,
        confirmed,
      });
    } finally {
      setLoadingTarget(null);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={` relative z-20 mt-2 cursor-pointer border border-[#834213] bg-transparent px-8 py-2 text-lg font-semibold tracking-widest text-[#834213] uppercase transition-colors hover:bg-[#834213]/10`}
        >
          {getTranslation(invitationTranslations.rsvp.cta, language)}
        </button>
      </DialogTrigger>
      <DialogContent
        className="border-[#834213]/30 sm:max-w-md"
        dir={direction}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle
            className={` text-center text-2xl font-semibold text-[#834213]`}
          >
            {getTranslation(invitationTranslations.rsvp.title, language)}
          </DialogTitle>
          <DialogDescription className="text-center">
            {getTranslation(invitationTranslations.rsvp.description, language)}
          </DialogDescription>
        </DialogHeader>

        {!guestRecord ? (
          <div className="flex justify-center py-6">
            <Loader2Icon className="size-5 animate-spin text-[#834213]/50" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {rsvpEntries.map((guest) => (
              <div
                key={guest.kind === "main" ? "main" : guest.guestId}
                className="flex items-center justify-between rounded-lg border border-[#834213]/20 px-4 py-3"
              >
                <span className={` text-lg font-medium text-[#834213]`}>
                  {guest.name}
                </span>

                <div className="flex items-center gap-2">
                  {loadingTarget ===
                  (guest.kind === "main"
                    ? "main"
                    : `guest-${guest.guestId}`) ? (
                    <Loader2Icon className="size-5 animate-spin text-[#834213]/50" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggle(guest, true)}
                        className={`flex size-9 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                          guest.confirmed === true
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-emerald-500/40 text-emerald-500/40 hover:border-emerald-500 hover:text-emerald-500"
                        }`}
                        aria-label={`${getTranslation(
                          invitationTranslations.rsvp.confirmGuest,
                          language,
                        )} ${guest.name}`}
                      >
                        <CheckIcon className="size-5" />
                      </button>
                      <button
                        onClick={() => handleToggle(guest, false)}
                        className={`flex size-9 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                          guest.confirmed === false
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-red-500/40 text-red-500/40 hover:border-red-500 hover:text-red-500"
                        }`}
                        aria-label={`${getTranslation(
                          invitationTranslations.rsvp.declineGuest,
                          language,
                        )} ${guest.name}`}
                      >
                        <XIcon className="size-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {guestRecord && allResponded && (
          <p className={` text-center text-sm text-[#834213]/70`}>
            {getTranslation(invitationTranslations.rsvp.thankYou, language)}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              {getTranslation(invitationTranslations.actions.close, language)}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
