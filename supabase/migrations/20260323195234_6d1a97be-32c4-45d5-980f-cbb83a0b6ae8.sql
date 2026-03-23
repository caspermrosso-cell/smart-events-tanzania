
CREATE POLICY "Users can delete own sms logs"
ON public.sms_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
