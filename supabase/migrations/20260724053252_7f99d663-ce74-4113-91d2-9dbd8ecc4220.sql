
-- 1. Enum ya modules
CREATE TYPE public.app_module AS ENUM (
  'dashboard','events','guests','pledges','sms','whatsapp','ecards',
  'checkin','payments','quotations','packages','testimonials','reports','recycle_bin','users'
);

-- 2. Table
CREATE TABLE public.user_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module public.app_module NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

GRANT SELECT ON public.user_module_permissions TO authenticated;
GRANT ALL ON public.user_module_permissions TO service_role;

ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their permissions or admin views all"
ON public.user_module_permissions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. Permission checker
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module public.app_module)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR EXISTS (
        SELECT 1 FROM public.user_module_permissions
        WHERE user_id = _user_id AND module = _module
      )
$$;

GRANT EXECUTE ON FUNCTION public.has_module_permission(uuid, public.app_module) TO authenticated;

-- 4. Track who checked-in a guest
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES auth.users(id);

-- 5. Allow admin + check-in staff to view/update guests across events
CREATE POLICY "Admins and check-in staff view all guests"
ON public.guests
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_module_permission(auth.uid(), 'checkin')
);

CREATE POLICY "Check-in staff can mark check-ins"
ON public.guests
FOR UPDATE TO authenticated
USING (public.has_module_permission(auth.uid(), 'checkin'))
WITH CHECK (public.has_module_permission(auth.uid(), 'checkin'));

-- 6. Admins can see events for scoping
CREATE POLICY "Admins and check-in staff view all events"
ON public.events
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_module_permission(auth.uid(), 'checkin')
);

-- 7. Admins should be able to view all user_roles rows
CREATE POLICY "Admins view all roles"
ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
