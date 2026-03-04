
-- Create contact_requests table for storing form submissions
CREATE TABLE public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  event_type text,
  event_date text,
  expected_guests integer DEFAULT 0,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Allow edge function (service role) to insert, admin to read
CREATE POLICY "Service role can insert contact requests"
ON public.contact_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view contact requests"
ON public.contact_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
