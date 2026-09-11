ALTER TABLE public.financial_statements
  ADD COLUMN IF NOT EXISTS year_end_month smallint NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS year_end_day smallint NOT NULL DEFAULT 31;