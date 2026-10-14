import { supabaseForUser as db } from "../supabase";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";


export default defineTool({
  name: "list_invoices",
  title: "List invoices",
  description: "List invoices for the signed-in user, optionally filtered by status.",
  inputSchema: {
    status: z.string().optional().describe("Optional status filter (e.g. draft, sent, paid)."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = db(ctx)
      .from("invoices")
      .select("id, invoice_number, client_name, grand_total, status, created_at, payment_due_days")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { invoices: data },
    };
  },
});