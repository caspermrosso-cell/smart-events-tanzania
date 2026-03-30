import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Upload, Send, Bell, ScanLine, BarChart3 } from 'lucide-react';

const HowItWorksContent = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const steps = [
    { icon: Upload, title: isEn ? 'Create Your Event' : 'Tengeneza Tukio Lako', desc: isEn ? 'Set up your event details and upload your guest list.' : 'Weka maelezo ya tukio lako na pakia orodha ya wageni.' },
    { icon: Send, title: isEn ? 'Send Invitations' : 'Tuma Mialiko', desc: isEn ? 'Reach your audience via SMS, Email, or WhatsApp.' : 'Fikia hadhira yako kupitia SMS, Barua pepe, au WhatsApp.' },
    { icon: Bell, title: isEn ? 'Automate Communication' : 'Otomatisha Mawasiliano', desc: isEn ? 'Schedule reminders and updates to keep guests engaged.' : 'Panga ukumbusho na masasisho kuwashirikisha wageni.' },
    { icon: ScanLine, title: isEn ? 'Track Attendance' : 'Fuatilia Mahudhurio', desc: isEn ? 'Monitor attendance in real time during the event.' : 'Fuatilia mahudhurio kwa wakati halisi wakati wa tukio.' },
    { icon: BarChart3, title: isEn ? 'Analyze Performance' : 'Chambua Utendaji', desc: isEn ? 'Review reports and insights to improve future events.' : 'Pitia ripoti na uchambuzi kuboresha matukio yajayo.' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4">
              {isEn ? 'From Invitation to Insight — All in One Flow' : 'Kutoka Mwaliko hadi Uchambuzi — Yote katika Mtiririko Mmoja'}
            </h1>
          </motion.div>

          <div className="space-y-8">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex items-start gap-5"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-heading font-bold text-lg">
                  {i + 1}
                </div>
                <div className="glass-card rounded-xl p-5 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <s.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-heading text-lg font-bold text-foreground">{s.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const HowItWorksPage = () => (
  <LanguageProvider>
    <HowItWorksContent />
  </LanguageProvider>
);

export default HowItWorksPage;
