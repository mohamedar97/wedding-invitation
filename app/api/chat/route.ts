import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";

function emptyTwimlResponse() {
  return `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
}

function unauthorizedResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get("From");
    const incomingBody = formData.get("Body");
    const phone = typeof from === "string" ? from.trim() : "";
    const messageBody =
      typeof incomingBody === "string" ? incomingBody.trim() : "";

    if (!phone || !messageBody) {
      console.warn("[chat webhook] rejected request with missing phone or body", {
        phone,
        hasMessageBody: Boolean(messageBody),
      });
      return unauthorizedResponse();
    }

    const guest = await fetchQuery(api.getGuests.getByPhone, { phone });

    if (!guest) {
      console.warn("[chat webhook] rejected unknown guest", { phone });
      return unauthorizedResponse();
    }

    await fetchMutation(api.conversations.receiveIncomingMessage, {
      guestId: guest._id,
      content: messageBody,
    });

    console.info("[chat webhook] queued inbound message", {
      guestId: guest._id,
      phone,
      messageLength: messageBody.length,
    });

    return new NextResponse(emptyTwimlResponse(), {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[chat webhook] failed to queue inbound message", error);
    throw error;
  }
}
