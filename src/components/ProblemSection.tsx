import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { AlertTriangle, EyeOff, UserX, BarChart3 } from 'lucide-react';

const ProblemSection = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const problems = [
    {
      icon: EyeOff,
      text: isEn ? 'Invitations are sent… but not seen.' : 'Mialiko inatumwa… lakini haisomwi.',
    },
    {
      icon: UserX,
      text: isEn ? 'Guests are confirmed… but don\'t show up.' : 'Wageni wanathibitishwa… lakini hawaji.',
    },
    {
      icon: AlertTriangle,
      text: isEn ? 'Event day arrives… but there\'s no visibility.' : 'Siku ya tukio inafika… lakini hakuna mwonekano.',
    },
  ];

  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn
              ? "Most Events Don't Fail in Planning — They Fail in Execution"
              : 'Matukio Mengi Hayashindwi Katika Mpango — Yanashindwa Katika Utekelezaji'}
          </h2>
        </motion.div>

        <div className="space-y-4 mb-10">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-4 glass-card rounded-xl p-5"
            >
              <p.icon className="w-6 h-6 text-destructive shrink-0" />
              <p className="text-foreground text-lg">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center glass-card rounded-2xl p-8"
        >
          <BarChart3 className="w-10 h-10 text-destructive mx-auto mb-4" />
          <p className="font-heading text-xl font-semibold text-foreground mb-2">
            {isEn ? 'The result?' : 'Matokeo?'}
          </p>
          <p className="text-muted-foreground text-lg">
            {isEn
              ? 'Low attendance. Poor coordination. Missed impact.'
              : 'Mahudhurio madogo. Uratibu mbaya. Athari iliyopotea.'}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
