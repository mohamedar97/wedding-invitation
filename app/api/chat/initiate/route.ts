import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import twilio from "twilio";

const INITIATION_WINDOW_MS = 24 * 60 * 60 * 1000;

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

function getLatestUserMessageAt(
  messages: Array<{ role: "user" | "assistant"; _creationTime: number }>,
) {
  return messages.reduce<number | null>(
    (latest, message) =>
      message.role !== "user" ||
      (latest !== null && message._creationTime <= latest)
        ? latest
        : message._creationTime,
    null,
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { guestId?: string };
    const guestId = body.guestId?.trim();

    if (!guestId) {
      return NextResponse.json(
        { error: "Guest ID is required." },
        { status: 400 },
      );
    }

    const guests = await fetchQuery(api.admin.listGuests, {});
    const guest = guests.find((entry) => entry._id === guestId);

    if (!guest) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }

    const conversation = await fetchQuery(api.conversations.getByGuestId, {
      guestId: guest._id,
    });

    const messages = conversation
      ? await fetchQuery(api.conversations.listMessages, {
          conversationId: conversation._id,
        })
      : [];
    const latestUserMessageAt = getLatestUserMessageAt(messages);

    if (
      latestUserMessageAt &&
      Date.now() - latestUserMessageAt < INITIATION_WINDOW_MS
    ) {
      return NextResponse.json(
        {
          error: "This guest already has a user message in the last 24 hours.",
        },
        { status: 409 },
      );
    }

    const accountSid = getRequiredEnv("TWILIO_ACCOUNT_SID");
    const authToken = getRequiredEnv("TWILIO_AUTH_TOKEN");
    const from = normalizeWhatsappAddress(
      getRequiredEnv("TWILIO_WHATSAPP_FROM"),
    );
    const contentEnSid = getRequiredEnv(
      "TWILIO_WHATSAPP_INITIATION_EN_TEMPLATE_SID",
    );
    const to = normalizeWhatsappAddress(guest.phone);

    const client = twilio(accountSid, authToken);

    const twilioMessage = await client.messages.create({
      from,
      to,
      contentSid: contentEnSid,
      contentVariables: JSON.stringify({ guest_name: guest.mainGuestName }),
    });

    const conversationId =
      conversation?._id ??
      (await fetchMutation(api.conversations.create, {
        guestId: guest._id,
      }));

    await fetchMutation(api.conversations.createMessage, {
      conversationId,
      role: "assistant",
      content: `Hi ${guest.mainGuestName}, I'm Zayn helping Mohamed and Habiba confirm guests for their wedding. Could you please let me know if you'll be attending on April 18th?
`,
    });

    return NextResponse.json({
      message: "Initiation template sent.",
      twilioMessageSid: twilioMessage.sid,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown initiation error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
