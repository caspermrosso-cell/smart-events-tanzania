import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Pricing from '@/components/Pricing';
import Differentiation from '@/components/Differentiation';
import ObjectionHandling from '@/components/ObjectionHandling';
import CtaSection from '@/components/CtaSection';
import AnimatedHeading from '@/components/AnimatedHeading';
import Reveal from '@/components/Reveal';

const PricingContent = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className="min-h-screen">
      <Navbar />
      <header className="pt-32 pb-6">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="eyebrow mb-6">{isEn ? 'Packages' : 'Vifurushi'}</span>
          </Reveal>
          <h1 className="font-heading text-4xl font-bold text-foreground md:text-6xl">
            <AnimatedHeading text={isEn ? 'Pricing that respects your budget.' : 'Bei inayoheshimu bajeti yako.'} />
          </h1>
        </div>
      </header>
      <Pricing />
      <Differentiation />
      <ObjectionHandling />
      <CtaSection />
      <Footer />
    </div>
  );
};

const PricingPage = () => (
  <LanguageProvider>
    <PricingContent />
  </LanguageProvider>
);

export default PricingPage;
