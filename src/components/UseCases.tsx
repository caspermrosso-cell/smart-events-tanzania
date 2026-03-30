import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Building2, Landmark, Mic2, Rocket, Crown } from 'lucide-react';

const UseCases = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const cases = [
    { icon: Building2, label: isEn ? 'Corporate Events' : 'Matukio ya Biashara' },
    { icon: Mic2, label: isEn ? 'Conferences & Seminars' : 'Mikutano na Semina' },
    { icon: Rocket, label: isEn ? 'Product Launches' : 'Uzinduzi wa Bidhaa' },
    { icon: Landmark, label: isEn ? 'Government & Institutional Events' : 'Matukio ya Serikali na Taasisi' },
    { icon: Crown, label: isEn ? 'Private & VIP Events' : 'Matukio Binafsi na VIP' },
  ];

  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'Built for Every Type of Event' : 'Imejengwa kwa Kila Aina ya Tukio'}
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto mb-10">
          {cases.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-xl px-6 py-4 flex items-center gap-3"
            >
              <c.icon className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground text-sm">{c.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-muted-foreground text-lg"
        >
          {isEn
            ? 'From 50 guests to 5,000 — Smart Events scales with your needs.'
            : 'Kutoka wageni 50 hadi 5,000 — Smart Events inakua kulingana na mahitaji yako.'}
        </motion.p>
      </div>
    </section>
  );
};

export default UseCases;
