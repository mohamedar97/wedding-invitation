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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type GuestRecord = Doc<"guests">;
type GuestDraft = {
  guestId: GuestRecord["_id"];
  mainGuestName: string;
  slug: string;
  phone: string;
  email: string;
  plusOneName: string;
  preferedLanguage: "en" | "ar";
  mainGuestConfirmed: "pending" | "confirmed" | "declined";
  additionalGuestsJson: string;
  preferredName: string;
  relationshipToCouple: string;
  languageMode: "unset" | "english" | "arabic" | "franco";
  communicationStyle: string;
  plusOneNamesJson: string;
  memoryNotes: string;
  sensitiveNotes: string;
  lastInteractionSummary: string;
  extraNotes: string;
};

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
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
    additionalGuestsJson: stringifyJson(guest.additionalGuests),
    preferredName: guest.notesForAI?.preferredName ?? "",
    relationshipToCouple: guest.notesForAI?.relationshipToCouple ?? "",
    languageMode: guest.notesForAI?.languageMode ?? "unset",
    communicationStyle: guest.notesForAI?.communicationStyle ?? "",
    plusOneNamesJson: stringifyJson(guest.notesForAI?.plusOneNames),
    memoryNotes: guest.notesForAI?.memoryNotes ?? "",
    sensitiveNotes: guest.notesForAI?.sensitiveNotes ?? "",
    lastInteractionSummary: guest.notesForAI?.lastInteractionSummary ?? "",
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

function parseJsonArray<T>(value: string, label: string): T[] | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array.`);
  }

  return parsed as T[];
}

export default function AdminGuestDashboard() {
  const guests = useQuery(api.admin.listGuests, {});
  const [selectedGuestId, setSelectedGuestId] = useState<GuestRecord["_id"] | null>(null);
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

  const selectedGuest =
    guests?.find((guest) => guest._id === selectedGuestId) ??
    filteredGuests[0] ??
    guests?.[0] ??
    null;
  const activeGuestId = selectedGuest?._id ?? null;

  if (guests === undefined) {
    return <div className="p-6 text-sm text-muted-foreground">Loading guests...</div>;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Guest dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Minimal admin view for guest values and AI notes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit border-stone-300/80 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Guests</CardTitle>
            <CardDescription>{guests.length} total records</CardDescription>
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
                    <Badge variant={guest.mainGuestConfirmed === true ? "default" : "outline"}>
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
            <CardTitle>{selectedGuest?.mainGuestName ?? "Select a guest"}</CardTitle>
            <CardDescription>
              Edit guest values and the notes used by the AI prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {!selectedGuest ? (
              <div className="text-sm text-muted-foreground">No guest selected.</div>
            ) : (
              <GuestEditor key={selectedGuest._id} guest={selectedGuest} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GuestEditor({ guest }: { guest: GuestRecord }) {
  const updateGuest = useMutation(api.admin.updateGuest);
  const [draft, setDraft] = useState<GuestDraft>(() => createDraft(guest));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateDraft<K extends keyof GuestDraft>(key: K, value: GuestDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
    setError(null);
  }

  async function handleSave() {
    setFeedback(null);
    setError(null);

    let additionalGuests:
      | {
          name: string;
          confirmed?: boolean;
          confirmedAt?: string;
        }[]
      | undefined;
    let plusOneNames:
      | {
          name: string;
          relationshipToGuest: string;
        }[]
      | undefined;

    try {
      additionalGuests = parseJsonArray(draft.additionalGuestsJson, "Additional guests");
      plusOneNames = parseJsonArray(draft.plusOneNamesJson, "Plus-one names");
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Unable to parse JSON.");
      return;
    }

    startTransition(async () => {
      try {
        await updateGuest({
          guestId: draft.guestId,
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
          additionalGuests,
          notesForAI: {
            preferredName: draft.preferredName || undefined,
            relationshipToCouple: draft.relationshipToCouple || undefined,
            languageMode:
              draft.languageMode === "unset" ? undefined : draft.languageMode,
            communicationStyle: draft.communicationStyle || undefined,
            plusOneNames,
            memoryNotes: draft.memoryNotes || undefined,
            sensitiveNotes: draft.sensitiveNotes || undefined,
            lastInteractionSummary: draft.lastInteractionSummary || undefined,
            extraNotes: draft.extraNotes || undefined,
          },
        });

        setFeedback("Saved.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Save failed.");
      }
    });
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
            onValueChange={(
              value: GuestDraft["mainGuestConfirmed"],
            ) => updateDraft("mainGuestConfirmed", value)}
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
          <label className="mb-2 block text-sm font-medium">Additional guests JSON</label>
          <Textarea
            value={draft.additionalGuestsJson}
            onChange={(event) =>
              updateDraft("additionalGuestsJson", event.target.value)
            }
            className="min-h-40 font-mono text-xs"
          />
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
          value={draft.languageMode}
          onValueChange={(
            value: GuestDraft["languageMode"],
          ) => updateDraft("languageMode", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="AI language mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">Unset</SelectItem>
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
          <label className="mb-2 block text-sm font-medium">Plus-one names JSON</label>
          <Textarea
            value={draft.plusOneNamesJson}
            onChange={(event) =>
              updateDraft("plusOneNamesJson", event.target.value)
            }
            className="min-h-32 font-mono text-xs"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Memory notes</label>
          <Textarea
            value={draft.memoryNotes}
            onChange={(event) => updateDraft("memoryNotes", event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Sensitive notes</label>
          <Textarea
            value={draft.sensitiveNotes}
            onChange={(event) => updateDraft("sensitiveNotes", event.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Last interaction summary</label>
          <Textarea
            value={draft.lastInteractionSummary}
            onChange={(event) =>
              updateDraft("lastInteractionSummary", event.target.value)
            }
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
          {isPending ? "Saving..." : "Save guest"}
        </Button>
        {feedback ? (
          <span className="text-sm text-emerald-700">{feedback}</span>
        ) : null}
        {error ? (
          <span className="text-sm text-red-700">{error}</span>
        ) : null}
      </div>
    </>
  );
}
