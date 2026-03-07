import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Package {
  id: string;
  title: string;
  price: number;
  features: string[];
  is_popular: boolean;
  sort_order: number;
}

const Pricing = () => {
  const { t } = useLanguage();

  const { data: packages = [] } = useQuery({
    queryKey: ['packages-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data as any[]).map(p => ({ ...p, features: p.features as string[] })) as Package[];
    },
  });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (packages.length === 0) return null;

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">{t('pricing.title')}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('pricing.subtitle')}</p>
        </motion.div>

        <div className="grid gap-4 max-w-5xl mx-auto grid-cols-1 md:grid-cols-2">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                pkg.is_popular
                  ? 'bg-primary text-primary-foreground shadow-warm scale-105'
                  : 'glass-card'
              }`}
            >
              {pkg.is_popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-gold-foreground text-xs font-bold">
                  {t('pricing.popular')}
                </span>
              )}
              <h3 className="font-heading text-2xl font-bold mb-2">{pkg.title}</h3>
              <div className="mb-6">
                <span className="text-sm">{t('pricing.currency')} </span>
                <span className="text-4xl font-bold">{Number(pkg.price).toLocaleString()}</span>
              </div>
              <ul className="flex-1 space-y-3 mb-6">
                {pkg.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => scrollTo('contact')}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
                  pkg.is_popular
                    ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                    : 'bg-primary text-primary-foreground hover:bg-accent'
                }`}
              >
                {t('pricing.cta')}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
