ALTER TABLE public.pricing_settings
  ADD COLUMN IF NOT EXISTS sms_buy_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_buy_rate numeric NOT NULL DEFAULT 0;

REVOKE SELECT ON public.pricing_settings FROM anon;
GRANT SELECT (id, sms_rate, whatsapp_rate, unlock_threshold, max_units, discount_note_en, discount_note_sw, created_at, updated_at)
  ON public.pricing_settings TO anon;