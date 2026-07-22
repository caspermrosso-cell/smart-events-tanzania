
-- 1) Remove overly permissive INSERT policy on contact_requests
DROP POLICY IF EXISTS "Service role can insert contact requests" ON public.contact_requests;

-- 2) Tighten testimonials public SELECT to only published rows (admins keep ALL access)
DROP POLICY IF EXISTS "Public can view published testimonials" ON public.testimonials;
CREATE POLICY "Public can view published testimonials"
ON public.testimonials FOR SELECT
TO anon, authenticated
USING (is_published = true AND deleted_at IS NULL);

-- 3) Restrict SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticator, service_role, postgres;

REVOKE EXECUTE ON FUNCTION public.next_invoice_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.next_receipt_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.next_quotation_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_receipt_number() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_quotation_number() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4) Storage: event-photos — remove broad listing SELECT; restrict UPDATE/DELETE to owner
DROP POLICY IF EXISTS "Public can view event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event photos" ON storage.objects;

CREATE POLICY "Owners can update event photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-photos' AND owner = auth.uid())
WITH CHECK (bucket_id = 'event-photos' AND owner = auth.uid());

CREATE POLICY "Owners can delete event photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-photos' AND owner = auth.uid());

-- 5) Storage: ecard-templates — remove broad SELECT listing policy (direct URLs still work on public buckets)
DROP POLICY IF EXISTS "Public can view ecard template images" ON storage.objects;

-- 6) Storage: whatsapp-media — remove public read, restrict to owner only; add ownership check on upload
DROP POLICY IF EXISTS "Public read whatsapp-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload whatsapp-media" ON storage.objects;

CREATE POLICY "Owners can read whatsapp-media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'whatsapp-media' AND owner = auth.uid());

CREATE POLICY "Owners can upload whatsapp-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-media'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = auth.uid()::text
);
