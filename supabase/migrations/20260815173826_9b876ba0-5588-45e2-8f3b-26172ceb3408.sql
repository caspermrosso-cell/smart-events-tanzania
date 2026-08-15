-- Soft-delete duplicate guests (same event + same phone), keeping the oldest record
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id, phone ORDER BY created_at ASC, id ASC) AS rn
  FROM public.guests
  WHERE deleted_at IS NULL AND phone IS NOT NULL AND phone <> ''
)
UPDATE public.guests g
SET deleted_at = now()
FROM ranked r
WHERE g.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS guests_event_phone_unique
ON public.guests (event_id, phone)
WHERE deleted_at IS NULL AND phone IS NOT NULL AND phone <> '';