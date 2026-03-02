
-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  venue text,
  event_type text NOT NULL DEFAULT 'wedding',
  status text NOT NULL DEFAULT 'draft',
  max_guests integer,
  budget numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own events
CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);

-- Admins can see all events
CREATE POLICY "Admins can view all events" ON public.events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guests table
CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  rsvp_status text NOT NULL DEFAULT 'pending',
  table_number text,
  checked_in boolean NOT NULL DEFAULT false,
  checked_in_at timestamp with time zone,
  barcode text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own guests" ON public.guests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own guests" ON public.guests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own guests" ON public.guests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own guests" ON public.guests FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pledges table
CREATE TABLE public.pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text,
  status text NOT NULL DEFAULT 'pledged',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pledges" ON public.pledges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pledges" ON public.pledges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pledges" ON public.pledges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pledges" ON public.pledges FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pledges_updated_at
  BEFORE UPDATE ON public.pledges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
