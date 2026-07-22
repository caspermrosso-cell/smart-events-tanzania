// WhatsApp inbound message callback receiver (Beem Moja)
// Captures replies (text) and button/list interactive responses from recipients
// and stores them into whatsapp_logs.response_text / response_at so they
// appear in the WhatsApp Dashboard "Recipient responses" section.
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
  const iso = s.includes("T") ? s : s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function extractResponseText(r: any): string {
  // Support many possible shapes: plain text, button reply, list reply, interactive
  if (typeof r?.text === "string") return r.text;
  if (typeof r?.text?.body === "string") return r.text.body;
  if (typeof r?.message === "string") return r.message;
  if (typeof r?.body === "string") return r.body;
  if (r?.button?.text) return `[Button] ${r.button.text}`;
  if (r?.button_reply?.title) return `[Button] ${r.button_reply.title}`;
  if (r?.interactive?.button_reply?.title) return `[Button] ${r.interactive.button_reply.title}`;
  if (r?.interactive?.list_reply?.title) return `[List] ${r.interactive.list_reply.title}`;
  if (r?.list_reply?.title) return `[List] ${r.list_reply.title}`;
  if (r?.quick_reply?.title) return `[Quick reply] ${r.quick_reply.title}`;
  if (r?.reply?.title) return `[Reply] ${r.reply.title}`;
  if (r?.payload) return `[Payload] ${String(r.payload)}`;
  return "";
}

async function handleInbound(supabase: ReturnType<typeof getSupabase>, r: any) {
  const phone = normPhone(
    r.from || r.source || r.sender || r.msisdn || r.phoneNumber || r.destination || "",
  );
  const text = extractResponseText(r);
  const ts = parseTs(r.timestamp || r.received_at || r.time);

  if (!phone) return { matched: false, reason: "no phone" };

  // Attach to the most recent outbound log for this recipient (any campaign)
  const { data: existing } = await supabase
    .from("whatsapp_logs")
    .select("id")
    .eq("recipient_phone", phone)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    await supabase
      .from("whatsapp_logs")
      .update({
        response_text: text || "[No text]",
        response_at: ts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing[0].id);
    return { matched: true, phone, text };
  }

  // No prior outbound — log as inbound-only row so it still shows on the dashboard
  await supabase.from("whatsapp_logs").insert({
    recipient_phone: phone,
    channel: "whatsapp",
    message_type: "inbound",
    status: "received",
    response_text: text || "[No text]",
    response_at: ts,
    beem_response: r,
  });
  return { matched: false, phone, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
      console.warn("Inbound non-JSON payload:", text.slice(0, 500));
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Inbound payload:", JSON.stringify(payload).slice(0, 1000));

    const messages: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.messages)
        ? payload.messages
        : Array.isArray(payload?.data)
          ? payload.data
          : [payload];

    const results = [];
    for (const r of messages) {
      if (r && typeof r === "object") {
        try {
          results.push(await handleInbound(supabase, r));
        } catch (e) {
          console.error("Inbound row error:", e);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Inbound handler error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});