import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CtaSection = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else navigate('/contact');
  };

  return (
    <section className="py-24 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            {isEn ? 'Let’s make your next event feel effortless.' : 'Hebu tufanye tukio lako lijalo liwe jepesi.'}
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-10">
            {isEn
              ? 'If attendance, coordination, and visibility matter — Smart Events is built for you.'
              : 'Kama mahudhurio, uratibu, na mwonekano ni muhimu — Smart Events imejengwa kwa ajili yako.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo('contact')}
              className="px-8 py-4 rounded-full bg-accent text-accent-foreground font-semibold text-lg hover:bg-primary-foreground transition-all"
            >
              <ArrowRight className="w-5 h-5 inline-block mr-2" />
              {isEn ? 'Book a Demo' : 'Omba Demo'}
            </button>
            <button
              onClick={() => scrollTo('contact')}
              className="px-8 py-4 rounded-full border border-primary-foreground/25 text-primary-foreground font-semibold text-lg hover:bg-primary-foreground/10 transition-all"
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
