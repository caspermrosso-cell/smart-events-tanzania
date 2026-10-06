DROP POLICY IF EXISTS "Read published testimonial photos or administer" ON storage.objects;

CREATE POLICY "Public can read published testimonial photos"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'testimonial-photos'
  AND EXISTS (
    SELECT 1
    FROM public.testimonials testimonial
    WHERE testimonial.photo_url = storage.objects.name
      AND testimonial.is_published = true
      AND testimonial.deleted_at IS NULL
  )
);

CREATE POLICY "Owners and admins can read testimonial photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'testimonial-photos'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
);