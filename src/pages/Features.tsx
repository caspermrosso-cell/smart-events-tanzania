import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import Benefits from '@/components/Benefits';
import ProductSnapshot from '@/components/ProductSnapshot';
import CtaSection from '@/components/CtaSection';
import { MessageSquare, Mail, Bell, ScanLine, Users, BarChart3, Server } from 'lucide-react';

const FeaturesContent = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const features = [
    { icon: MessageSquare, title: isEn ? 'Multi-Channel Communication' : 'Mawasiliano ya Njia Nyingi', desc: isEn ? 'Engage your audience through SMS, Email, and WhatsApp — ensuring your message reaches them where they are.' : 'Shirikisha hadhira yako kupitia SMS, Barua pepe, na WhatsApp — kuhakikisha ujumbe wako unawafikia walipo.' },
    { icon: Mail, title: isEn ? 'Smart Invitations' : 'Mialiko ya Kisasa', desc: isEn ? 'Send personalized invitations and manage confirmations seamlessly.' : 'Tuma mialiko ya kibinafsi na simamia uthibitisho kwa urahisi.' },
    { icon: Bell, title: isEn ? 'Automated Reminders' : 'Ukumbusho Otomatiki', desc: isEn ? 'Schedule reminders to improve attendance and keep guests informed.' : 'Panga ukumbusho kuboresha mahudhurio na kuwajulisha wageni.' },
    { icon: ScanLine, title: isEn ? 'Real-Time Attendance Tracking' : 'Ufuatiliaji wa Mahudhurio', desc: isEn ? 'Track attendance live during your event with accurate visibility.' : 'Fuatilia mahudhurio moja kwa moja wakati wa tukio lako kwa usahihi.' },
    { icon: Users, title: isEn ? 'Guest Management System' : 'Mfumo wa Usimamizi wa Wageni', desc: isEn ? 'Centralize guest data, segment audiences, and manage RSVPs efficiently.' : 'Kusanya data za wageni, gawanya hadhira, na simamia RSVP kwa ufanisi.' },
    { icon: BarChart3, title: isEn ? 'Analytics & Reporting' : 'Uchambuzi na Ripoti', desc: isEn ? 'Access detailed reports on attendance, engagement, and communication effectiveness.' : 'Pata ripoti za kina kuhusu mahudhurio, ushirikiano, na ufanisi wa mawasiliano.' },
    { icon: Server, title: isEn ? 'Scalable Infrastructure' : 'Miundombinu Inayokua', desc: isEn ? 'Whether small or large events, the platform scales to your requirements.' : 'Iwe matukio madogo au makubwa, jukwaa linakua kulingana na mahitaji yako.' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4">
              {isEn ? 'Powerful Features Built for Real Event Challenges' : 'Vipengele Vyenye Nguvu Vilivyojengwa kwa Changamoto Halisi za Matukio'}
            </h1>
          </motion.div>

          <div className="grid gap-6 max-w-5xl mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="soft-card rounded-2xl p-6 hover:shadow-warm transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Benefits />
      <ProductSnapshot />
      <CtaSection />
      <Footer />
    </div>
  );
};

const Features = () => (
  <LanguageProvider>
    <FeaturesContent />
  </LanguageProvider>
);

export default Features;
