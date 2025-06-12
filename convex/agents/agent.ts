import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { action, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { MessageDoc } from "@convex-dev/agent";
import { paginationOptsValidator, type PaginationResult } from "convex/server";
import { query } from "../_generated/server";

const vconAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions: "You are a helpful assistant.",
  maxSteps: 5,
  //   tools: { accountLookup, fileTicket, sendEmail },
});

// Use the agent from within a normal action:
export const createThread = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }): Promise<{ threadId: string }> => {
    const { threadId } = await vconAgent.createThread(ctx, { userId });
    return { threadId };
  },
});

// Pick up where you left off, with the same or a different agent:
export const continueThread = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    // Continue a thread, picking up where you left off.
    const { thread } = await vconAgent.continueThread(ctx, { threadId });
    // This includes previous message history from the thread automatically.
    const result = await thread.generateText({ prompt });
    return result.text;
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    { threadId, paginationOpts }
  ): Promise<PaginationResult<MessageDoc>> => {
    // await authorizeThreadAccess(ctx, threadId);
    const paginated = await vconAgent.listMessages(ctx, {
      threadId,
      paginationOpts,
    });
    // Here you could filter out / modify the documents
    return paginated;
  },
});
