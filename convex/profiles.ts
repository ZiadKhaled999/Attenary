import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("profiles").collect();
  },
});

export const upsert = mutation({
  args: {
    user_id: v.string(),
    email: v.optional(v.string()),
    full_name: v.optional(v.string()),
    job_title: v.optional(v.string()),
    department: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    onboarding_completed: v.boolean(),
    language: v.optional(v.string()),
    updated_at: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updated_at: args.updated_at,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        ...args,
        created_at: args.updated_at,
      });
    }
  },
});
