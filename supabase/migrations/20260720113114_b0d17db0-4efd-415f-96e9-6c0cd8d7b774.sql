
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_role TEXT,
  event_type TEXT,
  photo_url TEXT,
  quote TEXT NOT NULL,
  recommendation TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published testimonials"
  ON public.testimonials FOR SELECT
  USING (is_published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Public read testimonial photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonial-photos');

CREATE POLICY "Admins upload testimonial photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'testimonial-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update testimonial photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'testimonial-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete testimonial photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonial-photos' AND public.has_role(auth.uid(), 'admin'));

INSERT INTO public.testimonials (client_name, client_role, event_type, quote, recommendation, rating, display_order)
VALUES
  ('Bi. Joanitha Emmanuel', 'Bibi Harusi', 'wedding',
   'Smart Events walisimamia harusi yetu kwa umahiri mkubwa — kutoka mialiko hadi check-in ya wageni. Kila kitu kilikuwa smooth!',
   'Ninapendekeza Smart Events kwa mtu yeyote anayeandaa tukio kubwa. Wataalamu wa kweli.',
   5, 1),
  ('Dr. Godfrey Ngawaya', 'Mwenyeji wa Tukio', 'wedding',
   'Timu ya kitaalamu, mawasiliano mazuri, na mfumo rahisi kufuatilia michango na wageni. Ahsanteni sana!',
   'Chagueni Smart Events — hamtajutia. Kazi safi na uaminifu wa hali ya juu.',
   5, 2),
  ('Mr. George Makungu', 'Muandalizi', 'corporate',
   'Mfumo wao wa e-cards na SMS ni wa kipekee. Wageni wote walipokea taarifa kwa wakati.',
   'Recommend 100% — teknolojia ya kisasa kwa matukio ya kisasa.',
   5, 3);
