import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={() => scrollTo('hero')} className="font-heading text-2xl font-bold text-gradient-gold">
          Smart Events
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => scrollTo('services')} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">{t('nav.services')}</button>
          <button onClick={() => scrollTo('pricing')} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">{t('nav.pricing')}</button>
          <button onClick={() => scrollTo('contact')} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">{t('nav.contact')}</button>
          
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'SW' : 'EN'}
          </button>

          <Link to="/login" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-accent transition-colors">
            {t('nav.login')}
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'en' ? 'SW' : 'EN'}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden glass-card border-t border-border"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              <button onClick={() => scrollTo('services')} className="text-sm py-2 text-foreground/80">{t('nav.services')}</button>
              <button onClick={() => scrollTo('pricing')} className="text-sm py-2 text-foreground/80">{t('nav.pricing')}</button>
              <button onClick={() => scrollTo('contact')} className="text-sm py-2 text-foreground/80">{t('nav.contact')}</button>
              <Link to="/login" className="text-sm py-2 text-center rounded-lg bg-primary text-primary-foreground font-medium" onClick={() => setIsOpen(false)}>
                {t('nav.login')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
