import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Target, Eye, Settings } from 'lucide-react';

const SolutionSection = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const pillars = [
    { icon: Settings, label: isEn ? 'Structure' : 'Muundo' },
    { icon: Eye, label: isEn ? 'Visibility' : 'Mwonekano' },
    { icon: Target, label: isEn ? 'Control' : 'Udhibiti' },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            {isEn
              ? 'Bring Structure, Visibility, and Control to Your Events'
              : 'Leta Muundo, Mwonekano, na Udhibiti kwa Matukio Yako'}
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            {isEn
              ? 'Smart Events enables you to manage your entire event lifecycle from one platform — from invitations to attendance tracking and post-event insights.'
              : 'Smart Events inakuwezesha kusimamia mzunguko mzima wa tukio lako kutoka jukwaa moja — kutoka mialiko hadi ufuatiliaji wa mahudhurio na uchambuzi baada ya tukio.'}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 mb-10">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 glass-card rounded-full px-6 py-3"
            >
              <p.icon className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">{p.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-primary font-heading text-xl font-semibold italic"
        >
          {isEn
            ? 'Turn every event into a measurable, predictable outcome.'
            : 'Geuza kila tukio kuwa matokeo yanayopimika na kutabirika.'}
        </motion.p>
      </div>
    </section>
  );
};

export default SolutionSection;
