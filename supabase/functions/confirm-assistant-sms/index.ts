import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';
const schema = z.object({ draft_id: z.string().uuid(), action: z.enum(['confirm', 'cancel']) }).strict();
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  let claimed: string | undefined;
  let db: ReturnType<typeof createClient> | undefined;
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Sign in required' }, 401);
    db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.auth.getClaims(authorization.slice(7));
    if (error || !data?.claims?.sub) return respond({ error: 'Sign in required' }, 401);
    if (data.claims.client_id) return respond({ error: 'Open Smart Events and confirm using your own account; connected assistants cannot approve SMS' }, 403);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return respond({ error: 'Invalid confirmation request' }, 400);
    const { draft_id, action } = parsed.data;
    const { data: draft, error: claimError } = await db.rpc('claim_assistant_sms_draft', { draft_id, cancel: action === 'cancel' });
    if (claimError || !draft) return respond({ error: claimError?.message ?? 'Draft unavailable' }, 409);
    if (action === 'cancel') return respond({ status: 'cancelled' });
    claimed = draft_id;
    // Only the immutable saved draft is sent, never message/recipients from this request.
    const { data: sent, error: sendError } = await db.functions.invoke('send-sms', { body: { message: draft.message, recipients: draft.recipients, eventId: draft.event_id, logSms: true } });
    if (sendError) {
      await db.rpc('finish_assistant_sms_draft', { draft_id, outcome: 'unknown', details: { error: 'Send result could not be confirmed. Check delivery logs before any new send.' } });
      return respond({ error: 'Send result is uncertain. Check delivery logs; do not send again.', status: 'unknown' }, 502);
    }
    const results = Array.isArray(sent?.results) ? sent.results : [];
    const accepted = results.filter((r: { status: string }) => r.status === 'sent').length;
    const status = accepted > 0 ? 'sent' : 'failed';
    const summary = { accepted, failed: results.length - accepted, recipients: draft.recipients.length };
    const { error: finishError } = await db.rpc('finish_assistant_sms_draft', { draft_id, outcome: status, details: summary });
    if (finishError) return respond({ error: 'Send was processed, but status could not be saved. Check delivery logs; do not resend.' }, 502);
    return respond({ status, ...summary });
  } catch {
    if (db && claimed) await db.rpc('finish_assistant_sms_draft', { draft_id: claimed, outcome: 'unknown', details: { error: 'Send result uncertain; check delivery logs.' } });
    return respond({ error: claimed ? 'Send result uncertain; check delivery logs before sending again.' : 'Unable to process confirmation' }, 500);
  }
});
