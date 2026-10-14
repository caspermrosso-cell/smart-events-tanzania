import { supabaseForUser as db } from "../supabase";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";


export default defineTool({
  name: "list_events",
  title: "List events",
  description: "List the signed-in user's events with basic details (name, date, venue, status).",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await db(ctx)
      .from("events")
      .select("id, title, event_date, venue, status, max_guests, created_at")
      .eq("user_id", ctx.getUserId()).is("deleted_at", null)
      .order("event_date", { ascending: false })
      .limit(limit ?? 25);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { events: data },
    };
  },
});