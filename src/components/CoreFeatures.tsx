import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { MessageSquare, Bell, Users, LayoutDashboard, BarChart3 } from 'lucide-react';

const CoreFeatures = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const features = [
    {
      icon: MessageSquare,
      title: isEn ? 'Smart Invitations & Messaging' : 'Mialiko na Ujumbe wa Kisasa',
      desc: isEn
        ? 'Reach your audience through SMS, Email, and WhatsApp with targeted messaging.'
        : 'Fikia hadhira yako kupitia SMS, Barua pepe, na WhatsApp kwa ujumbe unaolengwa.',
    },
    {
      icon: Bell,
      title: isEn ? 'Automated Reminders' : 'Ukumbusho Otomatiki',
      desc: isEn
        ? 'Reduce no-shows with scheduled reminders and real-time updates.'
        : 'Punguza kutokuja kwa ukumbusho wa ratiba na masasisho ya wakati halisi.',
    },
    {
      icon: Users,
      title: isEn ? 'Real-Time Attendance Tracking' : 'Ufuatiliaji wa Mahudhurio',
      desc: isEn
        ? 'Monitor who is attending, arriving, or absent — instantly.'
        : 'Fuatilia nani anahudhuria, anafika, au hayupo — papo hapo.',
    },
    {
      icon: LayoutDashboard,
      title: isEn ? 'Guest Management Dashboard' : 'Dashibodi ya Usimamizi wa Wageni',
      desc: isEn
        ? 'Organize guest lists, RSVPs, and communication in one place.'
        : 'Panga orodha za wageni, RSVP, na mawasiliano mahali pamoja.',
    },
    {
      icon: BarChart3,
      title: isEn ? 'Reporting & Insights' : 'Ripoti na Uchambuzi',
      desc: isEn
        ? 'Understand attendance rates, engagement, and communication performance.'
        : 'Elewa viwango vya mahudhurio, ushirikiano, na utendaji wa mawasiliano.',
    },
  ];

  return (
    <section id="features" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
            {isEn ? 'Everything You Need to Run High-Impact Events' : 'Kila Unachohitaji Kuendesha Matukio Yenye Athari Kubwa'}
          </h2>
        </motion.div>

        <div className="grid gap-6 max-w-5xl mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 hover:shadow-warm transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreFeatures;
