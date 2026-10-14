import { supabaseForUser as db } from "../supabase";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";


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
      supabase.from("events").select("id, title, event_date, venue, status, max_guests").eq("id", event_id).eq("user_id", ctx.getUserId()).is("deleted_at", null).maybeSingle(),
      supabase.from("guests").select("id, checked_in").eq("event_id", event_id).eq("user_id", ctx.getUserId()),
      supabase.from("pledges").select("amount, paid_amount, status").eq("event_id", event_id).eq("user_id", ctx.getUserId()),
    ]);

    if (guestsRes.error || pledgesRes.error) return { content: [{ type: "text", text: "Unable to read event summary" }], isError: true };
    if (eventRes.error) return { content: [{ type: "text", text: eventRes.error.message }], isError: true };
    if (!eventRes.data) return { content: [{ type: "text", text: "Event not found" }], isError: true };

    const guests = guestsRes.data ?? [];
    const pledges = pledgesRes.data ?? [];
    const totalPledged = pledges.reduce((s, p: any) => s + Number(p.amount || 0), 0);
    const totalPaid = pledges.reduce((s, p: any) => s + Number(p.paid_amount || 0), 0);

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