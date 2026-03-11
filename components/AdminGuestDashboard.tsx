"use client";

import { useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type GuestRecord = Doc<"guests">;
type AdditionalGuestDraft = {
  name: string;
  confirmed: "pending" | "confirmed" | "declined";
  confirmedAt: string;
};
type PlusOneNameDraft = {
  name: string;
  relationshipToGuest: string;
};
type GuestDraft = {
  guestId?: GuestRecord["_id"];
  mainGuestName: string;
  slug: string;
  phone: string;
  email: string;
  plusOneName: string;
  preferedLanguage: "en" | "ar";
  mainGuestConfirmed: "pending" | "confirmed" | "declined";
  additionalGuests: AdditionalGuestDraft[];
  preferredName: string;
  relationshipToCouple: string;
  languageMode: "" | "english" | "arabic" | "franco";
  communicationStyle: string;
  plusOneNames: PlusOneNameDraft[];
  extraNotes: string;
};

function createEmptyDraft(): GuestDraft {
  return {
    mainGuestName: "",
    slug: "",
    phone: "",
    email: "",
    plusOneName: "",
    preferedLanguage: "en",
    mainGuestConfirmed: "pending",
    additionalGuests: [],
    preferredName: "",
    relationshipToCouple: "",
    languageMode: "",
    communicationStyle: "",
    plusOneNames: [],
    extraNotes: "",
  };
}

function createDraft(guest: GuestRecord): GuestDraft {
  return {
    guestId: guest._id,
    mainGuestName: guest.mainGuestName,
    slug: guest.slug,
    phone: guest.phone,
    email: guest.email ?? "",
    plusOneName: guest.plusOneName ?? "",
    preferedLanguage: guest.preferedLanguage,
    mainGuestConfirmed:
      guest.mainGuestConfirmed === true
        ? "confirmed"
        : guest.mainGuestConfirmed === false
          ? "declined"
          : "pending",
    additionalGuests:
      guest.additionalGuests?.map((additionalGuest) => ({
        name: additionalGuest.name,
        confirmed:
          additionalGuest.confirmed === true
            ? "confirmed"
            : additionalGuest.confirmed === false
              ? "declined"
              : "pending",
        confirmedAt: additionalGuest.confirmedAt ?? "",
      })) ?? [],
    preferredName: guest.notesForAI?.preferredName ?? "",
    relationshipToCouple: guest.notesForAI?.relationshipToCouple ?? "",
    languageMode: guest.notesForAI?.languageMode ?? "",
    communicationStyle: guest.notesForAI?.communicationStyle ?? "",
    plusOneNames:
      guest.notesForAI?.plusOneNames?.map((plusOne) => ({
        name: plusOne.name,
        relationshipToGuest: plusOne.relationshipToGuest,
      })) ?? [],
    extraNotes: guest.notesForAI?.extraNotes ?? "",
  };
}

function statusLabel(guest: GuestRecord) {
  if (guest.mainGuestConfirmed === true) {
    return "Confirmed";
  }

  if (guest.mainGuestConfirmed === false) {
    return "Declined";
  }

  return "Pending";
}

export default function AdminGuestDashboard() {
  const guests = useQuery(api.admin.listGuests, {});
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<
    GuestRecord["_id"] | null
  >(null);
  const [search, setSearch] = useState("");

  const filteredGuests = useMemo(() => {
    if (!guests) {
      return [];
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return guests;
    }

    return guests.filter((guest) =>
      [
        guest.mainGuestName,
        guest.plusOneName,
        guest.slug,
        guest.phone,
        guest.email,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [guests, search]);

  const selectedGuest = isCreatingGuest
    ? null
    : (guests?.find((guest) => guest._id === selectedGuestId) ??
      filteredGuests[0] ??
      guests?.[0] ??
      null);
  const activeGuestId = selectedGuest?._id ?? null;

  if (guests === undefined) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading guests...</div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">
          Guest dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Minimal admin view for guest values and AI notes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit border-stone-300/80 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Guests</CardTitle>
            <CardDescription>{guests.length} total records</CardDescription>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreatingGuest(true);
                setSelectedGuestId(null);
              }}
            >
              New guest
            </Button>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, slug, phone"
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredGuests.length ? (
              filteredGuests.map((guest) => (
                <button
                  key={guest._id}
                  type="button"
                  onClick={() => {
                    setIsCreatingGuest(false);
                    setSelectedGuestId(guest._id);
                  }}
                  className={cn(
                    "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                    guest._id === activeGuestId
                      ? "border-stone-900 bg-stone-950 text-stone-50"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{guest.mainGuestName}</span>
                    <Badge
                      variant={
                        guest.mainGuestConfirmed === true
                          ? "default"
                          : "outline"
                      }
                    >
                      {statusLabel(guest)}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs opacity-75">{guest.slug}</div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">
                No guests match this search.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-stone-300/80 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle>
              {isCreatingGuest
                ? "New guest"
                : (selectedGuest?.mainGuestName ?? "Select a guest")}
            </CardTitle>
            <CardDescription>
              {isCreatingGuest
                ? "Create a guest record and optional AI notes."
                : "Edit guest values and the notes used by the AI prompt."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {isCreatingGuest ? (
              <GuestEditor
                mode="create"
                initialDraft={createEmptyDraft()}
                onCreated={(guestId) => {
                  setIsCreatingGuest(false);
                  setSelectedGuestId(guestId);
                }}
                onCancel={() => setIsCreatingGuest(false)}
              />
            ) : !selectedGuest ? (
              <div className="text-sm text-muted-foreground">
                No guest selected.
              </div>
            ) : (
              <GuestEditor
                key={selectedGuest._id}
                mode="edit"
                initialDraft={createDraft(selectedGuest)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GuestEditor({
  initialDraft,
  mode,
  onCreated,
  onCancel,
}: {
  initialDraft: GuestDraft;
  mode: "create" | "edit";
  onCreated?: (guestId: GuestRecord["_id"]) => void;
  onCancel?: () => void;
}) {
  const createGuest = useMutation(api.admin.createGuest);
  const updateGuest = useMutation(api.admin.updateGuest);
  const [draft, setDraft] = useState<GuestDraft>(() => initialDraft);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const rowKeyPrefix = draft.guestId ?? "new-guest";

  function updateDraft<K extends keyof GuestDraft>(
    key: K,
    value: GuestDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
    setError(null);
  }

  async function handleSave() {
    setFeedback(null);
    setError(null);

    const additionalGuests = draft.additionalGuests
      .map((additionalGuest) => ({
        name: additionalGuest.name.trim(),
        confirmed:
          additionalGuest.confirmed === "pending"
            ? undefined
            : additionalGuest.confirmed === "confirmed",
        confirmedAt: additionalGuest.confirmedAt.trim() || undefined,
      }))
      .filter((additionalGuest) => additionalGuest.name);

    const plusOneNames = draft.plusOneNames
      .map((plusOne) => ({
        name: plusOne.name.trim(),
        relationshipToGuest: plusOne.relationshipToGuest.trim(),
      }))
      .filter((plusOne) => plusOne.name || plusOne.relationshipToGuest);

    startTransition(async () => {
      try {
        const payload = {
          mainGuestName: draft.mainGuestName,
          slug: draft.slug,
          phone: draft.phone,
          email: draft.email || undefined,
          plusOneName: draft.plusOneName || undefined,
          preferedLanguage: draft.preferedLanguage,
          mainGuestConfirmed:
            draft.mainGuestConfirmed === "pending"
              ? undefined
              : draft.mainGuestConfirmed === "confirmed",
          additionalGuests:
            additionalGuests.length > 0 ? additionalGuests : undefined,
          notesForAI: {
            preferredName: draft.preferredName || undefined,
            relationshipToCouple: draft.relationshipToCouple || undefined,
            languageMode: draft.languageMode || undefined,
            communicationStyle: draft.communicationStyle || undefined,
            plusOneNames: plusOneNames.length > 0 ? plusOneNames : undefined,
            extraNotes: draft.extraNotes || undefined,
          },
        };

        if (mode === "create") {
          const guestId = await createGuest(payload);
          setFeedback("Guest created.");
          onCreated?.(guestId);
          return;
        }

        if (!draft.guestId) {
          throw new Error("Guest ID is missing.");
        }

        await updateGuest({
          guestId: draft.guestId,
          ...payload,
        });

        setFeedback("Saved.");
      } catch (saveError) {
        setError(
          saveError instanceof Error ? saveError.message : "Save failed.",
        );
      }
    });
  }

  function updateAdditionalGuest(
    index: number,
    key: keyof AdditionalGuestDraft,
    value: AdditionalGuestDraft[keyof AdditionalGuestDraft],
  ) {
    setDraft((current) => ({
      ...current,
      additionalGuests: current.additionalGuests.map((guest, guestIndex) =>
        guestIndex === index ? { ...guest, [key]: value } : guest,
      ),
    }));
    setFeedback(null);
    setError(null);
  }

  function addAdditionalGuest() {
    setDraft((current) => ({
      ...current,
      additionalGuests: [
        ...current.additionalGuests,
        { name: "", confirmed: "pending", confirmedAt: "" },
      ],
    }));
    setFeedback(null);
    setError(null);
  }

  function removeAdditionalGuest(index: number) {
    setDraft((current) => ({
      ...current,
      additionalGuests: current.additionalGuests.filter(
        (_, guestIndex) => guestIndex !== index,
      ),
    }));
    setFeedback(null);
    setError(null);
  }

  function updatePlusOneName(
    index: number,
    key: keyof PlusOneNameDraft,
    value: PlusOneNameDraft[keyof PlusOneNameDraft],
  ) {
    setDraft((current) => ({
      ...current,
      plusOneNames: current.plusOneNames.map((plusOne, plusOneIndex) =>
        plusOneIndex === index ? { ...plusOne, [key]: value } : plusOne,
      ),
    }));
    setFeedback(null);
    setError(null);
  }

  function addPlusOneName() {
    setDraft((current) => ({
      ...current,
      plusOneNames: [
        ...current.plusOneNames,
        { name: "", relationshipToGuest: "" },
      ],
    }));
    setFeedback(null);
    setError(null);
  }

  function removePlusOneName(index: number) {
    setDraft((current) => ({
      ...current,
      plusOneNames: current.plusOneNames.filter(
        (_, plusOneIndex) => plusOneIndex !== index,
      ),
    }));
    setFeedback(null);
    setError(null);
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2">
        <Input
          value={draft.mainGuestName}
          onChange={(event) => updateDraft("mainGuestName", event.target.value)}
          placeholder="Main guest name"
        />
        <Input
          value={draft.plusOneName}
          onChange={(event) => updateDraft("plusOneName", event.target.value)}
          placeholder="Plus-one name"
        />
        <Input
          value={draft.slug}
          onChange={(event) => updateDraft("slug", event.target.value)}
          placeholder="Slug"
        />
        <Input
          value={draft.phone}
          onChange={(event) => updateDraft("phone", event.target.value)}
          placeholder="Phone"
        />
        <Input
          value={draft.email}
          onChange={(event) => updateDraft("email", event.target.value)}
          placeholder="Email"
        />
        <Select
          value={draft.preferedLanguage}
          onValueChange={(value: "en" | "ar") =>
            updateDraft("preferedLanguage", value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Preferred invitation language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English invitation</SelectItem>
            <SelectItem value="ar">Arabic invitation</SelectItem>
          </SelectContent>
        </Select>
        <div className="md:col-span-2">
          <Select
            value={draft.mainGuestConfirmed}
            onValueChange={(value: GuestDraft["mainGuestConfirmed"]) =>
              updateDraft("mainGuestConfirmed", value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="RSVP status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium">
              Additional guests
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAdditionalGuest}
            >
              Add guest
            </Button>
          </div>
          <div className="space-y-3">
            {draft.additionalGuests.length ? (
              draft.additionalGuests.map((additionalGuest, index) => (
                <div
                  key={`${rowKeyPrefix}-additional-${index}`}
                  className="grid gap-3 rounded-lg border border-stone-200 p-3 md:grid-cols-[minmax(0,1.4fr)_180px_minmax(0,1fr)_auto]"
                >
                  <Input
                    value={additionalGuest.name}
                    onChange={(event) =>
                      updateAdditionalGuest(index, "name", event.target.value)
                    }
                    placeholder="Guest name"
                  />
                  <Select
                    value={additionalGuest.confirmed}
                    onValueChange={(value: AdditionalGuestDraft["confirmed"]) =>
                      updateAdditionalGuest(index, "confirmed", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="RSVP status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={additionalGuest.confirmedAt}
                    onChange={(event) =>
                      updateAdditionalGuest(
                        index,
                        "confirmedAt",
                        event.target.value,
                      )
                    }
                    placeholder="Confirmed at (optional)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdditionalGuest(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                No additional guests.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Input
          value={draft.preferredName}
          onChange={(event) => updateDraft("preferredName", event.target.value)}
          placeholder="Preferred name"
        />
        <Input
          value={draft.relationshipToCouple}
          onChange={(event) =>
            updateDraft("relationshipToCouple", event.target.value)
          }
          placeholder="Relationship to couple"
        />
        <Select
          value={draft.languageMode || undefined}
          onValueChange={(value: GuestDraft["languageMode"]) =>
            updateDraft("languageMode", value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="AI language mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="arabic">Arabic</SelectItem>
            <SelectItem value="franco">Franco</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={draft.communicationStyle}
          onChange={(event) =>
            updateDraft("communicationStyle", event.target.value)
          }
          placeholder="Communication style"
        />
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium">Plus-one names</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPlusOneName}
            >
              Add plus-one
            </Button>
          </div>
          <div className="space-y-3">
            {draft.plusOneNames.length ? (
              draft.plusOneNames.map((plusOne, index) => (
                <div
                  key={`${rowKeyPrefix}-plus-one-${index}`}
                  className="grid gap-3 rounded-lg border border-stone-200 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <Input
                    value={plusOne.name}
                    onChange={(event) =>
                      updatePlusOneName(index, "name", event.target.value)
                    }
                    placeholder="Name"
                  />
                  <Input
                    value={plusOne.relationshipToGuest}
                    onChange={(event) =>
                      updatePlusOneName(
                        index,
                        "relationshipToGuest",
                        event.target.value,
                      )
                    }
                    placeholder="Relationship to guest"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlusOneName(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                No plus-one names.
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Memory notes</label>
          <Textarea
            value={draft.extraNotes}
            onChange={(event) => updateDraft("extraNotes", event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            Sensitive notes
          </label>
          <Textarea
            value={draft.extraNotes}
            onChange={(event) => updateDraft("extraNotes", event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Extra notes</label>
          <Textarea
            value={draft.extraNotes}
            onChange={(event) => updateDraft("extraNotes", event.target.value)}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create guest"
              : "Save guest"}
        </Button>
        {mode === "create" ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        ) : null}
        {feedback ? (
          <span className="text-sm text-emerald-700">{feedback}</span>
        ) : null}
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
      </div>
    </>
  );
}
