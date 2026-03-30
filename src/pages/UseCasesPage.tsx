import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Building2, Landmark, Mic2, Rocket, Crown } from 'lucide-react';

const UseCasesContent = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const cases = [
    { icon: Building2, title: isEn ? 'Corporate Events' : 'Matukio ya Biashara', desc: isEn ? 'Ensure high attendance and smooth coordination for internal and external events.' : 'Hakikisha mahudhurio ya juu na uratibu mzuri wa matukio ya ndani na nje.' },
    { icon: Landmark, title: isEn ? 'Government & Institutional Events' : 'Matukio ya Serikali na Taasisi', desc: isEn ? 'Manage large-scale audiences with structured communication and tracking.' : 'Simamia hadhira kubwa kwa mawasiliano yenye muundo na ufuatiliaji.' },
    { icon: Mic2, title: isEn ? 'Conferences & Seminars' : 'Mikutano na Semina', desc: isEn ? 'Keep attendees informed, engaged, and accounted for.' : 'Wajulishe washiriki, washirikishe, na wahesabiwe.' },
    { icon: Rocket, title: isEn ? 'Product Launches' : 'Uzinduzi wa Bidhaa', desc: isEn ? 'Maximize turnout and track engagement from invitation to attendance.' : 'Ongeza mahudhurio na fuatilia ushirikiano kutoka mwaliko hadi mahudhurio.' },
    { icon: Crown, title: isEn ? 'Private & VIP Events' : 'Matukio Binafsi na VIP', desc: isEn ? 'Deliver a seamless and controlled guest experience.' : 'Toa uzoefu wa wageni ulio laini na wenye udhibiti.' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4">
              {isEn ? 'Designed for Every Event Scenario' : 'Imebuniwa kwa Kila Hali ya Tukio'}
            </h1>
          </motion.div>

          <div className="space-y-6">
            {cases.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-2">{c.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{c.desc}</p>
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

const UseCasesPage = () => (
  <LanguageProvider>
    <UseCasesContent />
  </LanguageProvider>
);

export default UseCasesPage;
