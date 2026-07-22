// WhatsApp Template DLR callback receiver (Beem Moja)
// - GET returns 200 (used by Beem to verify the callback is active)
// - POST receives delivery reports and updates whatsapp_logs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function normPhone(raw: string): string {
  let p = String(raw || "").replace(/[^0-9]/g, "");
  if (p.startsWith("0")) p = "255" + p.substring(1);
  if (!p.startsWith("255") && p.length === 9) p = "255" + p;
  return p;
}

function parseTs(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  const s = String(ts).trim();
  // Beem sends "2023-06-26 02:31:29" — convert to ISO with UTC
  const iso = s.includes("T") ? s : s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function mapStatus(raw: string): { status: string; field?: "delivered_at" | "read_at" } {
  const s = String(raw || "").toLowerCase();
  if (s === "read") return { status: "read", field: "read_at" };
  if (s === "delivered") return { status: "delivered", field: "delivered_at" };
  if (s === "failed" || s === "undelivered" || s === "rejected") return { status: "failed" };
  if (s === "sent") return { status: "sent" };
  return { status: s || "unknown" };
}

async function handleReport(supabase: ReturnType<typeof getSupabase>, r: any) {
  const broadcastId = r.broadcast_id || r.broadcastId || r.jobId;
  const messageId = r.message_id || r.messageId;
  const phone = normPhone(r.destination || r.to || r.phoneNumber || "");
  const { status, field } = mapStatus(r.status);
  const ts = parseTs(r.timestamp);
  const message = r.message || null;

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (field) update[field] = ts;
  if (status === "failed" && message) update.error_message = String(message);

  // Try to locate the original log row: prefer broadcast_id in beem_response, else newest match by phone
  let targetId: string | null = null;

  if (broadcastId) {
    const { data } = await supabase
      .from("whatsapp_logs")
      .select("id")
      .or(
        `beem_response->data->>jobId.eq.${broadcastId},beem_response->>jobId.eq.${broadcastId}`,
      )
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) targetId = data[0].id;
  }

  if (!targetId && phone) {
    const { data } = await supabase
      .from("whatsapp_logs")
      .select("id")
      .eq("recipient_phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) targetId = data[0].id;
  }

  if (targetId) {
    await supabase.from("whatsapp_logs").update(update).eq("id", targetId);
  } else {
    // Orphan DLR — insert a stub row so it still appears in the dashboard
    await supabase.from("whatsapp_logs").insert({
      recipient_phone: phone || "unknown",
      channel: "whatsapp",
      message_type: "template",
      status,
      message_content: message,
      beem_response: r,
      error_message: status === "failed" ? String(message || "") : null,
      delivered_at: field === "delivered_at" ? ts : null,
      read_at: field === "read_at" ? ts : null,
    });
  }

  return { matched: !!targetId, broadcast_id: broadcastId, phone, status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Beem pings with GET to verify the callback is active — must return 200.
  if (req.method === "GET") {
    return new Response("ok", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = getSupabase();
    let payload: any = null;
    try {
      payload = await req.json();
    } catch {
      const text = await req.text().catch(() => "");
      console.warn("DLR non-JSON payload:", text.slice(0, 500));
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("DLR payload:", JSON.stringify(payload).slice(0, 1000));

    const reports: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.reports)
        ? payload.reports
        : Array.isArray(payload?.data)
          ? payload.data
          : [payload];

    const results = [];
    for (const r of reports) {
      if (r && typeof r === "object") {
        try {
          results.push(await handleReport(supabase, r));
        } catch (e) {
          console.error("DLR row error:", e);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DLR handler error:", error);
    // Always ack with 200 so Beem does not disable the callback
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});