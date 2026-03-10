import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { buildZainPrompt } from "./promptBuilder";

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

export async function POST(req: Request) {
  const formData = await req.formData();
  const from = formData.get("From");
  const incomingBody = formData.get("Body");
  const phone = typeof from === "string" ? from.trim() : "";
  const messageBody =
    typeof incomingBody === "string" ? incomingBody.trim() : "";

  if (!phone || !messageBody) {
    return new NextResponse(
      twimlMessage("We could not process your message."),
      {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
        },
      },
    );
  }

  const guest = await fetchQuery(api.getGuests.getByPhone, { phone });

  if (!guest) {
    return new NextResponse(
      twimlMessage(
        "We could not find your invitation. Please contact us directly.",
      ),
      {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
        },
      },
    );
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

  const result = await generateText({
    system: buildZainPrompt({
      guestName: guest.mainGuestName,
      ...guest.notesForAI,
    }),
    model: google("gemini-3-flash-preview"),
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
