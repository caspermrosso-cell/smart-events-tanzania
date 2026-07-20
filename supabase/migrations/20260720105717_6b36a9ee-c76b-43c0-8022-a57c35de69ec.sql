
ALTER TABLE public.guests 
  ADD COLUMN IF NOT EXISTS card_number TEXT,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS guests_event_card_number_unique 
  ON public.guests(event_id, card_number) 
  WHERE card_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS guests_card_number_idx ON public.guests(card_number);
