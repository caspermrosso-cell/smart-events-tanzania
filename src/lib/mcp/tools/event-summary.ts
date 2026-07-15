import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function db(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "event_summary",
  title: "Event summary",
  description: "Return counts and totals for a specific event: guests, checked-in, pledges, and amounts pledged/paid.",
  inputSchema: { event_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = db(ctx);

    const [eventRes, guestsRes, pledgesRes] = await Promise.all([
      supabase.from("events").select("id, name, event_date, venue, status, expected_guests").eq("id", event_id).maybeSingle(),
      supabase.from("guests").select("id, checked_in").eq("event_id", event_id),
      supabase.from("pledges").select("amount_pledged, amount_paid, status").eq("event_id", event_id),
    ]);

    if (eventRes.error) return { content: [{ type: "text", text: eventRes.error.message }], isError: true };
    if (!eventRes.data) return { content: [{ type: "text", text: "Event not found" }], isError: true };

    const guests = guestsRes.data ?? [];
    const pledges = pledgesRes.data ?? [];
    const totalPledged = pledges.reduce((s, p: any) => s + Number(p.amount_pledged || 0), 0);
    const totalPaid = pledges.reduce((s, p: any) => s + Number(p.amount_paid || 0), 0);

    const summary = {
      event: eventRes.data,
      guests: { total: guests.length, checked_in: guests.filter((g: any) => g.checked_in).length },
      pledges: {
        total: pledges.length,
        total_pledged_tzs: totalPledged,
        total_paid_tzs: totalPaid,
        outstanding_tzs: Math.max(0, totalPledged - totalPaid),
      },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});