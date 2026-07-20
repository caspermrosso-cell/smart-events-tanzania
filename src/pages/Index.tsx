import { LanguageProvider } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import Benefits from '@/components/Benefits';
import HowItWorks from '@/components/HowItWorks';
import ProductSnapshot from '@/components/ProductSnapshot';
import SocialProof from '@/components/SocialProof';
import EventTestimonials from '@/components/EventTestimonials';
import UseCases from '@/components/UseCases';
import Differentiation from '@/components/Differentiation';
import ObjectionHandling from '@/components/ObjectionHandling';
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
        <Benefits />
        <HowItWorks />
        <ProductSnapshot />
      <SocialProof />
      <EventTestimonials />
      <UseCases />
        <Differentiation />
        <ObjectionHandling />
        <Pricing />
        <CtaSection />
        <ContactForm />
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Index;
