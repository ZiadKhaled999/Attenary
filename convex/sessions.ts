import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUser = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sessions").collect();
  },
});

export const bulkUpsert = mutation({
  args: {
    items: v.array(v.object({
      user_id: v.string(),
      check_in_time: v.number(),
      check_out_time: v.optional(v.number()),
      reason: v.optional(v.string()),
      reason_edited_at: v.optional(v.number()),
      updated_at: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const item of args.items) {
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_user_checkin", (q) =>
          q.eq("user_id", item.user_id).eq("check_in_time", item.check_in_time)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, item);
        results.push(existing._id);
      } else {
        const id = await ctx.db.insert("sessions", {
          ...item,
          created_at: item.updated_at,
        });
        results.push(id);
      }
    }
    return results;
  },
});
