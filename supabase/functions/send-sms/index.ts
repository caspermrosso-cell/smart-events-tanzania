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
    const apiKey = Deno.env.get('BEEM_API_KEY');
    const secretKey = Deno.env.get('BEEM_SECRET_KEY');

    if (!apiKey || !secretKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'BEEM_API_KEY au BEEM_SECRET_KEY hazijawekwa' 
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
        throw new Error(`Beem balance check failed [${response.status}]: ${JSON.stringify(data)}`);
      }
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send SMS
    const { message, recipients, eventTitle, eventDate, senderID, scheduleTime, logSms, userId, eventId } = body;

    if (!message || !recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Ujumbe na wapokeaji vinahitajika' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    const hasPlaceholders = message.includes('{name}') || message.includes('{event}') || message.includes('{date}');
    const charCount = message.length;
    const smsCount = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

    const results: any[] = [];

    // Initialize Supabase client for logging
    let supabaseClient: any = null;
    if (logSms && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
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
