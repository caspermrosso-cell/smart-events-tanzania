import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isEn = language === 'en';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setIsOpen(false), [location.pathname]);

  const navLinks = [
    { label: isEn ? 'About' : 'Kuhusu', to: '/about' },
    { label: isEn ? 'Features' : 'Vipengele', to: '/features' },
    { label: isEn ? 'Use Cases' : 'Matumizi', to: '/use-cases' },
    { label: isEn ? 'How It Works' : 'Inavyofanya Kazi', to: '/how-it-works' },
    { label: isEn ? 'Pricing' : 'Bei', to: '/pricing' },
    { label: isEn ? 'Contact' : 'Wasiliana', to: '/contact' },
  ];

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 text-foreground transition-all duration-300 ${
        scrolled
          ? 'border-b border-border/70 bg-background/85 py-1 shadow-[0_10px_30px_-24px_hsl(var(--foreground)/0.5)] backdrop-blur-xl'
          : 'border-b border-transparent bg-background/50 py-2 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <Link to="/" className="flex items-center gap-2 transition-transform hover:-translate-y-0.5">
          <img src="/smart-events-logo.png" alt="Smart Events" className="h-auto w-32" />
          <span className="font-heading text-xl font-bold text-foreground">Smart Events</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `story-link text-sm font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'SW' : 'EN'}
          </button>
          <Link
            to="/login"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-foreground"
          >
            {isEn ? 'Admin Login' : 'Ingia Admin'}
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
            className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
          >
            <Globe className="h-3.5 w-3.5" />
            {language === 'en' ? 'SW' : 'EN'}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground" aria-label="Menu">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `block py-2 text-sm ${isActive ? 'font-semibold text-primary' : 'text-muted-foreground'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              <Link
                to="/login"
                className="mt-2 rounded-full bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-foreground"
              >
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
