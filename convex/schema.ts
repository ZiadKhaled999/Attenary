import { defineTable, defineSchema } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    user_id: v.string(),
    email: v.optional(v.string()),
    full_name: v.optional(v.string()),
    job_title: v.optional(v.string()),
    department: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    onboarding_completed: v.boolean(),
    language: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_id", ["user_id"]),

  sessions: defineTable({
    user_id: v.string(),
    check_in_time: v.number(),
    check_out_time: v.optional(v.number()),
    reason: v.optional(v.string()),
    reason_edited_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_user_checkin", ["user_id", "check_in_time"]),

  feedbacks: defineTable({
    user_id: v.string(),
    type: v.string(),
    email: v.optional(v.string()),
    content: v.string(),
    metadata: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_user_id", ["user_id"]),

  app_settings: defineTable({
    user_id: v.string(),
    theme: v.optional(v.string()),
    notifications: v.optional(v.boolean()),
    onboarding_completed: v.optional(v.boolean()),
    onboarding_progress: v.optional(v.number()),
    hour_rate: v.optional(v.number()),
    currency: v.optional(v.string()),
    last_sync_token: v.optional(v.string()),
  })
    .index("by_user_id", ["user_id"]),

  sync_watermark: defineTable({
    user_id: v.string(),
    entity_type: v.string(),
    last_synced_ts: v.number(),
  })
    .index("by_user_entity", ["user_id", "entity_type"]),

  sync_queue: defineTable({
    user_id: v.string(),
    entity_type: v.string(),
    entity_id: v.string(),
    operation: v.union(v.literal("upsert"), v.literal("delete")),
    payload: v.string(),
    retry_count: v.number(),
    created_at: v.number(),
    processed_at: v.optional(v.number()),
  })
    .index("by_user_pending", ["user_id", "processed_at"])
    .index("by_user_entity", ["user_id", "entity_type"]),
});
