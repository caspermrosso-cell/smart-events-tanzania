
-- 1) Local cache of imported Beem templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beem_id text NOT NULL,
  name text NOT NULL,
  category text,
  language text,
  status text,
  header text,
  content text,
  footer text,
  media_url text,
  type text,
  raw jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, beem_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wa templates" ON public.whatsapp_templates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own wa templates" ON public.whatsapp_templates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own wa templates" ON public.whatsapp_templates FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own wa templates" ON public.whatsapp_templates FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Extra tracking columns on whatsapp_logs for delivery reports & responses
ALTER TABLE public.whatsapp_logs
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_text text,
  ADD COLUMN IF NOT EXISTS response_at timestamptz,
  ADD COLUMN IF NOT EXISTS campaign_name text,
  ADD COLUMN IF NOT EXISTS error_message text;

CREATE INDEX IF NOT EXISTS whatsapp_logs_campaign_idx ON public.whatsapp_logs (user_id, template_name, created_at DESC);
