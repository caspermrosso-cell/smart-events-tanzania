import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHAT_API_URL = 'https://apichatcore.beem.africa/v1/chatapi';
const ACTIVE_SESSIONS_URL = 'https://apichatcore.beem.africa/v1/chatapi/active-users';
const TEMPLATES_URL = 'https://apichatcore.beem.africa/v1/message-templates/list';
const BROADCAST_TEMPLATE_URL = 'https://apibroadcast.beem.africa/v1/broadcast/template/api-send';

function getAuthHeader(): string {
  const apiKey = Deno.env.get('BEEM_API_KEY');
  const secretKey = Deno.env.get('BEEM_SECRET_KEY');
  if (!apiKey || !secretKey) {
    throw new Error('BEEM_API_KEY or BEEM_SECRET_KEY not configured');
  }
  return 'Basic ' + btoa(apiKey + ':' + secretKey);
}

function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = getAuthHeader();
    const body = await req.json();
    const { action } = body;

    // ========== GET ACTIVE SESSIONS ==========
    if (action === 'active-sessions') {
      const response = await fetch(ACTIVE_SESSIONS_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Active sessions failed [${response.status}]: ${JSON.stringify(data)}`);
      }
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== FETCH WHATSAPP TEMPLATES ==========
    if (action === 'templates') {
      const params = new URLSearchParams();
      if (body.name) params.set('name', body.name);
      if (body.category) params.set('category', body.category);
      if (body.status) params.set('status', body.status);
      if (body.q) params.set('q', body.q);

      const url = `${TEMPLATES_URL}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Templates fetch failed [${response.status}]: ${JSON.stringify(data)}`);
      }
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== SEND TEMPLATE MESSAGE (BROADCAST) ==========
    if (action === 'send-template') {
      const { from_addr, destination_addr, channel, content, messageTemplateData, userId, eventId } = body;

      if (!from_addr || !destination_addr || !messageTemplateData?.id) {
        return new Response(JSON.stringify({ success: false, error: 'from_addr, destination_addr, and messageTemplateData.id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(BROADCAST_TEMPLATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          from_addr,
          destination_addr,
          channel: channel || 'whatsapp',
          content: content || {},
          messageTemplateData,
        }),
      });

      const data = await response.json();

      // Log to database
      if (userId) {
        const supabase = getSupabaseClient();
        const logEntries = destination_addr.map((dest: any) => ({
          user_id: userId,
          event_id: eventId || null,
          recipient_phone: dest.phoneNumber,
          channel: channel || 'whatsapp',
          message_type: 'template',
          template_id: messageTemplateData.id,
          template_name: body.templateName || null,
          status: response.ok ? 'sent' : 'failed',
          beem_response: data,
        }));
        await supabase.from('whatsapp_logs').insert(logEntries);
      }

      if (!response.ok) {
        throw new Error(`Template send failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== SEND CHAT MESSAGE (text, image, document, video, location, quick_reply, list) ==========
    if (action === 'send-message') {
      const { from, to, channel, callback_url, message_type, transaction_id, text, image, document, audio, video, location, quick_reply, list_reply, userId, eventId, recipientName } = body;

      if (!from || !to || !message_type) {
        return new Response(JSON.stringify({ success: false, error: 'from, to, and message_type are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const messagePayload: any = {
        from,
        to,
        channel: channel || 'whatsapp',
        message_type,
      };

      if (callback_url) messagePayload.callback_url = callback_url;
      if (transaction_id) messagePayload.transaction_id = transaction_id;
      if (text) messagePayload.text = text;
      if (image) messagePayload.image = image;
      if (document) messagePayload.document = document;
      if (audio) messagePayload.audio = audio;
      if (video) messagePayload.video = video;
      if (location) messagePayload.location = location;
      if (quick_reply) messagePayload.quick_reply = quick_reply;
      if (list_reply) messagePayload.list_reply = list_reply;

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(messagePayload),
      });

      const data = await response.json();

      // Log to database
      if (userId) {
        const supabase = getSupabaseClient();
        await supabase.from('whatsapp_logs').insert({
          user_id: userId,
          event_id: eventId || null,
          recipient_phone: to,
          recipient_name: recipientName || null,
          channel: channel || 'whatsapp',
          message_type,
          message_content: text || null,
          media_url: image?.url || document?.url || video?.url || null,
          status: response.ok ? 'sent' : 'failed',
          beem_response: data,
        });
      }

      if (!response.ok) {
        throw new Error(`Message send failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== SEND BULK MESSAGES ==========
    if (action === 'send-bulk') {
      const { from, recipients, channel, message_type, text, image, document, video, location, quick_reply, list_reply, userId, eventId } = body;

      if (!from || !recipients || recipients.length === 0 || !message_type) {
        return new Response(JSON.stringify({ success: false, error: 'from, recipients, and message_type are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results: any[] = [];
      const supabase = userId ? getSupabaseClient() : null;

      for (const recipient of recipients) {
        let phone = recipient.phone.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = '255' + phone.substring(1);
        if (!phone.startsWith('255')) phone = '255' + phone;

        const messagePayload: any = {
          from,
          to: phone,
          channel: channel || 'whatsapp',
          message_type,
        };

        // Personalize text with placeholders
        let personalizedText = text || '';
        if (personalizedText.includes('{name}')) {
          personalizedText = personalizedText.replace(/\{name\}/g, recipient.name || '');
        }
        if (personalizedText) messagePayload.text = personalizedText;
        if (image) messagePayload.image = image;
        if (document) messagePayload.document = document;
        if (video) messagePayload.video = video;
        if (location) messagePayload.location = location;
        if (quick_reply) messagePayload.quick_reply = quick_reply;
        if (list_reply) messagePayload.list_reply = list_reply;

        try {
          const response = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify(messagePayload),
          });

          const data = await response.json();
          const status = response.ok ? 'sent' : 'failed';
          results.push({ phone, name: recipient.name, status, response: data });

          if (supabase) {
            await supabase.from('whatsapp_logs').insert({
              user_id: userId,
              event_id: eventId || null,
              recipient_phone: phone,
              recipient_name: recipient.name || null,
              channel: channel || 'whatsapp',
              message_type,
              message_content: personalizedText || null,
              media_url: image?.url || document?.url || video?.url || null,
              status,
              beem_response: data,
            });
          }
        } catch (err) {
          results.push({ phone, name: recipient.name, status: 'failed', error: err.message });
          if (supabase) {
            await supabase.from('whatsapp_logs').insert({
              user_id: userId,
              event_id: eventId || null,
              recipient_phone: phone,
              recipient_name: recipient.name || null,
              channel: channel || 'whatsapp',
              message_type,
              message_content: personalizedText || null,
              status: 'failed',
              beem_response: { error: err.message },
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action. Use: active-sessions, templates, send-message, send-bulk, send-template' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('WhatsApp Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
