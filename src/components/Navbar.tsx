import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const Navbar = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isEn = language === 'en';
  const isHome = location.pathname === '/';

  const scrollTo = (id: string) => {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
    setIsOpen(false);
  };

  const navLinks = [
    { label: isEn ? 'About' : 'Kuhusu', to: '/about' },
    { label: isEn ? 'Features' : 'Vipengele', to: '/features' },
    { label: isEn ? 'Use Cases' : 'Matumizi', to: '/use-cases' },
    { label: isEn ? 'How It Works' : 'Inavyofanya Kazi', to: '/how-it-works' },
    { label: isEn ? 'Pricing' : 'Bei', action: () => scrollTo('pricing') },
    { label: isEn ? 'Contact' : 'Wasiliana', to: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-background/85 text-foreground backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
<img src="/smart-events-logo.png" alt="Smart Events" className="w-32 h-auto" />
        <span className="font-heading text-xl font-bold text-foreground">Smart Events</span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-5">
          {navLinks.map((link, i) =>
            link.to ? (
              <Link key={i} to={link.to} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </Link>
            ) : (
              <button key={i} onClick={link.action} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </button>
            )
          )}
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'SW' : 'EN'}
          </button>
          <Link to="/login" className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-foreground transition-colors">
            {isEn ? 'Admin Login' : 'Ingia Admin'}
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'en' ? 'SW' : 'EN'}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground" aria-label="Menu">
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
            className="lg:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link, i) =>
                link.to ? (
                  <Link key={i} to={link.to} className="text-sm py-2 text-muted-foreground" onClick={() => setIsOpen(false)}>
                    {link.label}
                  </Link>
                ) : (
                  <button key={i} onClick={link.action} className="text-sm py-2 text-muted-foreground text-left">
                    {link.label}
                  </button>
                )
              )}
              <Link to="/login" className="text-sm py-2 text-center rounded-full bg-primary text-primary-foreground font-medium hover:bg-foreground" onClick={() => setIsOpen(false)}>
                {isEn ? 'Admin Login' : 'Ingia Admin'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
