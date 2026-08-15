import { LanguageProvider } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HomeSummary from '@/components/HomeSummary';
import PhotoMarquee from '@/components/PhotoMarquee';
import EventTestimonials from '@/components/EventTestimonials';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <HomeSummary />
          <PhotoMarquee />
          <EventTestimonials />
          <ContactForm />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default Index;
