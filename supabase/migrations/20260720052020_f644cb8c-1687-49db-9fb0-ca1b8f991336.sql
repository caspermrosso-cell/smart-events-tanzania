
CREATE POLICY "Public read whatsapp-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-media');

CREATE POLICY "Authenticated upload whatsapp-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'whatsapp-media');

CREATE POLICY "Users delete own whatsapp-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'whatsapp-media' AND owner = auth.uid());
