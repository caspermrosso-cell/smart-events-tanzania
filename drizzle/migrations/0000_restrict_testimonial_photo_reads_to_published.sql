DROP POLICY IF EXISTS "Public read testimonial photos" ON storage.objects;

CREATE POLICY "Read published testimonial photos or administer"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'testimonial-photos'
  AND (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.testimonials AS testimonial
      WHERE testimonial.photo_url = storage.objects.name
        AND testimonial.is_published = true
        AND testimonial.deleted_at IS NULL
    )
  )
);