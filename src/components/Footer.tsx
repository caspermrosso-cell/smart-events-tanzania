import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const links = [
    { label: isEn ? 'About' : 'Kuhusu', to: '/about' },
    { label: isEn ? 'Features' : 'Vipengele', to: '/features' },
    { label: isEn ? 'Use Cases' : 'Matumizi', to: '/use-cases' },
    { label: isEn ? 'How It Works' : 'Inavyofanya Kazi', to: '/how-it-works' },
    { label: isEn ? 'Pricing' : 'Bei', to: '/pricing' },
    { label: isEn ? 'Contact' : 'Wasiliana', to: '/contact' },
  ];

  return (
    <footer className="border-t border-border bg-secondary/60">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <img src="/smart-events-logo.png" alt="Smart Events" className="mb-4 h-auto w-44" />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {isEn
                ? 'We look after invitations, reminders and the door — so every guest arrives feeling expected.'
                : 'Tunashughulikia mialiko, vikumbusho na mlango — ili kila mgeni afike akijua anasubiriwa.'}
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-heading mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
              {isEn ? 'Explore' : 'Tembelea'}
            </h2>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="story-link text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-heading mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
              {isEn ? 'Say hello' : 'Karibu tuongee'}
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Plot 22, Mbezi Beach A, Kinondoni, Dar es Salaam
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:info@smartevents.co.tz" className="hover:text-primary">info@smartevents.co.tz</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+255736670202" className="hover:text-primary">+255 736 670 202</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Smart Events Tanzania. {isEn ? 'All rights reserved.' : 'Haki zote zimehifadhiwa.'}</p>
          <p>{isEn ? 'Made with care in Dar es Salaam.' : 'Imetengenezwa kwa upendo Dar es Salaam.'}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
