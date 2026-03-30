import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const Differentiation = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const others = [
    isEn ? 'Send invites' : 'Tuma mialiko',
    isEn ? 'Track RSVPs' : 'Fuatilia RSVPs',
    isEn ? 'Basic tools' : 'Zana za msingi',
  ];

  const smart = [
    isEn ? 'Controls full communication lifecycle' : 'Inadhibiti mzunguko mzima wa mawasiliano',
    isEn ? 'Tracks real attendance (not just RSVPs)' : 'Inafuatilia mahudhurio halisi (si RSVPs tu)',
    isEn ? 'Provides actionable performance insights' : 'Inatoa uchambuzi wa utendaji unaoweza kutumika',
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'Why Smart Events Stands Out' : 'Kwa Nini Smart Events Inajitokeza'}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-heading text-lg font-semibold text-muted-foreground mb-4">
              {isEn ? 'Others' : 'Wengine'}
            </h3>
            <div className="space-y-3">
              {others.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <X className="w-5 h-5 text-destructive shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6 border-2 border-primary/20"
          >
            <h3 className="font-heading text-lg font-semibold text-primary mb-4">Smart Events</h3>
            <div className="space-y-3">
              {smart.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-primary font-heading text-xl font-semibold italic"
        >
          {isEn
            ? "This is not an event tool — it's an event performance platform."
            : 'Hii si zana ya matukio — ni jukwaa la utendaji wa matukio.'}
        </motion.p>
      </div>
    </section>
  );
};

export default Differentiation;
