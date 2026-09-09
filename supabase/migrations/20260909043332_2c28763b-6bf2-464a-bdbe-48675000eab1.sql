CREATE TABLE public.financial_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  company_name TEXT NOT NULL DEFAULT 'SMART EVENTS TANZANIA LIMITED',
  revenue NUMERIC NOT NULL DEFAULT 0,
  direct_cost NUMERIC NOT NULL DEFAULT 0,
  operating_expenses NUMERIC NOT NULL DEFAULT 0,
  tax_charge NUMERIC NOT NULL DEFAULT 0,
  property_equipment NUMERIC NOT NULL DEFAULT 0,
  depreciation NUMERIC NOT NULL DEFAULT 0,
  tax_receivables NUMERIC NOT NULL DEFAULT 0,
  cash_and_bank NUMERIC NOT NULL DEFAULT 0,
  share_capital NUMERIC NOT NULL DEFAULT 0,
  opening_accumulated_profit NUMERIC NOT NULL DEFAULT 0,
  shares_issued_during_year NUMERIC NOT NULL DEFAULT 0,
  trade_payables NUMERIC NOT NULL DEFAULT 0,
  change_in_payables NUMERIC NOT NULL DEFAULT 0,
  taxation_paid NUMERIC NOT NULL DEFAULT 0,
  purchase_of_assets NUMERIC NOT NULL DEFAULT 0,
  opening_cash NUMERIC NOT NULL DEFAULT 0,
  auto_revenue BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_statements TO authenticated;
GRANT ALL ON public.financial_statements TO service_role;

ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage financial statements"
ON public.financial_statements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_financial_statements_updated_at
BEFORE UPDATE ON public.financial_statements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();