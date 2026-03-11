"use node";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import twilio from "twilio";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { buildZaynPrompt } from "../app/api/chat/promptBuilder";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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

function buildSystemPrompt(guest: Doc<"guests">) {
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
    plusOneName: guest.plusOneName,
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

  console.info("[chat worker] calling twilio messages.create", {
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

export const sendPendingReply = internalAction({
  args: {
    conversationId: v.id("conversations"),
    batchId: v.number(),
    scheduleVersion: v.number(),
  },
  handler: async (ctx, args) => {
    console.info("[chat worker] attempting to process pending reply", {
      conversationId: args.conversationId,
      batchId: args.batchId,
      scheduleVersion: args.scheduleVersion,
    });

    const claimed = await ctx.runMutation(
      internal.conversations.claimPendingReply,
      {
        conversationId: args.conversationId,
        batchId: args.batchId,
        scheduleVersion: args.scheduleVersion,
      },
    );

    if (!claimed) {
      console.info("[chat worker] skipped stale or already-claimed job", {
        conversationId: args.conversationId,
        batchId: args.batchId,
        scheduleVersion: args.scheduleVersion,
      });
      return;
    }

    try {
      const replyContext = await ctx.runQuery(
        internal.conversations.getReplyContext,
        {
          conversationId: args.conversationId,
          batchId: args.batchId,
        },
      );

      if (!replyContext || replyContext.batchMessages.length === 0) {
        console.warn(
          "[chat worker] claimed batch without pending user messages",
          {
            conversationId: args.conversationId,
            batchId: args.batchId,
          },
        );
        await ctx.runMutation(internal.conversations.clearProcessingBatch, {
          conversationId: args.conversationId,
          batchId: args.batchId,
        });
        return;
      }

      const conversationHistory: ChatMessage[] = replyContext.messages.map(
        (message) => ({
          role: message.role,
          content: message.content,
        }),
      );

      const result = await generateText({
        system: buildSystemPrompt(replyContext.guest),
        model: openai("gpt-5.4"),
        messages: conversationHistory,
      });

      console.info("[chat worker] sending whatsapp reply", {
        conversationId: args.conversationId,
        batchId: args.batchId,
        guestId: replyContext.guest._id,
        to: normalizeWhatsappAddress(replyContext.guest.phone),
        inboundMessageCount: replyContext.batchMessages.length,
        replyLength: result.text.length,
      });

      const twilioMessage = await sendWhatsappMessage(
        replyContext.guest.phone,
        result.text,
      );

      console.info("[chat worker] sent whatsapp reply", {
        conversationId: args.conversationId,
        batchId: args.batchId,
        guestId: replyContext.guest._id,
        to: replyContext.guest.phone,
        twilioMessageSid: twilioMessage.sid,
      });

      await ctx.runMutation(internal.conversations.completePendingReply, {
        conversationId: args.conversationId,
        batchId: args.batchId,
        content: result.text,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown chat worker error";

      console.error("[chat worker] failed to send pending reply", {
        conversationId: args.conversationId,
        batchId: args.batchId,
        scheduleVersion: args.scheduleVersion,
        error: message,
        cause: error,
      });

      await ctx.runMutation(internal.conversations.retryPendingReply, {
        conversationId: args.conversationId,
        batchId: args.batchId,
        errorMessage: message,
      });
    }
  },
});
