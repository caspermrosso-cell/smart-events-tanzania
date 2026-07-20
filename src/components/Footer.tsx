import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import smartEventsLogo from '@/assets/smart-events-logo.png';

const Footer = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const links = [
    { label: isEn ? 'About' : 'Kuhusu', to: '/about' },
    { label: isEn ? 'Features' : 'Vipengele', to: '/features' },
    { label: isEn ? 'Use Cases' : 'Matumizi', to: '/use-cases' },
    { label: isEn ? 'How It Works' : 'Inavyofanya Kazi', to: '/how-it-works' },
    { label: isEn ? 'Contact' : 'Wasiliana', to: '/contact' },
  ];

  return (
    <footer className="py-10 bg-deep-brown text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div className="flex items-center gap-3">
            <img src={smartEventsLogo} alt="Smart Events" className="h-auto" style={{ width: '200px' }} />
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {links.map((link, i) => (
              <Link key={i} to={link.to} className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 pt-6 text-center">
          <p className="text-primary-foreground/60 text-sm mb-2">
            {isEn ? 'Smart Events — Intelligent Event Management' : 'Smart Events — Usimamizi wa Matukio kwa Akili'}
          </p>
          <p className="text-primary-foreground/40 text-xs">
            © {new Date().getFullYear()} Smart Events. {isEn ? 'All rights reserved.' : 'Haki zote zimehifadhiwa.'}
          </p>
          <p className="text-primary-foreground/50 text-xs mt-2">
            <a href="mailto:info@smartevents.co.tz" className="hover:text-gold transition-colors">info@smartevents.co.tz</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
