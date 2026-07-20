import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type SupabaseOAuthLike = {
  auth: {
    oauth: {
      getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
      approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
      denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
    };
  };
};

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Missing authorization_id");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const oauth = (supabase as unknown as SupabaseOAuthLike).auth.oauth;
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const oauth = (supabase as unknown as SupabaseOAuthLike).auth.oauth;
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-warm-cream/40">
        <div className="max-w-md w-full glass-card rounded-2xl p-6">
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Authorization error</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-warm-cream/40">
        <p className="text-sm text-muted-foreground">Loading authorization…</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? "an external app";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-warm-cream/40">
      <div className="max-w-md w-full glass-card rounded-2xl p-6 space-y-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Connect {clientName} to Smart Events?
        </h1>
        <p className="text-sm text-muted-foreground">
          This will let <strong>{clientName}</strong> access your Smart Events account and use the app's
          tools on your behalf. Only your own data (events, guests, pledges, invoices) will be visible.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-accent transition-colors disabled:opacity-50"
          >
            {busy ? "…" : "Approve"}
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 py-3 rounded-lg border-2 border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
};

export default OAuthConsent;