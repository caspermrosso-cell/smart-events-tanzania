import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Eye, Quote } from 'lucide-react';

const SocialProof = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const metrics = [
    { icon: TrendingUp, value: '30–60%', label: isEn ? 'Improvement in attendance' : 'Ongezeko la mahudhurio' },
    { icon: TrendingDown, value: '↓', label: isEn ? 'Significant reduction in no-shows' : 'Kupungua kwa kutokuhudhuria' },
    { icon: Eye, value: '100%', label: isEn ? 'Visibility on guest participation' : 'Mwonekano wa ushiriki wa wageni' },
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
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-10">
            {isEn ? 'Proven Results' : 'Matokeo Yaliyothibitishwa'}
          </h2>

          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {metrics.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <m.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-heading text-2xl font-bold text-foreground mb-1">{m.value}</p>
                <p className="text-muted-foreground text-sm">{m.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-8 md:p-12">
            <Quote className="w-10 h-10 text-primary/40 mx-auto mb-6" />
            <blockquote className="text-lg md:text-xl text-foreground leading-relaxed italic mb-6">
              {isEn
                ? '"Smart Events gave us full control over our event communication and attendance. The difference was immediate."'
                : '"Smart Events ilitupa udhibiti kamili wa mawasiliano na mahudhurio ya matukio yetu. Tofauti ilikuwa ya papo hapo."'}
            </blockquote>
            <p className="text-muted-foreground text-sm font-medium">
              — {isEn ? 'Event Manager, Corporate Client' : 'Meneja wa Matukio, Mteja wa Biashara'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
