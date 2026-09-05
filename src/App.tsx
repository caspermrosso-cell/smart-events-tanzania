import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Features from "./pages/Features";
import UseCasesPage from "./pages/UseCasesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import Contact from "./pages/Contact";
import PricingPage from "./pages/PricingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Guests from "./pages/Guests";
import Pledges from "./pages/Pledges";
import SMS from "./pages/SMS";
import ECards from "./pages/ECards";
import WhatsApp from "./pages/WhatsApp";
import CheckIn from "./pages/CheckIn";
import Reports from "./pages/Reports";
import Payments from "./pages/Payments";
import Quotations from "./pages/Quotations";
import Packages from "./pages/Packages";
import Testimonials from "./pages/Testimonials";
import RecycleBin from "./pages/RecycleBin";
import PricingSetup from './pages/PricingSetup';
import UsersPage from "./pages/Users";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/use-cases" element={<UseCasesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
              <Route path="/pledges" element={<ProtectedRoute><Pledges /></ProtectedRoute>} />
              <Route path="/sms" element={<ProtectedRoute><SMS /></ProtectedRoute>} />
              <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
              <Route path="/ecards" element={<ProtectedRoute><ECards /></ProtectedRoute>} />
              <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
              <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
              <Route path="/testimonials" element={<ProtectedRoute><Testimonials /></ProtectedRoute>} />
              <Route path="/recycle-bin" element={<ProtectedRoute><RecycleBin /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
              <Route path="/pricing-setup" element={<ProtectedRoute adminOnly><PricingSetup /></ProtectedRoute>} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
