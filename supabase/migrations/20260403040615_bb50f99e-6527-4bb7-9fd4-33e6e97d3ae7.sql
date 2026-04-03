
CREATE TABLE public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  message_type TEXT NOT NULL DEFAULT 'text',
  message_content TEXT,
  media_url TEXT,
  template_id INTEGER,
  template_name TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  beem_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp logs"
  ON public.whatsapp_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own whatsapp logs"
  ON public.whatsapp_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own whatsapp logs"
  ON public.whatsapp_logs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_whatsapp_logs_updated_at
  BEFORE UPDATE ON public.whatsapp_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
