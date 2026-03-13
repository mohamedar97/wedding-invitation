"use client";

import { useMemo, useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { revalidateInvitationPaths } from "@/app/admin/actions";
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
type GenderOption = "male" | "female";
type InvitationLanguage = "en" | "ar";
type AdditionalGuestRelationshipOption =
  | "husband"
  | "wife"
  | "son"
  | "daughter"
  | "brother"
  | "sister"
  | "father"
  | "mother"
  | "friend"
  | "colleague"
  | "other";
type CommunicationStyleOption = "formal" | "warm" | "casual" | "playful";
type RelationshipToCoupleOption =
  | "family"
  | "friend"
  | "colleague"
  | "family_friend"
  | "other";
type GuestSideOption = "groom" | "bride";
type GuestSideFilter = "all" | GuestSideOption;
type GuestNotesForAI = {
  languageMode?: "" | "english" | "arabic" | "franco";
  communicationStyle?: "" | CommunicationStyleOption;
  relationshipToCouple?: "" | RelationshipToCoupleOption;
  guestSide?: "" | GuestSideOption;
  relationship?: string;
  personality?: string;
  personalInfo?: string;
  weddingContext?: string;
  deepStuff?: string;
  extraNotes?: string;
};
type GuestRecordWithLocalFields = GuestRecord & {
  mainGuestGender?: GenderOption;
  mainGuestAge?: number;
  additionalGuests?: Array<
    GuestRecord["additionalGuests"] extends Array<infer T>
      ? T & { age?: number }
      : {
          id: string;
          name: string;
          relationshipToGuest: AdditionalGuestRelationshipOption;
          gender: GenderOption;
          age?: number;
          confirmed?: boolean;
          confirmedAt?: string;
        }
  >;
  notesForAI?: GuestNotesForAI;
};

type AdditionalGuestDraft = {
  id: string;
  name: string;
  relationshipToGuest: "" | AdditionalGuestRelationshipOption;
  gender: "" | GenderOption;
  age: string;
  confirmed: "pending" | "confirmed" | "declined";
  confirmedAt: string;
};
type ConversationRecord = Doc<"conversations">;
type MessageRecord = Doc<"messages">;
type GuestDraft = {
  guestId?: GuestRecord["_id"];
  mainGuestName: string;
  mainGuestGender: "" | GenderOption;
  mainGuestAge: string;
  slug: string;
  phone: string;
  email: string;
  plusOneName: string;
  preferedLanguage: "" | InvitationLanguage;
  mainGuestConfirmed: "pending" | "confirmed" | "declined";
  additionalGuests: AdditionalGuestDraft[];
  languageMode: "" | "english" | "arabic" | "franco";
  communicationStyle: "" | CommunicationStyleOption;
  relationshipToCouple: "" | RelationshipToCoupleOption;
  guestSide: "" | GuestSideOption;
  relationship: string;
  personality: string;
  personalInfo: string;
  weddingContext: string;
  deepStuff: string;
  extraNotes: string;
};

const ADDITIONAL_GUEST_RELATIONSHIP_OPTIONS: Array<{
  value: AdditionalGuestRelationshipOption;
  label: string;
}> = [
  { value: "husband", label: "Husband" },
  { value: "wife", label: "Wife" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "other", label: "Other" },
];

const RELATIONSHIP_TO_COUPLE_OPTIONS: Array<{
  value: RelationshipToCoupleOption;
  label: string;
}> = [
  { value: "family", label: "Family" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "family_friend", label: "Family friend" },
  { value: "other", label: "Other" },
];

const GUEST_SIDE_OPTIONS: Array<{ value: GuestSideOption; label: string }> = [
  { value: "groom", label: "Groom side" },
  { value: "bride", label: "Bride side" },
];

const COMMUNICATION_STYLE_OPTIONS: Array<{
  value: CommunicationStyleOption;
  label: string;
}> = [
  { value: "formal", label: "Formal" },
  { value: "warm", label: "Warm" },
  { value: "casual", label: "Casual" },
  { value: "playful", label: "Playful" },
];

function NotesTextarea({
  label,
  helperQuestions,
  value,
  onChange,
}: {
  label: string;
  helperQuestions: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs leading-5 text-muted-foreground">
        Try thinking about: {helperQuestions.join(" ")}
      </p>
    </div>
  );
}

function createAdditionalGuestDraft(): AdditionalGuestDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    relationshipToGuest: "",
    gender: "",
    age: "",
    confirmed: "pending",
    confirmedAt: "",
  };
}

function createEmptyDraft(): GuestDraft {
  return {
    mainGuestName: "",
    mainGuestGender: "",
    mainGuestAge: "",
    slug: "",
    phone: "",
    email: "",
    plusOneName: "",
    preferedLanguage: "",
    mainGuestConfirmed: "pending",
    additionalGuests: [],
    languageMode: "",
    communicationStyle: "",
    relationshipToCouple: "",
    guestSide: "",
    relationship: "",
    personality: "",
    personalInfo: "",
    weddingContext: "",
    deepStuff: "",
    extraNotes: "",
  };
}

function createDraft(rawGuest: GuestRecord): GuestDraft {
  const guest = rawGuest as GuestRecordWithLocalFields;
  return {
    guestId: guest._id,
    mainGuestName: guest.mainGuestName,
    mainGuestGender: guest.mainGuestGender ?? "",
    mainGuestAge:
      guest.mainGuestAge !== undefined ? String(guest.mainGuestAge) : "",
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
        id: additionalGuest.id,
        name: additionalGuest.name,
        relationshipToGuest: additionalGuest.relationshipToGuest,
        gender: additionalGuest.gender,
        age:
          additionalGuest.age !== undefined ? String(additionalGuest.age) : "",
        confirmed:
          additionalGuest.confirmed === true
            ? "confirmed"
            : additionalGuest.confirmed === false
              ? "declined"
              : "pending",
        confirmedAt: additionalGuest.confirmedAt ?? "",
      })) ?? [],
    languageMode: guest.notesForAI?.languageMode ?? "",
    communicationStyle: guest.notesForAI?.communicationStyle ?? "",
    relationshipToCouple: guest.notesForAI?.relationshipToCouple ?? "",
    guestSide: guest.notesForAI?.guestSide ?? "",
    relationship: guest.notesForAI?.relationship ?? "",
    personality: guest.notesForAI?.personality ?? "",
    personalInfo: guest.notesForAI?.personalInfo ?? "",
    weddingContext: guest.notesForAI?.weddingContext ?? "",
    deepStuff: guest.notesForAI?.deepStuff ?? "",
    extraNotes: guest.notesForAI?.extraNotes ?? "",
  };
}

function getMinimumValidationError(
  draft: GuestDraft,
  existingGuests: GuestRecord[],
) {
  if (!draft.mainGuestName.trim()) {
    return "Main guest name is required.";
  }

  const slug = draft.slug.trim();

  if (!slug) {
    return "Slug is required.";
  }

  const duplicateSlug = existingGuests.some(
    (guest) => guest._id !== draft.guestId && guest.slug.trim() === slug,
  );

  if (duplicateSlug) {
    return "This slug already exists. Please choose a different slug.";
  }

  if (!draft.phone.trim()) {
    return "Main guest phone number is required.";
  }

  if (!draft.preferedLanguage) {
    return "Choose English invitation or Arabic invitation.";
  }

  if (!draft.guestSide) {
    return "Guest side is required.";
  }

  return null;
}

function getGuestSideLabel(side: GuestSideOption) {
  return side === "groom" ? "Groom side" : "Bride side";
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

const INITIATION_WINDOW_MS = 24 * 60 * 60 * 1000;

function getLatestUserMessageAt(messages: MessageRecord[] | undefined) {
  return (
    messages
      ?.filter((message) => message.role === "user")
      .reduce<
        number | null
      >((latest, message) => (latest === null || message._creationTime > latest ? message._creationTime : latest), null) ??
    null
  );
}

function canInitiateConversation(
  conversation: ConversationRecord | null | undefined,
  messages: MessageRecord[] | undefined,
) {
  if (!conversation) {
    return true;
  }

  const latestUserMessageAt = getLatestUserMessageAt(messages);

  if (latestUserMessageAt === null) {
    return true;
  }

  return Date.now() - latestUserMessageAt >= INITIATION_WINDOW_MS;
}

function InitiateConversationButton({
  guest,
  variant = "outline",
  size = "sm",
  className,
}: {
  guest: GuestRecord;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const conversation = useQuery(api.conversations.getByGuestId, {
    guestId: guest._id,
  });
  const messages = useQuery(
    api.conversations.listMessages,
    conversation?._id ? { conversationId: conversation._id } : "skip",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canInitiateConversation(conversation, messages)) {
    return null;
  }

  function handleInitiate() {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/chat/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            guestId: guest._id,
          }),
        });

        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to initiate conversation.");
        }

        setFeedback(payload?.message ?? "Template sent.");
      } catch (sendError) {
        setError(
          sendError instanceof Error
            ? sendError.message
            : "Failed to initiate conversation.",
        );
      }
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {feedback ? (
        <span className="text-xs text-emerald-700">{feedback}</span>
      ) : null}
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}

function CopyInvitationLinkButton({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [feedback, setFeedback] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    const invitationUrl = `${window.location.origin}/${slug}`;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      setFeedback("copied");
      window.setTimeout(() => setFeedback("idle"), 2000);
    } catch {
      setFeedback("error");
      window.setTimeout(() => setFeedback("idle"), 2500);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      {feedback === "copied" ? <CheckIcon /> : <CopyIcon />}
      {feedback === "copied"
        ? "Copied"
        : feedback === "error"
          ? "Copy failed"
          : "Copy link"}
    </Button>
  );
}

export default function AdminGuestDashboard() {
  const guests = useQuery(api.admin.listGuests, {});
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<
    GuestRecord["_id"] | null
  >(null);
  const [search, setSearch] = useState("");
  const [guestSideFilter, setGuestSideFilter] =
    useState<GuestSideFilter>("all");

  const filteredGuests = useMemo(() => {
    if (!guests) {
      return [];
    }

    const query = search.trim().toLowerCase();

    return guests.filter((guest) => {
      const matchesGuestSide =
        guestSideFilter === "all" ||
        guest.notesForAI?.guestSide === guestSideFilter;

      if (!matchesGuestSide) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        guest.mainGuestName,
        guest.plusOneName,
        ...(guest.additionalGuests?.map(
          (additionalGuest) => additionalGuest.name,
        ) ?? []),
        guest.slug,
        guest.phone,
        guest.email,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [guests, guestSideFilter, search]);

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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={guestSideFilter === "all" ? "default" : "outline"}
                onClick={() => setGuestSideFilter("all")}
              >
                All sides
              </Button>
              <Button
                type="button"
                size="sm"
                variant={guestSideFilter === "groom" ? "default" : "outline"}
                onClick={() => setGuestSideFilter("groom")}
              >
                Groom side
              </Button>
              <Button
                type="button"
                size="sm"
                variant={guestSideFilter === "bride" ? "default" : "outline"}
                onClick={() => setGuestSideFilter("bride")}
              >
                Bride side
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredGuests.length ? (
              filteredGuests.map((guest) => (
                <div
                  key={guest._id}
                  className={cn(
                    "rounded-lg border px-3 py-3 transition-colors",
                    guest._id === activeGuestId
                      ? "border-2 border-stone-500 bg-stone-100 shadow-sm"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingGuest(false);
                      setSelectedGuestId(guest._id);
                    }}
                    className="w-full text-left"
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
                    {guest.notesForAI?.guestSide ? (
                      <div className="mt-2 text-xs opacity-75">
                        {getGuestSideLabel(guest.notesForAI.guestSide)}
                      </div>
                    ) : null}
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <InitiateConversationButton
                      guest={guest}
                      variant={
                        guest._id === activeGuestId ? "default" : "outline"
                      }
                    />
                    <CopyInvitationLinkButton slug={guest.slug} />
                  </div>
                </div>
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
                existingGuests={guests}
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
              <>
                <InitiateConversationButton guest={selectedGuest} />
                <GuestEditor
                  key={selectedGuest._id}
                  mode="edit"
                  initialDraft={createDraft(selectedGuest)}
                  existingGuests={guests}
                />
              </>
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
  existingGuests,
  onCreated,
  onCancel,
}: {
  initialDraft: GuestDraft;
  mode: "create" | "edit";
  existingGuests: GuestRecord[];
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
  const minimumValidationError = getMinimumValidationError(
    draft,
    existingGuests,
  );

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

    const validationError = getMinimumValidationError(draft, existingGuests);

    if (validationError) {
      setError(validationError);
      return;
    }

    const preferedLanguage = draft.preferedLanguage;

    if (!preferedLanguage) {
      setError("Choose English invitation or Arabic invitation.");
      return;
    }

    const additionalGuests: Array<{
      id: string;
      name: string;
      relationshipToGuest: AdditionalGuestRelationshipOption;
      gender: GenderOption;
      age?: number;
      confirmed?: boolean;
      confirmedAt?: string;
    }> = [];

    for (const additionalGuest of draft.additionalGuests) {
      const id = additionalGuest.id?.trim() ?? "";
      const name = additionalGuest.name?.trim() ?? "";
      const confirmedAt = additionalGuest.confirmedAt?.trim() || undefined;

      if (
        !id ||
        !name ||
        !additionalGuest.relationshipToGuest ||
        !additionalGuest.gender
      ) {
        continue;
      }

      additionalGuests.push({
        id,
        name,
        relationshipToGuest: additionalGuest.relationshipToGuest,
        gender: additionalGuest.gender,
        age: additionalGuest.age ? Number(additionalGuest.age) : undefined,
        confirmed:
          additionalGuest.confirmed === "pending"
            ? undefined
            : additionalGuest.confirmed === "confirmed",
        confirmedAt,
      });
    }

    startTransition(async () => {
      try {
        const previousSlug =
          mode === "edit" ? initialDraft.slug.trim() || undefined : undefined;
        const payload = {
          mainGuestName: draft.mainGuestName,
          mainGuestGender: draft.mainGuestGender || undefined,
          mainGuestAge: draft.mainGuestAge
            ? Number(draft.mainGuestAge)
            : undefined,
          slug: draft.slug,
          phone: draft.phone,
          email: draft.email || undefined,
          plusOneName: draft.plusOneName || undefined,
          preferedLanguage,
          mainGuestConfirmed:
            draft.mainGuestConfirmed === "pending"
              ? undefined
              : draft.mainGuestConfirmed === "confirmed",
          additionalGuests:
            additionalGuests.length > 0 ? additionalGuests : undefined,
          notesForAI: {
            languageMode: draft.languageMode || undefined,
            communicationStyle: draft.communicationStyle || undefined,
            relationshipToCouple: draft.relationshipToCouple || undefined,
            guestSide: draft.guestSide || undefined,
            relationship: draft.relationship || undefined,
            personality: draft.personality || undefined,
            personalInfo: draft.personalInfo || undefined,
            weddingContext: draft.weddingContext || undefined,
            deepStuff: draft.deepStuff || undefined,
            extraNotes: draft.extraNotes || undefined,
          },
        };

        if (mode === "create") {
          const guestId = await createGuest(payload);
          await revalidateInvitationPaths({ slug: draft.slug });
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
        await revalidateInvitationPaths({
          slug: draft.slug,
          previousSlug,
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
        createAdditionalGuestDraft(),
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

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        Required to create an invitation: main guest name, slug, phone number,
        invitation language, and guest side. Everything else is optional.
      </p>

      <section className="space-y-4">
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-amber-950">
                Required fields
              </h3>
              <p className="text-xs text-amber-900/80">
                Complete these fields before creating or saving an invitation.
              </p>
            </div>
            <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-medium text-amber-950">
              Required
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-amber-950">
                Main guest name
              </label>
              <Input
                className="border-amber-400 bg-white"
                value={draft.mainGuestName}
                onChange={(event) =>
                  updateDraft("mainGuestName", event.target.value)
                }
                placeholder="Main guest name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-amber-950">
                Slug
              </label>
              <Input
                className="border-amber-400 bg-white"
                value={draft.slug}
                onChange={(event) => updateDraft("slug", event.target.value)}
                placeholder="Slug"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-amber-950">
                Phone
              </label>
              <Input
                className="border-amber-400 bg-white"
                value={draft.phone}
                onChange={(event) => updateDraft("phone", event.target.value)}
                placeholder="Phone"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-amber-950">
                Invitation language
              </label>
              <Select
                value={draft.preferedLanguage || undefined}
                onValueChange={(value: InvitationLanguage) =>
                  updateDraft("preferedLanguage", value)
                }
              >
                <SelectTrigger className="w-full border-amber-400 bg-white">
                  <SelectValue placeholder="Preferred invitation language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English invitation</SelectItem>
                  <SelectItem value="ar">Arabic invitation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-amber-950">
                Guest side
              </label>
              <Select
                value={draft.guestSide || undefined}
                onValueChange={(value: GuestSideOption) =>
                  updateDraft("guestSide", value)
                }
              >
                <SelectTrigger className="w-full border-amber-400 bg-white">
                  <SelectValue placeholder="Guest side" />
                </SelectTrigger>
                <SelectContent>
                  {GUEST_SIDE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            value={draft.mainGuestGender || undefined}
            onValueChange={(value: GenderOption) =>
              updateDraft("mainGuestGender", value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Main guest gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            value={draft.mainGuestAge}
            onChange={(event) =>
              updateDraft("mainGuestAge", event.target.value)
            }
            placeholder="Main guest age"
          />
          <Input
            value={draft.plusOneName}
            onChange={(event) => updateDraft("plusOneName", event.target.value)}
            placeholder="Plus-one name"
          />
          <Input
            value={draft.email}
            onChange={(event) => updateDraft("email", event.target.value)}
            placeholder="Email"
          />
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
                    className="grid gap-3 rounded-lg border border-stone-200 p-3 md:grid-cols-2"
                  >
                    <Input
                      value={additionalGuest.name}
                      onChange={(event) =>
                        updateAdditionalGuest(index, "name", event.target.value)
                      }
                      placeholder="Guest name"
                    />
                    <Select
                      value={additionalGuest.relationshipToGuest || undefined}
                      onValueChange={(
                        value: AdditionalGuestRelationshipOption,
                      ) =>
                        updateAdditionalGuest(
                          index,
                          "relationshipToGuest",
                          value,
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Relationship to main guest" />
                      </SelectTrigger>
                      <SelectContent>
                        {ADDITIONAL_GUEST_RELATIONSHIP_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={additionalGuest.gender || undefined}
                      onValueChange={(value: GenderOption) =>
                        updateAdditionalGuest(index, "gender", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={additionalGuest.age}
                      onChange={(event) =>
                        updateAdditionalGuest(index, "age", event.target.value)
                      }
                      placeholder="Age"
                    />
                    <Select
                      value={additionalGuest.confirmed}
                      onValueChange={(
                        value: AdditionalGuestDraft["confirmed"],
                      ) => updateAdditionalGuest(index, "confirmed", value)}
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
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
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
        <Select
          value={draft.communicationStyle || undefined}
          onValueChange={(value: CommunicationStyleOption) =>
            updateDraft("communicationStyle", value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="AI communication style" />
          </SelectTrigger>
          <SelectContent>
            {COMMUNICATION_STYLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="md:col-span-2">
          <Select
            value={draft.relationshipToCouple || undefined}
            onValueChange={(value: RelationshipToCoupleOption) =>
              updateDraft("relationshipToCouple", value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Relationship to bride / groom" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_TO_COUPLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <NotesTextarea
            label="Relationship"
            value={draft.relationship}
            onChange={(value) => updateDraft("relationship", value)}
            helperQuestions={[
              "How do you know them?",
              "How long have you known them?",
              "How close are you?",
              "Why was it important to invite them?",
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <NotesTextarea
            label="Personality"
            value={draft.personality}
            onChange={(value) => updateDraft("personality", value)}
            helperQuestions={[
              "How would you describe their personality?",
              "What kind of humor do they enjoy?",
              "Are they talkative, quiet, sarcastic, playful, or shy?",
              "What usually makes them laugh?",
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <NotesTextarea
            label="Personal Information"
            value={draft.personalInfo}
            onChange={(value) => updateDraft("personalInfo", value)}
            helperQuestions={[
              "What do they do for work or study?",
              "Where do they live now?",
              "Are they single, dating, engaged, or married?",
              "Any recent big life events or hobbies?",
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <NotesTextarea
            label="Deep Stuff"
            value={draft.deepStuff}
            onChange={(value) => updateDraft("deepStuff", value)}
            helperQuestions={[
              "What role have they played in your life?",
              "Have they supported you in meaningful moments?",
              "What shared memory, inside joke, or unique detail feels very 'them'?",
              "What would you genuinely want to say to them at the wedding?",
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <NotesTextarea
            label="Wedding Context"
            value={draft.weddingContext}
            onChange={(value) => updateDraft("weddingContext", value)}
            helperQuestions={[
              "How are they connected to the wedding?",
              "Are they traveling to attend?",
              "Are they bringing someone?",
              "Who are they likely to interact with there?",
              "Is there anything special about their attendance?",
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <NotesTextarea
            label="Extra Notes"
            value={draft.extraNotes}
            onChange={(value) => updateDraft("extraNotes", value)}
            helperQuestions={[
              "Anything else the AI should know to talk naturally?",
              "Who else will they likely interact with at the wedding?",
              "Are they bringing someone or traveling to attend?",
            ]}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending || Boolean(minimumValidationError)}
        >
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
        {!error && minimumValidationError ? (
          <span className="text-sm text-red-700">{minimumValidationError}</span>
        ) : null}
      </div>
    </>
  );
}
