import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { UserX, EyeOff, HelpCircle, BarChart3 } from 'lucide-react';

const ProblemSection = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const problems = [
    { icon: UserX, text: isEn ? "Guests don't show up" : 'Wageni hawaji' },
    { icon: EyeOff, text: isEn ? 'Communication gets ignored' : 'Mawasiliano yanapuuzwa' },
    { icon: HelpCircle, text: isEn ? "You don't know who actually attended" : 'Hujui ni nani alihudhuria' },
    { icon: BarChart3, text: isEn ? "There's no data to measure success" : 'Hakuna data ya kupima mafanikio' },
  ];

  return (
    <section className="py-24 bg-secondary/60">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="eyebrow mb-5">{isEn ? 'The honest part' : 'Ukweli wa mambo'}</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'You did everything right. The hall still had gaps.' : 'Ulifanya kila kitu sawa. Ukumbi bado ulikuwa na nafasi.'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {isEn
              ? "You've planned everything perfectly… but:"
              : 'Umepanga kila kitu vizuri… lakini:'}
          </p>
        </motion.div>

        <div className="space-y-4 mb-10">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-center gap-4 soft-card rounded-2xl p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary">
                <p.icon className="w-5 h-5 text-primary" />
              </span>
              <p className="text-foreground text-lg">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center soft-card rounded-[1.75rem] p-8"
        >
          <p className="text-primary font-heading text-xl font-semibold">
            {isEn
              ? "The problem isn't planning — it's execution and visibility."
              : 'Tatizo si mpango — ni utekelezaji na mwonekano.'}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
