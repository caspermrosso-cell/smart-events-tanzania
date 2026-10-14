CREATE TABLE public.assistant_sms_drafts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, event_id uuid NOT NULL REFERENCES public.events(id), message text NOT NULL CHECK (length(message) BETWEEN 1 AND 1000 AND message !~ '\{[a-zA-Z0-9_]+\}'), recipients jsonb NOT NULL CHECK (jsonb_typeof(recipients)='array' AND jsonb_array_length(recipients) BETWEEN 1 AND 50), sms_units integer NOT NULL CHECK (sms_units>0), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed','cancelled','unknown')), result jsonb, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '30 minutes'
);
GRANT SELECT, INSERT ON public.assistant_sms_drafts TO authenticated;
GRANT ALL ON public.assistant_sms_drafts TO service_role;
ALTER TABLE public.assistant_sms_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own assistant drafts" ON public.assistant_sms_drafts FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Create permitted assistant drafts" ON public.assistant_sms_drafts FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND status='pending' AND result IS NULL AND expires_at<=now()+interval '30 minutes' AND (public.has_role(auth.uid(),'admin') OR public.has_module_permission(auth.uid(),'sms')) AND EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND e.user_id=auth.uid() AND e.deleted_at IS NULL));
CREATE FUNCTION public.claim_assistant_sms_draft(draft_id uuid, cancel boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.assistant_sms_drafts; e public.events; used_units bigint; reserved_units bigint; expected_units integer;
BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'client_id','')<>'' THEN RAISE EXCEPTION 'Confirm in Smart Events using your own signed-in session'; END IF;
 SELECT * INTO d FROM public.assistant_sms_drafts WHERE id=draft_id AND user_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Draft not found'; END IF;
 SELECT * INTO e FROM public.events WHERE id=d.event_id AND user_id=auth.uid() AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND OR NOT (public.has_role(auth.uid(),'admin') OR public.has_module_permission(auth.uid(),'sms')) THEN RAISE EXCEPTION 'SMS access denied'; END IF;
 SELECT * INTO d FROM public.assistant_sms_drafts WHERE id=draft_id AND user_id=auth.uid() FOR UPDATE;
 IF d.status<>'pending' OR d.expires_at<=now() THEN RAISE EXCEPTION 'Draft is expired or already processed'; END IF;
 IF cancel THEN UPDATE public.assistant_sms_drafts SET status='cancelled' WHERE id=d.id; RETURN jsonb_build_object('status','cancelled'); END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(d.recipients) r WHERE coalesce(r->>'phone','') !~ '^\+255[67][0-9]{8}$') THEN RAISE EXCEPTION 'Invalid Tanzania phone'; END IF;
 expected_units := (CASE WHEN length(d.message)<=160 THEN 1 ELSE ceil(length(d.message)/153.0)::integer END)*jsonb_array_length(d.recipients);
 IF expected_units<>d.sms_units THEN RAISE EXCEPTION 'Draft units mismatch'; END IF;
 SELECT coalesce(sum(sms_count),0) INTO used_units FROM public.sms_logs WHERE event_id=d.event_id AND status IN ('sent','delivered','scheduled','pending');
 SELECT coalesce(sum(sms_units),0) INTO reserved_units FROM public.assistant_sms_drafts WHERE event_id=d.event_id AND status IN ('sending','unknown');
 IF expected_units+used_units+reserved_units>e.sms_allocation THEN RAISE EXCEPTION 'Event SMS allocation is insufficient'; END IF;
 UPDATE public.assistant_sms_drafts SET status='sending' WHERE id=d.id;
 RETURN to_jsonb(d);
END $$;
REVOKE ALL ON FUNCTION public.claim_assistant_sms_draft(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_assistant_sms_draft(uuid,boolean) TO authenticated;
CREATE FUNCTION public.finish_assistant_sms_draft(draft_id uuid, outcome text, details jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'client_id','')<>'' OR outcome NOT IN ('sent','failed','unknown') THEN RAISE EXCEPTION 'Not permitted'; END IF;
 UPDATE public.assistant_sms_drafts SET status=outcome,result=details WHERE id=draft_id AND user_id=auth.uid() AND status='sending';
END $$;
REVOKE ALL ON FUNCTION public.finish_assistant_sms_draft(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finish_assistant_sms_draft(uuid,text,jsonb) TO authenticated;