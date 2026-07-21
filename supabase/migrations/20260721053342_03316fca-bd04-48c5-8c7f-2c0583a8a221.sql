-- Soft delete columns
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_testimonials_deleted_at ON public.testimonials(deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON public.events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_guests_deleted_at ON public.guests(deleted_at);