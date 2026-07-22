import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEEM_API_URL = 'https://apisms.beem.africa/v1/send';
const BEEM_BALANCE_URL = 'https://apisms.beem.africa/public/v1/vendors/balance';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller
    const userAuthHeader = req.headers.get('Authorization');
    if (!userAuthHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrlEnv = Deno.env.get('SUPABASE_URL')!;
    const anonKeyEnv = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrlEnv, anonKeyEnv, {
      global: { headers: { Authorization: userAuthHeader } },
    });
    const jwt = userAuthHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(jwt);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authenticatedUserId = claimsData.claims.sub as string;

    const apiKey = Deno.env.get('BEEM_API_KEY');
    const secretKey = Deno.env.get('BEEM_SECRET_KEY');

    if (!apiKey || !secretKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'SMS service is not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = 'Basic ' + btoa(apiKey + ':' + secretKey);
    const body = await req.json();
    const { action } = body;

    // Check balance
    if (action === 'balance') {
      const response = await fetch(BEEM_BALANCE_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('[send-sms] Beem balance check failed', response.status, data);
        return new Response(JSON.stringify({ error: 'Unable to fetch SMS balance' }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send SMS
    const { message, recipients, eventTitle, eventDate, senderID, scheduleTime, logSms, eventId } = body;
    // Always trust the authenticated user id from the JWT
    const userId = authenticatedUserId;

    // Input validation
    if (typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (message.length > 1000) {
      return new Response(JSON.stringify({ success: false, error: 'Message too long (max 1000 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Array.isArray(recipients) || recipients.length === 0 || recipients.length > 500) {
      return new Response(JSON.stringify({ success: false, error: 'Recipient count must be between 1 and 500' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const phoneRe = /^[0-9+\s()-]{7,20}$/;
    for (const r of recipients) {
      if (!r || typeof r !== 'object' || typeof (r as any).phone !== 'string' || !phoneRe.test((r as any).phone)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid recipient phone number' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    if (senderID !== undefined && senderID !== null && (typeof senderID !== 'string' || senderID.length > 11)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid sender ID' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sourceAddr = senderID || 'SmartEvents';

    // Build Beem recipients array
    const beemRecipients = recipients.map((r: any, index: number) => {
      let phone = r.phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '255' + phone.substring(1);
      if (!phone.startsWith('255')) phone = '255' + phone;
      return {
        recipient_id: index + 1,
        dest_addr: phone,
      };
    });

    const hasPlaceholders = /\{[a-zA-Z0-9_]+\}/.test(message);
    const charCount = message.length;
    const smsCount = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

    const results: any[] = [];

    // Initialize Supabase client for logging
    let supabaseClient: any = null;
    if (logSms) {
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      supabaseClient = createClient(supabaseUrlEnv, supabaseServiceKey);
    }

    const isScheduled = !!scheduleTime;

    if (hasPlaceholders) {
      // Send individually for personalized messages
      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        let personalizedMsg = message
          .replace(/\{name\}/g, r.name || '')
          .replace(/\{event\}/g, eventTitle || '')
          .replace(/\{date\}/g, eventDate ? new Date(eventDate).toLocaleDateString('sw-TZ') : '');

        // Replace any custom {variable} tokens from r.vars
        if (r.vars && typeof r.vars === 'object') {
          for (const [key, value] of Object.entries(r.vars)) {
            const re = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g');
            personalizedMsg = personalizedMsg.replace(re, String(value ?? ''));
          }
        }
        // Clean up any unresolved placeholders
        personalizedMsg = personalizedMsg.replace(/\{[a-zA-Z0-9_]+\}/g, '');

        try {
          const response = await fetch(BEEM_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              source_addr: sourceAddr,
              schedule_time: scheduleTime || '',
              encoding: 0,
              message: personalizedMsg,
              recipients: [beemRecipients[i]],
            }),
          });

          const data = await response.json();
          const status = response.ok ? (isScheduled ? 'scheduled' : 'sent') : 'failed';
          results.push({ 
            phone: beemRecipients[i].dest_addr, 
            name: r.name,
            status, 
            response: data 
          });

          // Log to database
          if (supabaseClient) {
            await supabaseClient.from('sms_logs').insert({
              user_id: userId,
              event_id: eventId || null,
              recipient_name: r.name || null,
              recipient_phone: beemRecipients[i].dest_addr,
              message: personalizedMsg,
              status,
              scheduled_at: isScheduled ? new Date(scheduleTime.replace(' ', 'T')).toISOString() : null,
              beem_response: data,
              sms_count: smsCount,
            });
          }
        } catch (err) {
          results.push({ 
            phone: beemRecipients[i].dest_addr, 
            status: 'failed', 
            error: err.message 
          });
          if (supabaseClient) {
            await supabaseClient.from('sms_logs').insert({
              user_id: userId,
              event_id: eventId || null,
              recipient_name: r.name || null,
              recipient_phone: beemRecipients[i].dest_addr,
              message: personalizedMsg,
              status: 'failed',
              beem_response: { error: err.message },
              sms_count: smsCount,
            });
          }
        }
      }
    } else {
      // Send bulk (same message to all)
      try {
        const response = await fetch(BEEM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            source_addr: sourceAddr,
            schedule_time: scheduleTime || '',
            encoding: 0,
            message,
            recipients: beemRecipients,
          }),
        });

        const data = await response.json();
        const status = response.ok ? (isScheduled ? 'scheduled' : 'sent') : 'failed';
        results.push({ 
          status, 
          count: beemRecipients.length, 
          response: data 
        });

        // Log each recipient
        if (supabaseClient) {
          const logEntries = recipients.map((r: any, i: number) => ({
            user_id: userId,
            event_id: eventId || null,
            recipient_name: r.name || null,
            recipient_phone: beemRecipients[i].dest_addr,
            message,
            status,
            scheduled_at: isScheduled ? new Date(scheduleTime.replace(' ', 'T')).toISOString() : null,
            beem_response: data,
            sms_count: smsCount,
          }));
          await supabaseClient.from('sms_logs').insert(logEntries);
        }
      } catch (err) {
        results.push({ status: 'failed', error: err.message });
        if (supabaseClient) {
          const logEntries = recipients.map((r: any, i: number) => ({
            user_id: userId,
            event_id: eventId || null,
            recipient_name: r.name || null,
            recipient_phone: beemRecipients[i].dest_addr,
            message,
            status: 'failed',
            beem_response: { error: err.message },
            sms_count: smsCount,
          }));
          await supabaseClient.from('sms_logs').insert(logEntries);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SMS Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
