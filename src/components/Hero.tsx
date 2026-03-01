import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import heroImage from '@/assets/hero-events.jpg';

const Hero = () => {
  const { t } = useLanguage();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Smart Events" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/80" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-4">
            {t('hero.title')}
          </h1>
          <p className="font-heading text-xl md:text-2xl text-primary-foreground/90 mb-4 italic">
            {t('hero.subtitle')}
          </p>
          <p className="max-w-2xl mx-auto text-primary-foreground/75 text-base md:text-lg mb-10 leading-relaxed">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo('contact')}
              className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-accent transition-all shadow-warm"
            >
              {t('hero.cta')}
            </button>
            <button
              onClick={() => scrollTo('services')}
              className="px-8 py-3.5 rounded-lg border border-primary-foreground/30 text-primary-foreground font-semibold text-lg hover:bg-primary-foreground/10 transition-all"
            >
              {t('hero.cta2')}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
