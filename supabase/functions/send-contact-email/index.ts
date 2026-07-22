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
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { name, email, phone, eventType, date, guests, message } = body as Record<string, unknown>;

    // Input validation
    const isStr = (v: unknown, min: number, max: number) =>
      typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!isStr(name, 1, 100)) {
      return new Response(JSON.stringify({ error: 'Invalid name' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (typeof email !== 'string' || !emailRe.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 30)) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (message !== undefined && message !== null && (typeof message !== 'string' || message.length > 2000)) {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email using Lovable AI gateway to format, then use SMTP-like approach
    // For now, we'll store the contact request and notify via email
    // Use Resend or similar - for now we'll use a simple fetch to email service
    // Store in database as contact_requests for admin to see
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store contact request
    const { error } = await supabase.from('contact_requests').insert({
      name: (name as string).trim(),
      email: (email as string).trim(),
      phone: typeof phone === 'string' ? phone.trim() : null,
      event_type: typeof eventType === 'string' ? eventType.slice(0, 100) : null,
      event_date: typeof date === 'string' ? date.slice(0, 100) : null,
      expected_guests: parseInt(String(guests ?? '0')) || 0,
      message: typeof message === 'string' ? message.trim() : null,
      status: 'new',
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Contact request saved' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[send-contact-email] error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
