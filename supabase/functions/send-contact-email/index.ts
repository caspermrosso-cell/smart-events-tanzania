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
    const { name, email, phone, eventType, date, guests, message } = await req.json();

    // Send email using Lovable AI gateway to format, then use SMTP-like approach
    // For now, we'll store the contact request and notify via email
    const emailBody = `
Ombi Jipya la Huduma - Smart Events

Jina: ${name}
Barua Pepe: ${email}
Simu: ${phone}
Aina ya Tukio: ${eventType}
Tarehe: ${date}
Wageni: ${guests}
Maelezo: ${message || 'Hakuna'}

---
Ombi hili limetumwa kupitia Smart Events Platform
    `.trim();

    // Use Resend or similar - for now we'll use a simple fetch to email service
    // Store in database as contact_requests for admin to see
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store contact request
    const { error } = await supabase.from('contact_requests').insert({
      name, email, phone, event_type: eventType, event_date: date, 
      expected_guests: parseInt(guests) || 0, message, status: 'new'
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Contact request saved' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
