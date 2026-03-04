
-- Add subscription_amount to events for revenue tracking
ALTER TABLE public.events ADD COLUMN subscription_amount numeric DEFAULT 0;
ALTER TABLE public.events ADD COLUMN subscription_package text DEFAULT 'starter';
