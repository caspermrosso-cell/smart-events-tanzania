import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const CtaSection = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4">
            {isEn ? 'Stop Guessing. Start Running Better Events.' : 'Acha Kubahatisha. Anza Kuendesha Matukio Bora.'}
          </h2>
          <p className="text-white/75 text-lg mb-10">
            {isEn
              ? 'If attendance, coordination, and visibility matter — Smart Events is built for you.'
              : 'Kama mahudhurio, uratibu, na mwonekano ni muhimu — Smart Events imejengwa kwa ajili yako.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo('contact')}
              className="px-8 py-4 rounded-lg bg-white text-foreground font-semibold text-lg hover:bg-white/90 transition-all shadow-warm"
            >
              <ArrowRight className="w-5 h-5 inline-block mr-2" />
              {isEn ? 'Book a Demo' : 'Omba Demo'}
            </button>
            <button
              onClick={() => scrollTo('contact')}
              className="px-8 py-4 rounded-lg border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-all"
            >
              {isEn ? 'Contact Us' : 'Wasiliana Nasi'}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
