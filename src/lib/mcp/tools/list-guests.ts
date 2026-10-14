import { supabaseForUser as db } from "../supabase";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";


export default defineTool({
  name: "list_guests",
  title: "List guests for an event",
  description: "List guests for a specific event owned by the signed-in user.",
  inputSchema: {
    event_id: z.string().uuid().describe("The event UUID."),
    limit: z.number().int().min(1).max(500).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await db(ctx)
      .from("guests")
      .select("id, full_name, phone, card_number, rsvp_status, checked_in, created_at")
      .eq("event_id", event_id).eq("user_id", ctx.getUserId()).is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { guests: data },
    };
  },
});