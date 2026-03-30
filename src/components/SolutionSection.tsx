import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

const SolutionSection = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            {isEn ? 'A Smarter Way to Run Events' : 'Njia Bora ya Kuendesha Matukio'}
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            {isEn
              ? 'Smart Events gives you full control over your event lifecycle — from invitation to attendance to performance insights.'
              : 'Smart Events inakupa udhibiti kamili wa mzunguko wa tukio lako — kutoka mialiko hadi mahudhurio hadi uchambuzi wa utendaji.'}
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-heading text-xl font-semibold italic"
          >
            {isEn
              ? 'Run events like a business process — structured, trackable, and measurable.'
              : 'Endesha matukio kama mchakato wa biashara — yaliyopangwa, yanayofuatiliwa, na yanayopimika.'}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;
