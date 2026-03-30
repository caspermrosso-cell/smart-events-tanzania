import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Target, Eye, TrendingUp, BarChart3 } from 'lucide-react';

const AboutContent = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const beliefs = [
    { icon: BarChart3, text: isEn ? 'Events should be measurable' : 'Matukio yanapaswa kupimika' },
    { icon: Target, text: isEn ? 'Communication should be structured' : 'Mawasiliano yanapaswa kuwa na muundo' },
    { icon: Eye, text: isEn ? 'Attendance should be predictable' : 'Mahudhurio yanapaswa kutabirika' },
    { icon: TrendingUp, text: isEn ? 'Data should drive improvement' : 'Data inapaswa kuendesha maboresho' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6">
              {isEn ? 'We Make Events Measurable, Structured, and Effective' : 'Tunafanya Matukio Yapimike, Yawe na Muundo, na Yenye Ufanisi'}
            </h1>
          </motion.div>

          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">{isEn ? 'Who We Are' : 'Sisi Ni Nani'}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {isEn
                  ? 'Smart Events is a technology-driven platform designed to transform how organizations manage events. We focus on solving the biggest gap in event execution — communication and attendance visibility.'
                  : 'Smart Events ni jukwaa linaloendeshwa na teknolojia lililobuniwa kubadilisha jinsi mashirika yanavyosimamia matukio. Tunazingatia kutatua pengo kubwa zaidi katika utekelezaji wa matukio — mawasiliano na mwonekano wa mahudhurio.'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">{isEn ? 'Our Mission' : 'Dhamira Yetu'}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {isEn
                  ? 'To help organizations run events with the same level of precision, accountability, and performance tracking as any core business operation.'
                  : 'Kusaidia mashirika kuendesha matukio kwa kiwango sawa cha usahihi, uwajibikaji, na ufuatiliaji wa utendaji kama shughuli yoyote ya msingi ya biashara.'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-4">{isEn ? 'Our Vision' : 'Maono Yetu'}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {isEn
                  ? 'To become the leading event performance platform across Africa and beyond.'
                  : 'Kuwa jukwaa linaloongoza la utendaji wa matukio barani Afrika na zaidi.'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6 text-center">{isEn ? 'What We Believe' : 'Tunaamini Nini'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {beliefs.map((b, i) => (
                  <div key={i} className="glass-card rounded-xl p-5 flex items-center gap-4">
                    <b.icon className="w-6 h-6 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{b.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const About = () => (
  <LanguageProvider>
    <AboutContent />
  </LanguageProvider>
);

export default About;
