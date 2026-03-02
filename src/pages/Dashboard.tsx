import { motion } from 'framer-motion';
import { Calendar, Users, CreditCard, MessageSquare, Mail, QrCode } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';

const modules = [
  { title: 'Matukio', desc: 'Tengeneza & simamia matukio', icon: Calendar, color: 'bg-primary/10 text-primary', href: '/events' },
  { title: 'Wageni', desc: 'Simamia mialiko & RSVP', icon: Users, color: 'bg-gold/10 text-gold', href: '/guests' },
  { title: 'Michango', desc: 'Fuatilia michango & malipo', icon: CreditCard, color: 'bg-accent/10 text-accent', href: '/pledges' },
  { title: 'SMS', desc: 'Tuma SMS & vikumbusho', icon: MessageSquare, color: 'bg-primary/10 text-primary', href: '/sms' },
  { title: 'E-Cards', desc: 'Buni & tuma kadi', icon: Mail, color: 'bg-gold/10 text-gold', href: '/ecards' },
  { title: 'Check-In', desc: 'Skani barcode mlangoni', icon: QrCode, color: 'bg-accent/10 text-accent', href: '/checkin' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [eventsRes, guestsRes, pledgesRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('pledges').select('amount, paid_amount'),
      ]);
      const totalPledged = (pledgesRes.data || []).reduce((s, p) => s + Number(p.amount), 0);
      const totalPaid = (pledgesRes.data || []).reduce((s, p) => s + Number(p.paid_amount), 0);
      return {
        events: eventsRes.count || 0,
        guests: guestsRes.count || 0,
        pledged: totalPledged,
        pending: totalPledged - totalPaid,
      };
    },
  });

  const statCards = [
    { label: 'Matukio', value: stats?.events ?? 0, icon: Calendar },
    { label: 'Wageni', value: stats?.guests ?? 0, icon: Users },
    { label: 'Michango', value: `TZS ${(stats?.pledged ?? 0).toLocaleString()}`, icon: CreditCard },
    { label: 'Pending', value: `TZS ${(stats?.pending ?? 0).toLocaleString()}`, icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground mb-8">
        Karibu, {user?.user_metadata?.full_name || user?.email}
      </motion.h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Modules</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onClick={() => navigate(m.href)}
            className="glass-card rounded-xl p-5 hover:shadow-warm transition-all cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-lg ${m.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <m.icon className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">{m.title}</h4>
            <p className="text-sm text-muted-foreground">{m.desc}</p>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
