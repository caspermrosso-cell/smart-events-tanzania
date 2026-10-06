import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const PUBLIC_PATHS = new Set([
  '/',
  '/about',
  '/features',
  '/use-cases',
  '/how-it-works',
  '/pricing',
  '/contact',
]);

const WhatsAppChatButton = () => {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  if (!PUBLIC_PATHS.has(pathname)) return null;

  const isEn = language === 'en';
  const message = isEn
    ? 'Hello Smart Events Tanzania, I would like to learn more about your services.'
    : 'Habari Smart Events Tanzania, ningependa kufahamu zaidi kuhusu huduma zenu.';
  const chatUrl = `https://wa.me/255784670202?text=${encodeURIComponent(message)}`;

  return (
    <Button
      asChild
      size="lg"
      className="fixed bottom-5 right-4 z-50 h-14 rounded-full px-4 shadow-[0_0_26px_hsl(var(--primary)/0.46)] sm:bottom-7 sm:right-7 sm:px-5"
    >
      <a
        href={chatUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isEn ? 'Chat with us on WhatsApp' : 'Ongea nasi WhatsApp'}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">{isEn ? 'Chat with us' : 'Ongea nasi'}</span>
      </a>
    </Button>
  );
};

export default WhatsAppChatButton;