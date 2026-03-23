CREATE TABLE public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  recipient_name text,
  recipient_phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone DEFAULT now(),
  beem_response jsonb,
  sms_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sms logs" ON public.sms_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sms logs" ON public.sms_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
