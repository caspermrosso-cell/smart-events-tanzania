import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

const ObjectionHandling = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const faqs = [
    {
      q: isEn ? 'Will this be complex to use?' : 'Je, hii itakuwa ngumu kutumia?',
      a: isEn ? 'No — the platform is designed for simplicity and quick setup.' : 'Hapana — jukwaa limeundwa kwa urahisi na usanidi wa haraka.',
    },
    {
      q: isEn ? 'Can it handle large events?' : 'Je, inaweza kushughulikia matukio makubwa?',
      a: isEn ? 'Yes — from small meetings to thousands of attendees.' : 'Ndiyo — kutoka mikutano midogo hadi maelfu ya washiriki.',
    },
    {
      q: isEn ? 'Do I need technical expertise?' : 'Je, ninahitaji ujuzi wa kiufundi?',
      a: isEn ? 'No — everything is managed through an intuitive interface.' : 'Hapana — kila kitu kinasimamiwa kupitia kiolesura rahisi.',
    },
  ];

  return (
    <section className="py-24 bg-warm-cream/40">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'Common Concerns' : 'Maswali Yanayoulizwa Mara Kwa Mara'}
          </h2>
        </motion.div>

        <div className="space-y-5">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="soft-card rounded-xl p-6"
            >
              <div className="flex items-start gap-3 mb-2">
                <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="font-heading font-semibold text-foreground">"{faq.q}"</p>
              </div>
              <p className="text-muted-foreground ml-8">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ObjectionHandling;
