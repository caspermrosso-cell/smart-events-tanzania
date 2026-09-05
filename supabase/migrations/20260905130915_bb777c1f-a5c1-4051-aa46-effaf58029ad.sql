CREATE TABLE public.pricing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sms_rate NUMERIC NOT NULL DEFAULT 50,
  whatsapp_rate NUMERIC NOT NULL DEFAULT 1000,
  unlock_threshold NUMERIC NOT NULL DEFAULT 300000,
  max_units INTEGER NOT NULL DEFAULT 5000,
  discount_note_en TEXT,
  discount_note_sw TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pricing_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_settings TO authenticated;
GRANT ALL ON public.pricing_settings TO service_role;

ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing settings"
ON public.pricing_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert pricing settings"
ON public.pricing_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pricing settings"
ON public.pricing_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pricing settings"
ON public.pricing_settings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_pricing_settings_updated_at
BEFORE UPDATE ON public.pricing_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pricing_settings (sms_rate, whatsapp_rate, unlock_threshold, max_units)
VALUES (50, 1000, 300000, 5000);