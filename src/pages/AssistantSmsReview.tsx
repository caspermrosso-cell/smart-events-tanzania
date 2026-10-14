import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { ShieldCheck, Send, X, ArrowLeft } from 'lucide-react';
import { useWebMCP } from 'use-webmcp-tool';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { runWebMCPTool } from '@/lib/webmcp-telemetry';
import { requirePendingDraft } from '@/lib/assistant/validation';
export default function AssistantSmsReview() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const sw = language === 'sw';
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { data: draft, isLoading, error: loadError } = useQuery({
    queryKey: ['assistant-sms-draft', id, user?.id], enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('assistant_sms_drafts').select('*').eq('id', id ?? '').eq('user_id', user?.id ?? '').single();
      if (error) throw new Error(sw ? 'Rasimu haipatikani.' : 'Draft unavailable for this account.');
      return data;
    },
  });
  useWebMCP({
    name: 'review_sms_draft', description: 'Read the SMS draft currently displayed; sending requires the person to press Confirm & send.',
    annotations: { readOnlyHint: true, untrustedContentHint: true }, enabled: !!draft && !busy,
    execute: () => runWebMCPTool('review_sms_draft', () => draft ? `${draft.status}: ${draft.sms_units} units. Message: ${draft.message}. Await human confirmation using the visible button.` : 'Draft not loaded.'),
  });
  async function decide(action: 'confirm' | 'cancel') {
    if (!draft || busy) return;
    setBusy(true); setError('');
    try {
      requirePendingDraft(draft);
      const { data, error } = await supabase.functions.invoke('confirm-assistant-sms', { body: { draft_id: draft.id, action } });
      if (error) {
        let message = error.message;
        if (error instanceof FunctionsHttpError) { const details = await error.context.json().catch(() => null); message = details?.error ?? message; }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to confirm'); }
    finally { await client.invalidateQueries({ queryKey: ['assistant-sms-draft', id, user?.id] }); setBusy(false); }
  }
  if (loading) return <main className="p-8 text-muted-foreground">Loading…</main>;
  if (!user) {
    const next = window.location.pathname + window.location.search;
    return <main className="min-h-screen bg-background p-6 flex flex-col items-center justify-center gap-5"><ShieldCheck className="h-10 w-10 text-primary" /><h1 className="text-2xl">{sw ? 'Ingia kuhakiki SMS' : 'Sign in to review SMS'}</h1><Button asChild><Link to={`/login?next=${encodeURIComponent(next)}`}>{sw ? 'Ingia' : 'Sign in'}</Link></Button></main>;
  }
  const recipients = Array.isArray(draft?.recipients) ? draft.recipients as { name: string; phone: string }[] : [];
  const pending = draft?.status === 'pending' && Date.parse(draft.expires_at) > Date.now();
  return <main className="min-h-screen bg-background px-5 py-10">
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost"><Link to="/sms"><ArrowLeft />{sw ? 'Rudi SMS' : 'Back to SMS'}</Link></Button>
      <div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-primary" /><h1 className="text-3xl">{sw ? 'Hakiki na thibitisha SMS' : 'Review & confirm SMS'}</h1></div>
      {(isLoading || loadError) && <p role="status" className="text-muted-foreground">{loadError?.message ?? 'Loading…'}</p>}
      {draft && <>
        <div className="flex flex-wrap gap-5 border-y border-border py-4 text-sm"><span>{recipients.length} {sw ? 'wapokeaji' : 'recipients'}</span><span>{draft.sms_units} SMS units</span><span className="font-semibold text-primary">{draft.status}</span></div>
        <section><h2 className="mb-3 text-lg">{sw ? 'Ujumbe' : 'Message'}</h2><p className="whitespace-pre-wrap break-words border-l-4 border-primary bg-muted p-5 rounded-r-lg">{draft.message}</p></section>
        <section><h2 className="mb-3 text-lg">{sw ? 'Wapokeaji' : 'Recipients'}</h2><ul className="max-h-72 overflow-auto divide-y divide-border">{recipients.map(r => <li key={r.phone} className="flex flex-wrap justify-between gap-2 py-3"><span>{r.name}</span><span className="text-muted-foreground">{r.phone}</span></li>)}</ul></section>
        {!pending && <p className="text-muted-foreground">{draft.status === 'pending' ? (sw ? 'Rasimu imeisha muda.' : 'This draft has expired.') : (sw ? 'Rasimu hii tayari imeshughulikiwa.' : 'This draft has already been processed.')}</p>}
        {draft.result && <pre className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{JSON.stringify(draft.result, null, 2)}</pre>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3"><Button disabled={!pending || busy} onClick={() => decide('confirm')}><Send />{busy ? (sw ? 'Inashughulikiwa…' : 'Processing…') : (sw ? 'Thibitisha na tuma' : 'Confirm & send')}</Button><Button variant="outline" disabled={!pending || busy} onClick={() => decide('cancel')}><X />{sw ? 'Ghairi' : 'Cancel'}</Button></div>
      </>}
    </div>
  </main>;
}
