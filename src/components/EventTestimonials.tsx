import { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight, Star, ThumbsUp, User } from 'lucide-react';
import { resolvePhotoUrls } from '@/lib/testimonialPhoto';

type Testimonial = {
  id: string;
  client_name: string;
  client_role: string | null;
  event_type: string | null;
  photo_url: string | null;
  quote: string;
  recommendation: string | null;
  rating: number;
  display_order: number;
  resolved_photo_url?: string | null;
};

const EVENT_TYPE_LABELS: Record<string, Record<string, string>> = {
  en: { wedding: 'Wedding', birthday: 'Birthday', corporate: 'Corporate', fundraiser: 'Fundraiser', memorial: 'Memorial', other: 'Other' },
  sw: { wedding: 'Harusi', birthday: 'Birthday', corporate: 'Corporate', fundraiser: 'Fundraiser', memorial: 'Memorial', other: 'Nyingine' },
};

const EventTestimonials = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['client-testimonials'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('testimonials')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      const list = (data || []) as Testimonial[];
      return await resolvePhotoUrls(list);
    },
  });

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!isLoading && testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-24 bg-warm-cream/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
            <ThumbsUp className="w-3.5 h-3.5" />
            {isEn ? 'Client Testimonials' : 'Shukrani za Wateja'}
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'What Our Clients Say' : 'Wanachosema Wateja Wetu'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isEn
              ? 'Real thanks and recommendations from clients whose events we managed.'
              : 'Shukrani na mapendekezo halisi kutoka kwa wateja ambao tumesimamia matukio yao.'}
          </p>
        </motion.div>

        <div className="relative">
          <button
            onClick={() => scrollBy('left')}
            aria-label="Scroll left"
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-background border border-border shadow-warm hover:bg-muted transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => scrollBy('right')}
            aria-label="Scroll right"
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-background border border-border shadow-warm hover:bg-muted transition-all"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-hide"
          >
            {isLoading ? (
              <div className="flex-shrink-0 w-full flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              testimonials.map((t, i) => (
                <motion.article
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card rounded-2xl overflow-hidden flex-shrink-0 snap-start basis-full sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] flex flex-col shadow-warm hover:shadow-lg transition-shadow"
                >
                  {t.resolved_photo_url ? (
                    <div className="relative h-64 bg-muted overflow-hidden">
                      <img
                        src={t.resolved_photo_url}
                        alt={t.client_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <Quote className="absolute top-4 right-4 w-8 h-8 text-white/80" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="font-heading text-lg font-semibold leading-tight">{t.client_name}</p>
                        {t.client_role && (
                          <p className="text-white/85 text-sm">{t.client_role}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/40 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-background/80 flex items-center justify-center">
                        <User className="w-10 h-10 text-primary" />
                      </div>
                      <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/40" />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {!t.resolved_photo_url && (
                      <div className="mb-3">
                        <p className="font-heading text-lg font-semibold text-foreground">{t.client_name}</p>
                        {t.client_role && (
                          <p className="text-muted-foreground text-sm">{t.client_role}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-4 h-4 ${idx < t.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      {t.event_type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {EVENT_TYPE_LABELS[language]?.[t.event_type] || t.event_type}
                        </span>
                      )}
                    </div>

                    <p className="text-foreground/85 text-sm leading-relaxed italic mb-4">
                      "{t.quote}"
                    </p>

                    {t.recommendation && (
                      <div className="mt-auto pt-4 border-t border-border/60 flex gap-2 text-sm">
                        <ThumbsUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-foreground/90 font-medium">{t.recommendation}</p>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventTestimonials;
