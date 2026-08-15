import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const Benefits = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const benefits = [
    isEn ? 'Higher attendance rates' : 'Viwango vya juu vya mahudhurio',
    isEn ? 'Zero confusion on event day' : 'Hakuna mkanganyiko siku ya tukio',
    isEn ? 'Real-time visibility of guests' : 'Mwonekano wa wageni kwa wakati halisi',
    isEn ? 'Structured communication flow' : 'Mtiririko wa mawasiliano uliopangwa',
    isEn ? 'Measurable event performance' : 'Utendaji wa tukio unaopimika',
  ];

  return (
    <section className="py-24 bg-warm-cream/40">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'What You Achieve with Smart Events' : 'Unachofanikisha na Smart Events'}
          </h2>
        </motion.div>

        <div className="space-y-4 mb-10">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 soft-card rounded-xl p-5"
            >
              <CheckCircle className="w-6 h-6 text-primary shrink-0" />
              <span className="text-foreground text-lg font-medium">{b}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-primary font-heading text-xl font-semibold"
        >
          {isEn
            ? 'No more assumptions. Only data-driven execution.'
            : 'Hakuna mawazo tena. Utekelezaji wa data tu.'}
        </motion.p>
      </div>
    </section>
  );
};

export default Benefits;
