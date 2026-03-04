import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, recipients, eventTitle, eventDate } = await req.json();

    const apiKey = Deno.env.get('BEEM_API_KEY');
    const secretKey = Deno.env.get('BEEM_SECRET_KEY');

    if (!apiKey || !secretKey) {
      // Fallback: simulate sending if keys not configured
      console.log(`[SMS] Simulated sending to ${recipients.length} recipients (Beem keys not configured)`);
      return new Response(JSON.stringify({ 
        success: true, 
        simulated: true,
        message: `SMS simulated for ${recipients.length} recipients` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    
    for (const recipient of recipients) {
      // Personalize message
      let personalizedMsg = message
        .replace(/\{name\}/g, recipient.name)
        .replace(/\{event\}/g, eventTitle)
        .replace(/\{date\}/g, eventDate ? new Date(eventDate).toLocaleDateString('sw-TZ') : '');

      // Format phone: remove + prefix, ensure starts with 255
      let phone = recipient.phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '255' + phone.substring(1);
      if (!phone.startsWith('255')) phone = '255' + phone;

      try {
        const response = await fetch('https://apisms.bfrancis.co.tz/public/v1/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(apiKey + ':' + secretKey),
          },
          body: JSON.stringify({
            source_addr: 'SmartEvent',
            schedule_time: '',
            encoding: 0,
            message: personalizedMsg,
            recipients: [{ recipient_id: 1, dest_addr: phone }],
          }),
        });

        const data = await response.json();
        results.push({ phone, status: 'sent', response: data });
      } catch (err) {
        results.push({ phone, status: 'failed', error: err.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
