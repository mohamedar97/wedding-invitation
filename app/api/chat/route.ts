import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { buildZaynPrompt } from "./promptBuilder";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function twimlMessage(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

function unauthorizedResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const from = formData.get("From");
  const incomingBody = formData.get("Body");
  const phone = typeof from === "string" ? from.trim() : "";
  const messageBody =
    typeof incomingBody === "string" ? incomingBody.trim() : "";

  if (!phone || !messageBody) {
    return unauthorizedResponse();
  }

  const guest = await fetchQuery(api.getGuests.getByPhone, { phone });

  if (!guest) {
    return unauthorizedResponse();
  }

  let conversation = await fetchQuery(api.conversations.getByGuestId, {
    guestId: guest._id,
  });

  if (!conversation) {
    const conversationId = await fetchMutation(api.conversations.create, {
      guestId: guest._id,
    });
    conversation = {
      _id: conversationId,
      guestId: guest._id,
      _creationTime: Date.now(),
    };
  }

  const storedMessages = (
    await fetchQuery(api.conversations.listMessages, {
      conversationId: conversation._id,
    })
  ).map((message: { role: "user" | "assistant"; content: string }) => ({
    role: message.role,
    content: message.content,
  }));

  await fetchMutation(api.conversations.createMessage, {
    conversationId: conversation._id,
    role: "user",
    content: messageBody,
  });

  const conversationHistory: ChatMessage[] = [
    ...storedMessages,
    { role: "user", content: messageBody },
  ];
  const languageMode =
    guest.notesForAI?.languageMode ??
    (guest.preferedLanguage === "ar" ? "arabic" : "english");
  const systemPrompt = buildZaynPrompt({
    guestName: guest.mainGuestName,
    rsvpStatus:
      guest.mainGuestConfirmed === undefined
        ? "unknown"
        : guest.mainGuestConfirmed
          ? "attending"
          : "declined",
    mainGuestConfirmed: guest.mainGuestConfirmed,
    plusOneName: guest.plusOneName,
    additionalGuests: guest.additionalGuests,
    ...guest.notesForAI,
    languageMode,
  });

  const result = await generateText({
    system: systemPrompt,
    model: openai("gpt-5.4"),
    messages: conversationHistory,
  });

  await fetchMutation(api.conversations.createMessage, {
    conversationId: conversation._id,
    role: "assistant",
    content: result.text,
  });

  return new NextResponse(twimlMessage(result.text), {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
    },
  });
}
