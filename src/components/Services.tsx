import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, CreditCard, QrCode, Heart, Send } from 'lucide-react';

const services = [
  { icon: Mail, titleKey: 'services.invitations.title', descKey: 'services.invitations.desc' },
  { icon: CreditCard, titleKey: 'services.pledges.title', descKey: 'services.pledges.desc' },
  { icon: Send, titleKey: 'services.sms.title', descKey: 'services.sms.desc' },
  { icon: QrCode, titleKey: 'services.checkin.title', descKey: 'services.checkin.desc' },
  { icon: Heart, titleKey: 'services.thankyou.title', descKey: 'services.thankyou.desc' },
  { icon: MessageSquare, titleKey: 'services.whatsapp.title', descKey: 'services.whatsapp.desc' },
] as const;

const Services = () => {
  const { t } = useLanguage();

  return (
    <section id="services" className="py-24 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">{t('services.title')}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('services.subtitle')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group glass-card rounded-xl p-6 hover:shadow-warm transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <service.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                {t(service.titleKey as any)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(service.descKey as any)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
