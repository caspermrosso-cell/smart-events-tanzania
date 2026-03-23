import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { message, recipients, eventTitle, eventDate, senderID } = body;

    if (!message || !recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Ujumbe na wapokeaji vinahitajika' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sourceAddr = senderID || 'SmartEvent';

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

    // Personalize message for each recipient if needed
    // Beem sends same message to all recipients in one call
    // For personalized messages, we need separate calls
    const hasPlaceholders = message.includes('{name}') || message.includes('{event}') || message.includes('{date}');

    const results = [];

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
              schedule_time: '',
              encoding: 0,
              message: personalizedMsg,
              recipients: [beemRecipients[i]],
            }),
          });

          const data = await response.json();
          results.push({ 
            phone: beemRecipients[i].dest_addr, 
            status: response.ok ? 'sent' : 'failed', 
            response: data 
          });
        } catch (err) {
          results.push({ 
            phone: beemRecipients[i].dest_addr, 
            status: 'failed', 
            error: err.message 
          });
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
            schedule_time: '',
            encoding: 0,
            message,
            recipients: beemRecipients,
          }),
        });

        const data = await response.json();
        results.push({ 
          status: response.ok ? 'sent' : 'failed', 
          count: beemRecipients.length, 
          response: data 
        });
      } catch (err) {
        results.push({ 
          status: 'failed', 
          error: err.message 
        });
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
