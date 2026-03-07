import { useLanguage } from '@/contexts/LanguageContext';
import smartEventsLogo from '@/assets/smart-events-logo.png';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-10 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <img src={smartEventsLogo} alt="Smart Events" className="h-auto mx-auto mb-3 max-w-full" style={{ width: '640px' }} />
        <h3 className="font-heading text-2xl font-bold mb-2 text-gradient-gold inline-block">Smart Events</h3>
        <p className="text-primary-foreground/60 text-sm mb-4">{t('footer.tagline')}</p>
        <p className="text-primary-foreground/40 text-xs">© {new Date().getFullYear()} Smart Events. {t('footer.rights')}</p>
      </div>
    </footer>
  );
};

export default Footer;
