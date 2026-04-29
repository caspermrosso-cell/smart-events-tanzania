
-- Table for custom e-card templates
CREATE TABLE public.ecard_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  text_color TEXT NOT NULL DEFAULT 'light',
  overlay_style TEXT NOT NULL DEFAULT 'gradient-bottom',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ecard_templates ENABLE ROW LEVEL SECURITY;

-- View: own templates OR global ones
CREATE POLICY "Users view own or global ecard templates"
ON public.ecard_templates
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_global = true);

-- Insert own templates; only admins may create global ones
CREATE POLICY "Users create own ecard templates"
ON public.ecard_templates
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (is_global = false OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Users update own ecard templates"
ON public.ecard_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own ecard templates"
ON public.ecard_templates
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ecard_templates_updated_at
BEFORE UPDATE ON public.ecard_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for template backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('ecard-templates', 'ecard-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public can view ecard template images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ecard-templates');

-- Authenticated users can upload into their own folder (first path segment = user_id)
CREATE POLICY "Users upload own ecard template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ecard-templates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own ecard template images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ecard-templates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own ecard template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ecard-templates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
