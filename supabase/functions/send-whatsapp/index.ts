import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CHAT_API_URL = 'https://apichatcore.beem.africa/v1/chatapi';
const ACTIVE_SESSIONS_URL = 'https://apichatcore.beem.africa/v1/chatapi/active-users';
const TEMPLATES_URL = 'https://apibroadcast.beem.africa/v1/message-templates/list';
const BROADCAST_TEMPLATE_URL = 'https://apibroadcast.beem.africa/v1/broadcast/template/api-send';

type BeemRequestResult = {
  ok: boolean;
  status: number;
  data: any | null;
  contentType: string;
  rawText: string;
};

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

async function makeBeemRequest(url: string, init: RequestInit): Promise<BeemRequestResult> {
  const response = await fetch(url, init);
  const contentType = response.headers.get('content-type') ?? '';
  const rawText = await response.text();

  let data: any | null = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    console.error('Beem request failed:', JSON.stringify({
      url,
      status: response.status,
      contentType,
      body: rawText.substring(0, 500),
    }));
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    contentType,
    rawText,
  };
}

function getBeemErrorMessage(result: BeemRequestResult, fallback: string): string {
  if (result.data?.message) {
    return `${fallback} (HTTP ${result.status}): ${result.data.message}`;
  }

  if (result.data) {
    return `${fallback} (HTTP ${result.status}): ${JSON.stringify(result.data)}`;
  }

  const cleanText = result.rawText.replace(/\s+/g, ' ').trim().slice(0, 240);
  return `${fallback} (HTTP ${result.status})${result.contentType ? ` [${result.contentType}]` : ''}: ${cleanText || 'No response body'}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = getAuthHeader();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload received.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action } = body;

    if (action === 'active-sessions') {
      const result = await makeBeemRequest(ACTIVE_SESSIONS_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });

      if (!result.ok || !result.data) {
        throw new Error(getBeemErrorMessage(result, 'Active sessions failed'));
      }

      return new Response(JSON.stringify({ success: true, data: result.data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'templates') {
      const params = new URLSearchParams();
      if (body.name) params.set('name', body.name);
      if (body.category) params.set('category', body.category);
      if (body.status) params.set('status', body.status);
      if (body.q) params.set('q', body.q);

      const url = `${TEMPLATES_URL}${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching templates from:', url);

      const result = await makeBeemRequest(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });

      if (!result.ok || !result.data) {
        return new Response(JSON.stringify({
          success: false,
          data: {
            data: [],
            pagination: {},
          },
          warning: result.status === 500
            ? 'Beem templates service is returning an upstream error. Confirm your Beem account has WhatsApp Broadcast/Templates enabled.'
            : getBeemErrorMessage(result, 'Templates fetch failed'),
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, data: result.data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send-template') {
      const { from_addr, destination_addr, channel, content, messageTemplateData, userId, eventId } = body;

      if (!from_addr || !destination_addr || !messageTemplateData?.id) {
        return new Response(JSON.stringify({ success: false, error: 'from_addr, destination_addr, and messageTemplateData.id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await makeBeemRequest(BROADCAST_TEMPLATE_URL, {
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

      const data = result.data ?? { error: getBeemErrorMessage(result, 'Template send failed') };

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
          status: result.ok ? 'sent' : 'failed',
          beem_response: data,
        }));
        await supabase.from('whatsapp_logs').insert(logEntries);
      }

      if (!result.ok || !result.data) {
        throw new Error(getBeemErrorMessage(result, 'Template send failed'));
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

      const result = await makeBeemRequest(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(messagePayload),
      });

      const data = result.data ?? { error: getBeemErrorMessage(result, 'Message send failed') };

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
          status: result.ok ? 'sent' : 'failed',
          beem_response: data,
        });
      }

      if (!result.ok || !result.data) {
        throw new Error(getBeemErrorMessage(result, 'Message send failed'));
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
          const result = await makeBeemRequest(CHAT_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify(messagePayload),
          });

          const responseData = result.data ?? { error: getBeemErrorMessage(result, 'Bulk message send failed') };
          const status = result.ok && result.data ? 'sent' : 'failed';
          results.push({ phone, name: recipient.name, status, response: responseData });

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
              beem_response: responseData,
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          results.push({ phone, name: recipient.name, status: 'failed', error: message });
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
              beem_response: { error: message },
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
