import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ContactForm = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', eventType: '', date: '', guests: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: form,
      });
      if (error) throw error;
      toast.success(t('contact.success'));
      setForm({ name: '', email: '', phone: '', eventType: '', date: '', guests: '', message: '' });
    } catch {
      toast.error('Imeshindikana kutuma ombi. Jaribu tena.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm";

  return (
    <section id="contact" className="py-24 bg-warm-cream/40">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">{t('contact.title')}</h2>
          <p className="text-muted-foreground text-lg">{t('contact.subtitle')}</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <input required placeholder={t('contact.name')} className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={100} />
            <input required type="email" placeholder={t('contact.email')} className={inputClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} maxLength={255} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input required type="tel" placeholder={t('contact.phone')} className={inputClass} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} maxLength={20} />
            <select required className={inputClass} value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}>
              <option value="">{t('contact.eventType')}</option>
              <option value="wedding">{t('contact.eventType.wedding')}</option>
              <option value="corporate">{t('contact.eventType.corporate')}</option>
              <option value="birthday">{t('contact.eventType.birthday')}</option>
              <option value="other">{t('contact.eventType.other')}</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input type="date" required className={inputClass} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input type="number" placeholder={t('contact.guests')} className={inputClass} value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })} min={1} max={100000} />
          </div>
          <textarea placeholder={t('contact.message')} className={`${inputClass} min-h-[100px] resize-none`} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} maxLength={1000} />
          <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-accent transition-colors shadow-warm disabled:opacity-50">
            {submitting ? 'Inatuma...' : t('contact.submit')}
          </button>
          <p className="text-center text-sm text-muted-foreground">{t('contact.email.info')}</p>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactForm;
