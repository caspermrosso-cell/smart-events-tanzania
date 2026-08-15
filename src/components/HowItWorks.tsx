import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Upload, Send, Bell, ScanLine, BarChart3 } from 'lucide-react';

const HowItWorks = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const steps = [
    { icon: Upload, text: isEn ? 'Upload or create your guest list' : 'Pakia au tengeneza orodha ya wageni' },
    { icon: Send, text: isEn ? 'Send invitations across multiple channels' : 'Tuma mialiko kupitia njia mbalimbali' },
    { icon: Bell, text: isEn ? 'Automate reminders and updates' : 'Otomatisha ukumbusho na masasisho' },
    { icon: ScanLine, text: isEn ? 'Track attendance in real time' : 'Fuatilia mahudhurio kwa wakati halisi' },
    { icon: BarChart3, text: isEn ? 'Analyze results and improve future events' : 'Chambua matokeo na uboreshe matukio yajayo' },
  ];

  return (
    <section id="howitworks" className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'Simple. Structured. Effective.' : 'Rahisi. Yenye Muundo. Yenye Ufanisi.'}
          </h2>
        </motion.div>

        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-center gap-5"
            >
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-heading font-bold text-lg">
                {i + 1}
              </div>
              <div className="flex items-center gap-3 soft-card rounded-xl p-4 flex-1">
                <s.icon className="w-5 h-5 text-primary shrink-0" />
                <p className="text-foreground font-medium">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
