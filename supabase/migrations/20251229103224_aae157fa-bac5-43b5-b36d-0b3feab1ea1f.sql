-- Add DELETE policies to memeping_alerts table for data management
-- Allow users to delete their own alerts
CREATE POLICY "Users can delete their own alerts"
  ON public.memeping_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow cleanup of demo alerts (user_id = NULL)
CREATE POLICY "Public can delete demo alerts"
  ON public.memeping_alerts
  FOR DELETE
  USING (user_id IS NULL);