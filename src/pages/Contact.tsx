import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ContactContent = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', { body: { ...form, eventType: 'General Inquiry' } });
      if (error) throw error;
      toast.success(isEn ? 'Message sent successfully!' : 'Ujumbe umetumwa!');
      setForm({ name: '', company: '', email: '', phone: '', message: '' });
    } catch {
      toast.error(isEn ? 'Failed to send. Please try again.' : 'Imeshindikana kutuma. Jaribu tena.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4">
              {isEn ? "Let's Help You Run Better Events" : 'Tukusaidie Kuendesha Matukio Bora'}
            </h1>
            <p className="text-muted-foreground">
              Email: <a href="mailto:info@smartevents.co.tz" className="text-primary hover:underline">info@smartevents.co.tz</a>
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="soft-card rounded-2xl p-8 space-y-4"
          >
            <input type="text" required placeholder={isEn ? 'Name' : 'Jina'} className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input type="text" placeholder={isEn ? 'Company' : 'Kampuni'} className={inputClass} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            <input type="email" required placeholder={isEn ? 'Email' : 'Barua pepe'} className={inputClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input type="tel" placeholder={isEn ? 'Phone' : 'Simu'} className={inputClass} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <textarea rows={4} placeholder={isEn ? 'Message' : 'Ujumbe'} className={inputClass} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              {submitting ? '...' : isEn ? 'Book a Demo' : 'Omba Demo'}
            </button>
          </motion.form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const Contact = () => (
  <LanguageProvider>
    <ContactContent />
  </LanguageProvider>
);

export default Contact;
