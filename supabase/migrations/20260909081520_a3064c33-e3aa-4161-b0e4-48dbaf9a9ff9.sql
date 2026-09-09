CREATE POLICY "Users read own purchase receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'purchase-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own purchase receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'purchase-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own purchase receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'purchase-receipts' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'purchase-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own purchase receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'purchase-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);