import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import twilio from "twilio";
import { buildZaynPrompt } from "../promptBuilder";

type LanguageMode = "english" | "arabic" | "franco";

type GuestContext = {
  _id: string;
  mainGuestName: string;
  mainGuestConfirmed?: boolean;
  additionalGuests?: Array<{
    id: string;
    name: string;
    relationshipToGuest: string;
    gender: string;
    confirmed?: boolean;
    confirmedAt?: string;
  }>;
  preferedLanguage: "en" | "ar";
  phone: string;
  notesForAI?: {
    languageMode?: LanguageMode;
    relationshipToCouple?: string;
    communicationStyle?: string;
    extraNotes?: string;
  };
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProcessRequest = {
  conversationId: string;
  batchId: number;
  scheduleVersion: number;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeWhatsappAddress(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("WhatsApp address is required.");
  }

  if (trimmed.startsWith("whatsapp:")) {
    return trimmed;
  }

  return `whatsapp:${trimmed}`;
}

function isAuthorized(req: Request) {
  const expectedSecret = process.env.INTERNAL_CHAT_PROCESS_SECRET?.trim();
  const providedSecret = req.headers.get("x-internal-chat-secret")?.trim();

  return Boolean(
    expectedSecret && providedSecret && expectedSecret === providedSecret,
  );
}

function buildSystemPrompt(guest: GuestContext) {
  const languageMode =
    guest.notesForAI?.languageMode ??
    (guest.preferedLanguage === "ar" ? "arabic" : "english");

  return buildZaynPrompt({
    guestName: guest.mainGuestName,
    rsvpStatus:
      guest.mainGuestConfirmed === undefined
        ? "unknown"
        : guest.mainGuestConfirmed
          ? "attending"
          : "declined",
    mainGuestConfirmed: guest.mainGuestConfirmed,
    additionalGuests: guest.additionalGuests,
    ...guest.notesForAI,
    languageMode,
  });
}

async function sendWhatsappMessage(to: string, body: string) {
  const accountSid = getRequiredEnv("TWILIO_ACCOUNT_SID");
  const authToken = getRequiredEnv("TWILIO_AUTH_TOKEN");
  const from = normalizeWhatsappAddress(getRequiredEnv("TWILIO_WHATSAPP_FROM"));
  const normalizedTo = normalizeWhatsappAddress(to);
  const client = twilio(accountSid, authToken);

  console.info("[chat process] calling twilio messages.create", {
    from,
    to: normalizedTo,
    bodyLength: body.length,
  });

  return await client.messages.create({
    body,
    from,
    to: normalizedTo,
  });
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    console.warn("[chat process] rejected unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as ProcessRequest;
    const replyContext = await fetchQuery(
      api.conversations.getReplyContextForProcessing,
      {
        conversationId: body.conversationId as never,
        batchId: body.batchId,
      },
    );

    if (!replyContext || replyContext.batchMessages.length === 0) {
      console.warn("[chat process] no pending user messages found for batch", {
        conversationId: body.conversationId,
        batchId: body.batchId,
        scheduleVersion: body.scheduleVersion,
      });

      return NextResponse.json(
        { error: "No pending user messages found for this batch." },
        { status: 409 },
      );
    }

    console.info("[chat process] generating pending reply", {
      conversationId: body.conversationId,
      batchId: body.batchId,
      scheduleVersion: body.scheduleVersion,
      guestId: replyContext.guest._id,
      inboundMessageCount: replyContext.batchMessages.length,
    });

    const result = await generateText({
      system: buildSystemPrompt(replyContext.guest as GuestContext),
      model: openai("gpt-5.4"),
      messages: replyContext.messages.map(
        (message: { role: "user" | "assistant"; content: string }) => ({
          role: message.role,
          content: message.content,
        }),
      ) as ChatMessage[],
    });

    console.info("[chat process] sending whatsapp reply", {
      conversationId: body.conversationId,
      batchId: body.batchId,
      guestId: replyContext.guest._id,
      to: normalizeWhatsappAddress(replyContext.guest.phone),
      replyLength: result.text.length,
    });

    const twilioMessage = await sendWhatsappMessage(
      replyContext.guest.phone,
      result.text,
    );

    console.info("[chat process] sent whatsapp reply", {
      conversationId: body.conversationId,
      batchId: body.batchId,
      guestId: replyContext.guest._id,
      twilioMessageSid: twilioMessage.sid,
    });

    return NextResponse.json({
      text: result.text,
      twilioMessageSid: twilioMessage.sid,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown chat processing error";

    console.error("[chat process] failed to generate or send reply", {
      error: message,
      cause: error,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
