import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-events.jpg';

const Hero = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Smart Events" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/60 to-foreground/90" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            {isEn
              ? 'Increase Event Attendance. Eliminate Guesswork.'
              : 'Ongeza Mahudhurio ya Matukio. Ondoa Kubahatisha.'}
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-10 max-w-3xl mx-auto leading-relaxed">
            {isEn
              ? 'Smart Events helps you manage invitations, automate reminders, and track attendance in real time — so your events run with precision and deliver measurable results.'
              : 'Smart Events inakusaidia kusimamia mialiko, kuautomatisha vikumbusho, na kufuatilia mahudhurio kwa wakati halisi — ili matukio yako yaendeshwe kwa usahihi na kutoa matokeo yanayopimika.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => scrollTo('contact')}
              className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-accent transition-all shadow-warm"
            >
              {isEn ? '👉 Book a Demo' : '👉 Omba Demo'}
            </button>
            <button
              onClick={() => scrollTo('howitworks')}
              className="px-8 py-4 rounded-lg border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 transition-all"
            >
              {isEn ? '👉 See How It Works' : '👉 Jinsi Inavyofanya Kazi'}
            </button>
          </div>
          <p className="text-white/50 text-sm">
            {isEn
              ? 'Used by organizations that value structured, high-impact events.'
              : 'Inatumiwa na mashirika yanayothamini matukio yaliyopangwa na yenye athari kubwa.'}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
