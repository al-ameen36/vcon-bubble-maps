import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  vcons: defineTable({
    uuid: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
    dialog: v.array(
      v.object({
        alg: v.string(),
        url: v.string(),
        meta: v.object({
          direction: v.string(),
          disposition: v.string(),
        }),
        type: v.string(),
        start: v.string(),
        parties: v.array(v.number()),
        duration: v.number(),
        filename: v.string(),
        mimetype: v.string(),
        signature: v.string(),
      })
    ),
    parties: v.array(
      v.object({
        tel: v.string(),
        name: v.string(),
        meta: v.object({ role: v.string() }),
        mailto: v.optional(v.string()),
        email: v.optional(v.string()),
      })
    ),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.string(),
          encoding: v.string(),
          body: v.any(),
        })
      )
    ),
    analysis: v.optional(
      v.array(
        v.object({
          type: v.string(),
          dialog: v.optional(v.number()),
          vendor: v.string(),
          encoding: v.string(),
          body: v.any(),
          vendor_schema: v.optional(v.any()),
        })
      )
    ),
  }),
});
