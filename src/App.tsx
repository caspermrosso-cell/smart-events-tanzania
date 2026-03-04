import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Guests from "./pages/Guests";
import Pledges from "./pages/Pledges";
import SMS from "./pages/SMS";
import ECards from "./pages/ECards";
import CheckIn from "./pages/CheckIn";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
            <Route path="/pledges" element={<ProtectedRoute><Pledges /></ProtectedRoute>} />
            <Route path="/sms" element={<ProtectedRoute><SMS /></ProtectedRoute>} />
            <Route path="/ecards" element={<ProtectedRoute><ECards /></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
