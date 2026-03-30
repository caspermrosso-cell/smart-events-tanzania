import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const SocialProof = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-12">
            {isEn ? 'Trusted by Organizations That Value Precision' : 'Kuaminiwa na Mashirika Yanayothamini Usahihi'}
          </h2>

          <div className="glass-card rounded-2xl p-8 md:p-12">
            <Quote className="w-10 h-10 text-primary/40 mx-auto mb-6" />
            <blockquote className="text-lg md:text-xl text-foreground leading-relaxed italic mb-6">
              {isEn
                ? '"Smart Events significantly improved our attendance rate and gave us full visibility into our event performance."'
                : '"Smart Events imeboresha kwa kiasi kikubwa kiwango chetu cha mahudhurio na kutupa mwonekano kamili wa utendaji wa matukio yetu."'}
            </blockquote>
            <p className="text-muted-foreground text-sm font-medium">
              — {isEn ? 'Event Manager, Corporate Client' : 'Meneja wa Matukio, Mteja wa Biashara'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
