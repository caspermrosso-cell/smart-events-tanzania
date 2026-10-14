import { supabaseForUser as db } from "../supabase";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";


export default defineTool({
  name: "list_pledges",
  title: "List pledges",
  description: "List pledges, optionally filtered by event_id, for the signed-in user.",
  inputSchema: {
    event_id: z.string().uuid().optional().describe("Optional event UUID filter."),
    limit: z.number().int().min(1).max(500).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = db(ctx)
      .from("pledges")
      .select("id, event_id, guest_name, amount, paid_amount, status, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);
    if (event_id) q = q.eq("event_id", event_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { pledges: data },
    };
  },
});