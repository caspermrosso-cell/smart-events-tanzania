import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    titleKey: 'pricing.basic.title',
    priceKey: 'pricing.basic.price',
    features: ['pricing.basic.f1', 'pricing.basic.f2', 'pricing.basic.f3', 'pricing.basic.f4'],
    popular: false,
  },
  {
    titleKey: 'pricing.standard.title',
    priceKey: 'pricing.standard.price',
    features: ['pricing.standard.f1', 'pricing.standard.f2', 'pricing.standard.f3', 'pricing.standard.f4', 'pricing.standard.f5'],
    popular: true,
  },
  {
    titleKey: 'pricing.premium.title',
    priceKey: 'pricing.premium.price',
    features: ['pricing.premium.f1', 'pricing.premium.f2', 'pricing.premium.f3', 'pricing.premium.f4', 'pricing.premium.f5', 'pricing.premium.f6'],
    popular: false,
  },
];

const Pricing = () => {
  const { t } = useLanguage();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

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

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? 'bg-primary text-primary-foreground shadow-warm scale-105'
                  : 'glass-card'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-gold-foreground text-xs font-bold">
                  {t('pricing.popular')}
                </span>
              )}
              <h3 className="font-heading text-2xl font-bold mb-2">{t(plan.titleKey as any)}</h3>
              <div className="mb-6">
                <span className="text-sm">{t('pricing.currency')} </span>
                <span className="text-4xl font-bold">{t(plan.priceKey as any)}</span>
              </div>
              <ul className="flex-1 space-y-3 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    {t(f as any)}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => scrollTo('contact')}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
                  plan.popular
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
