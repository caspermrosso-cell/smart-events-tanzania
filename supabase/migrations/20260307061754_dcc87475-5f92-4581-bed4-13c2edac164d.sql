
-- Create packages table
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Public can read active packages (for website pricing)
CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can insert packages"
  ON public.packages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update packages"
  ON public.packages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete packages"
  ON public.packages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed with current pricing data
INSERT INTO public.packages (title, price, features, is_popular, sort_order) VALUES
  ('Starter', 150000, '["Matukio 2", "Wageni 100", "SMS 50", "E-Cards"]'::jsonb, false, 1),
  ('Standard', 300000, '["Matukio 5", "Wageni 500", "SMS 200", "E-Cards", "Check-In & QR"]'::jsonb, true, 2),
  ('Premium', 500000, '["Matukio Unlimited", "Wageni Unlimited", "SMS 1000", "E-Cards", "Check-In & QR", "Ripoti Kamili"]'::jsonb, false, 3);
