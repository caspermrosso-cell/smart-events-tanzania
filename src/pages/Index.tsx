import { LanguageProvider } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import CoreFeatures from '@/components/CoreFeatures';
import HowItWorks from '@/components/HowItWorks';
import UseCases from '@/components/UseCases';
import SocialProof from '@/components/SocialProof';
import Pricing from '@/components/Pricing';
import CtaSection from '@/components/CtaSection';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen">
        <Navbar />
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <CoreFeatures />
        <HowItWorks />
        <UseCases />
        <SocialProof />
        <Pricing />
        <CtaSection />
        <ContactForm />
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Index;
