CREATE TABLE public.supplier_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier text NOT NULL DEFAULT 'Beem Africa',
  receipt_number text,
  purchase_date date NOT NULL DEFAULT current_date,
  channel text NOT NULL DEFAULT 'sms',
  units integer NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  amount_excl_vat numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method text,
  notes text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_purchases TO authenticated;
GRANT ALL ON public.supplier_purchases TO service_role;

ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON public.supplier_purchases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own purchases" ON public.supplier_purchases
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own purchases" ON public.supplier_purchases
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own purchases" ON public.supplier_purchases
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_supplier_purchases_date ON public.supplier_purchases (purchase_date);

CREATE TRIGGER update_supplier_purchases_updated_at
  BEFORE UPDATE ON public.supplier_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();