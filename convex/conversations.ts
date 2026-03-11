import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";

const REPLY_DEBOUNCE_MS = 10_000;
const MAX_BATCH_WINDOW_MS = 30_000;
const FAILURE_RETRY_MS = 5_000;

function sortMessagesByCreationTime<
  T extends {
    _creationTime: number;
  },
>(messages: T[]) {
  return [...messages].sort((a, b) => a._creationTime - b._creationTime);
}

async function getOrCreateConversation(ctx: MutationCtx, guestId: Id<"guests">) {
  const guest = await ctx.db.get(guestId);

  if (!guest) {
    throw new Error("Guest not found.");
  }

  if (guest.conversationId) {
    const existingConversation = await ctx.db.get(guest.conversationId);

    if (existingConversation) {
      return existingConversation;
    }
  }

  const indexedConversation = await ctx.db
    .query("conversations")
    .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
    .first();

  if (indexedConversation) {
    await ctx.db.patch(guestId, {
      conversationId: indexedConversation._id,
    });
    return indexedConversation;
  }

  const conversationId = await ctx.db.insert("conversations", {
    guestId,
    lastBatchId: 0,
  });

  await ctx.db.patch(guestId, {
    conversationId,
  });

  return {
    _id: conversationId,
    _creationTime: Date.now(),
    guestId,
    lastBatchId: 0,
  };
}

function getPendingDelayMs(dueAt: number, now: number) {
  return Math.max(0, dueAt - now);
}

export const getByGuestId = query({
  args: {
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    const guest = await ctx.db.get(args.guestId);

    if (guest?.conversationId) {
      const conversation = await ctx.db.get(guest.conversationId);

      if (conversation) {
        return conversation;
      }
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_guestId", (q) => q.eq("guestId", args.guestId))
      .first();
  },
});

export const create = mutation({
  args: {
    guestId: v.id("guests"),
  },
  handler: async (ctx, args) => {
    const conversation = await getOrCreateConversation(ctx, args.guestId);
    return conversation._id;
  },
});

export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return sortMessagesByCreationTime(messages);
  },
});

export const createMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    batchId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", args);
  },
});

export const receiveIncomingMessage = mutation({
  args: {
    guestId: v.id("guests"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedContent = args.content.trim();

    if (!trimmedContent) {
      throw new Error("Message content is required.");
    }

    const conversation = await getOrCreateConversation(ctx, args.guestId);
    const now = Date.now();

    const batchId =
      conversation.pendingBatchId ?? conversation.lastBatchId + 1;
    const scheduleVersion =
      conversation.pendingBatchId === undefined
        ? 1
        : (conversation.pendingScheduleVersion ?? 0) + 1;
    const batchStartedAt =
      conversation.pendingBatchId === undefined
        ? now
        : (conversation.pendingReplyStartedAt ?? now);
    const dueAt = Math.min(now + REPLY_DEBOUNCE_MS, batchStartedAt + MAX_BATCH_WINDOW_MS);

    await ctx.db.insert("messages", {
      conversationId: conversation._id,
      role: "user",
      content: trimmedContent,
      batchId,
    });

    await ctx.db.patch(conversation._id, {
      lastBatchId: batchId,
      pendingBatchId: batchId,
      pendingScheduleVersion: scheduleVersion,
      pendingReplyStartedAt: batchStartedAt,
      pendingReplyDueAt: dueAt,
      lastUserMessageAt: now,
      lastReplyError: undefined,
    });

    await ctx.scheduler.runAfter(
      getPendingDelayMs(dueAt, now),
      internal.chatWorker.sendPendingReply,
      {
        conversationId: conversation._id,
        batchId,
        scheduleVersion,
      },
    );
  },
});

export const claimPendingReply = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    batchId: v.number(),
    scheduleVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      return false;
    }

    if (
      conversation.pendingBatchId !== args.batchId ||
      conversation.pendingScheduleVersion !== args.scheduleVersion
    ) {
      return false;
    }

    if (conversation.processingBatchId !== undefined) {
      return false;
    }

    if (
      conversation.pendingReplyDueAt === undefined ||
      conversation.pendingReplyDueAt > Date.now()
    ) {
      return false;
    }

    await ctx.db.patch(args.conversationId, {
      pendingBatchId: undefined,
      pendingScheduleVersion: undefined,
      pendingReplyStartedAt: undefined,
      pendingReplyDueAt: undefined,
      lastUserMessageAt: undefined,
      processingBatchId: args.batchId,
      processingScheduleVersion: args.scheduleVersion,
      lastReplyError: undefined,
    });

    return true;
  },
});

export const getReplyContext = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    batchId: v.number(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      return null;
    }

    const guest = await ctx.db.get(conversation.guestId);

    if (!guest) {
      return null;
    }

    const messages = sortMessagesByCreationTime(
      await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", args.conversationId),
        )
        .collect(),
    );

    const batchMessages = messages.filter(
      (message) => message.batchId === args.batchId && message.role === "user",
    );

    return {
      conversation,
      guest,
      messages,
      batchMessages,
    };
  },
});

export const getReplyContextForProcessing = query({
  args: {
    conversationId: v.id("conversations"),
    batchId: v.number(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      return null;
    }

    const guest = await ctx.db.get(conversation.guestId);

    if (!guest) {
      return null;
    }

    const messages = sortMessagesByCreationTime(
      await ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", args.conversationId),
        )
        .collect(),
    );

    const batchMessages = messages.filter(
      (message) => message.batchId === args.batchId && message.role === "user",
    );

    return {
      conversation,
      guest,
      messages,
      batchMessages,
    };
  },
});

export const completePendingReply = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    batchId: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || conversation.processingBatchId !== args.batchId) {
      return false;
    }

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: args.content,
      batchId: args.batchId,
    });

    await ctx.db.patch(args.conversationId, {
      processingBatchId: undefined,
      processingScheduleVersion: undefined,
      lastReplyError: undefined,
    });

    const updatedConversation = await ctx.db.get(args.conversationId);

    if (
      updatedConversation?.pendingBatchId !== undefined &&
      updatedConversation.pendingScheduleVersion !== undefined &&
      updatedConversation.pendingReplyDueAt !== undefined
    ) {
      await ctx.scheduler.runAfter(
        getPendingDelayMs(updatedConversation.pendingReplyDueAt, Date.now()),
        internal.chatWorker.sendPendingReply,
        {
          conversationId: args.conversationId,
          batchId: updatedConversation.pendingBatchId,
          scheduleVersion: updatedConversation.pendingScheduleVersion,
        },
      );
    }

    return true;
  },
});

export const clearProcessingBatch = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    batchId: v.number(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || conversation.processingBatchId !== args.batchId) {
      return false;
    }

    await ctx.db.patch(args.conversationId, {
      processingBatchId: undefined,
      processingScheduleVersion: undefined,
      lastReplyError: undefined,
    });

    const updatedConversation = await ctx.db.get(args.conversationId);

    if (
      updatedConversation?.pendingBatchId !== undefined &&
      updatedConversation.pendingScheduleVersion !== undefined &&
      updatedConversation.pendingReplyDueAt !== undefined
    ) {
      await ctx.scheduler.runAfter(
        getPendingDelayMs(updatedConversation.pendingReplyDueAt, Date.now()),
        internal.chatWorker.sendPendingReply,
        {
          conversationId: args.conversationId,
          batchId: updatedConversation.pendingBatchId,
          scheduleVersion: updatedConversation.pendingScheduleVersion,
        },
      );
    }

    return true;
  },
});

export const retryPendingReply = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    batchId: v.number(),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || conversation.processingBatchId !== args.batchId) {
      return false;
    }

    const now = Date.now();

    await ctx.db.patch(args.conversationId, {
      processingBatchId: undefined,
      processingScheduleVersion: undefined,
      pendingBatchId: conversation.pendingBatchId ?? args.batchId,
      pendingScheduleVersion:
        conversation.pendingBatchId === undefined
          ? (conversation.processingScheduleVersion ?? 0) + 1
          : conversation.pendingScheduleVersion,
      pendingReplyStartedAt: conversation.pendingReplyStartedAt ?? now,
      pendingReplyDueAt:
        conversation.pendingBatchId === undefined
          ? now + FAILURE_RETRY_MS
          : conversation.pendingReplyDueAt,
      lastUserMessageAt: conversation.lastUserMessageAt ?? now,
      lastReplyError: args.errorMessage,
    });

    const updatedConversation = await ctx.db.get(args.conversationId);

    if (
      updatedConversation?.pendingBatchId !== undefined &&
      updatedConversation.pendingScheduleVersion !== undefined &&
      updatedConversation.pendingReplyDueAt !== undefined
    ) {
      await ctx.scheduler.runAfter(
        getPendingDelayMs(updatedConversation.pendingReplyDueAt, now),
        internal.chatWorker.sendPendingReply,
        {
          conversationId: args.conversationId,
          batchId: updatedConversation.pendingBatchId,
          scheduleVersion: updatedConversation.pendingScheduleVersion,
        },
      );
    }

    return true;
  },
});
