"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getAppBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  throw new Error(
    "Missing application base URL. Set NEXT_PUBLIC_APP_URL, APP_URL, or VERCEL_URL.",
  );
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

      const appBaseUrl = getAppBaseUrl();
      const response = await fetch(`${appBaseUrl}/api/chat/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-chat-secret": getRequiredEnv(
            "INTERNAL_CHAT_PROCESS_SECRET",
          ),
        },
        body: JSON.stringify({
          conversationId: args.conversationId,
          batchId: args.batchId,
          scheduleVersion: args.scheduleVersion,
        }),
      });

      const payload = (await response.json()) as
        | { text: string; twilioMessageSid?: string }
        | { error: string };

      if (!response.ok || !("text" in payload)) {
        throw new Error(
          "error" in payload
            ? payload.error
            : "Next.js processing route returned an invalid response.",
        );
      }

      console.info("[chat worker] next route processed pending reply", {
        conversationId: args.conversationId,
        batchId: args.batchId,
        scheduleVersion: args.scheduleVersion,
        twilioMessageSid: payload.twilioMessageSid,
      });

      await ctx.runMutation(internal.conversations.completePendingReply, {
        conversationId: args.conversationId,
        batchId: args.batchId,
        content: payload.text,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown chat worker error";

      console.error("[chat worker] failed to process pending reply", {
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
