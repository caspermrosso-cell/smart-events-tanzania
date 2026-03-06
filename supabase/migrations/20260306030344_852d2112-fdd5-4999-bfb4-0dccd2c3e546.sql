
-- Add photo_url column to events for ecard photos
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for event photos
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to event-photos bucket
CREATE POLICY "Authenticated users can upload event photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-photos');

-- Allow public read access
CREATE POLICY "Public can view event photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-photos');

-- Allow users to update their own photos
CREATE POLICY "Authenticated users can update event photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'event-photos');

-- Allow users to delete their own photos
CREATE POLICY "Authenticated users can delete event photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-photos');
