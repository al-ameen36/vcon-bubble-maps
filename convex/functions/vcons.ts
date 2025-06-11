import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const saveVcon = mutation({
  args: {
    vcon: v.any(),
  },
  handler: async (ctx, { vcon }) => {
    await ctx.db.insert("vcons", vcon);
    return { success: true };
  },
});

export const getVconList = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("vcons")
      .order("desc")
      .paginate(args.paginationOpts);
    return tasks;
  },
});
