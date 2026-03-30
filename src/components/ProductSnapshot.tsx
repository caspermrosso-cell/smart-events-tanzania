import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Monitor, BarChart3, MessageSquare } from 'lucide-react';

const ProductSnapshot = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const snapshots = [
    { icon: Monitor, label: isEn ? 'Dashboard' : 'Dashibodi' },
    { icon: BarChart3, label: isEn ? 'Reports' : 'Ripoti' },
    { icon: MessageSquare, label: isEn ? 'Messaging' : 'Ujumbe' },
  ];

  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            {isEn ? 'Built for Control and Visibility' : 'Imejengwa kwa Udhibiti na Mwonekano'}
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            {isEn
              ? 'A centralized dashboard gives you full visibility into your event — before, during, and after.'
              : 'Dashibodi kuu inakupa mwonekano kamili wa tukio lako — kabla, wakati, na baada.'}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {snapshots.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-8 h-8 text-primary" />
              </div>
              <span className="font-heading font-semibold text-foreground text-lg">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSnapshot;
