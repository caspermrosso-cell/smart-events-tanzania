
-- Quotations table
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text NOT NULL UNIQUE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  contact_person text,
  client_address text,
  client_email text,
  client_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  vat_enabled boolean NOT NULL DEFAULT true,
  vat_amount numeric NOT NULL DEFAULT 0,
  discount_type text DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  validity_days integer NOT NULL DEFAULT 14,
  status text NOT NULL DEFAULT 'draft',
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  contact_person text,
  client_address text,
  client_email text,
  client_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  vat_enabled boolean NOT NULL DEFAULT true,
  vat_amount numeric NOT NULL DEFAULT 0,
  discount_type text DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  payment_method text,
  payment_due_days integer NOT NULL DEFAULT 7,
  status text NOT NULL DEFAULT 'unpaid',
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Receipts table
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  amount_in_words text,
  payment_method text NOT NULL DEFAULT 'cash',
  remarks text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-number functions
CREATE OR REPLACE FUNCTION public.next_quotation_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_year text;
  last_num integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quotation_number FROM 'SE-QUO-' || current_year || '-(\d+)') AS integer)
  ), 0) INTO last_num FROM public.quotations WHERE quotation_number LIKE 'SE-QUO-' || current_year || '-%';
  RETURN 'SE-QUO-' || current_year || '-' || LPAD((last_num + 1)::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_year text;
  last_num integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'SE-INV-' || current_year || '-(\d+)') AS integer)
  ), 0) INTO last_num FROM public.invoices WHERE invoice_number LIKE 'SE-INV-' || current_year || '-%';
  RETURN 'SE-INV-' || current_year || '-' || LPAD((last_num + 1)::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.next_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_year text;
  last_num integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM 'SE-RCPT-' || current_year || '-(\d+)') AS integer)
  ), 0) INTO last_num FROM public.receipts WHERE receipt_number LIKE 'SE-RCPT-' || current_year || '-%';
  RETURN 'SE-RCPT-' || current_year || '-' || LPAD((last_num + 1)::text, 4, '0');
END;
$$;

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own quotations" ON public.quotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quotations" ON public.quotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotations" ON public.quotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotations" ON public.quotations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own receipts" ON public.receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own receipts" ON public.receipts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own receipts" ON public.receipts FOR DELETE USING (auth.uid() = user_id);

-- Updated at triggers
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
