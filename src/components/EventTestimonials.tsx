import { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Quote, ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';

const EVENT_TYPE_LABELS: Record<string, Record<string, string>> = {
  en: {
    wedding: 'Wedding',
    birthday: 'Birthday',
    corporate: 'Corporate',
    fundraiser: 'Fundraiser',
    memorial: 'Memorial',
    other: 'Other',
  },
  sw: {
    wedding: 'Harusi',
    birthday: 'Birthday',
    corporate: 'Corporate',
    fundraiser: 'Fundraiser',
    memorial: 'Memorial',
    other: 'Nyingine',
  },
};

const EventTestimonials = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['event-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_testimonials')
        .select('*')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data || [];
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
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'Events That Made an Impact' : 'Matukio Yaliyofanya Tofauti'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isEn
              ? 'Real events managed with Smart Events — from intimate gatherings to grand celebrations.'
              : 'Matukio halisi yaliosimamiwa na Smart Events — kutoka makusanyiko madogo hadi sherehe kubwa.'}
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
              testimonials.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card rounded-2xl overflow-hidden flex-shrink-0 snap-start basis-full sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] flex flex-col"
                >
                  {event.photo_url ? (
                    <div className="relative h-56 bg-muted overflow-hidden">
                      <img
                        src={event.photo_url}
                        alt={event.title || ''}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <Quote className="absolute top-4 right-4 w-8 h-8 text-white/70" />
                    </div>
                  ) : (
                    <div className="h-40 bg-secondary/40 flex items-center justify-center">
                      <Quote className="w-10 h-10 text-primary/30" />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <span className="inline-flex self-start text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium mb-3">
                      {EVENT_TYPE_LABELS[language]?.[event.event_type || 'other'] || event.event_type}
                    </span>

                    <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                      {event.title}
                    </h3>

                    <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                      {event.event_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {format(new Date(event.event_date), 'dd MMM yyyy')}
                          </span>
                        </div>
                      )}
                      {event.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-foreground/80 text-sm leading-relaxed line-clamp-4 flex-1">
                        “{event.description}”
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventTestimonials;
