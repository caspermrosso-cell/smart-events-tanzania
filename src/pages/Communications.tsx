import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCheck, MessageCircle, MessageSquare, Radio, Send, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ChannelHeader from '@/components/ChannelHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const Communications = () => {
  const { data: stats } = useQuery({
    queryKey: ['communications-overview'],
    queryFn: async () => {
      const [sms, whatsapp, delivered, read] = await Promise.all([
        supabase.from('sms_logs').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_logs').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_logs').select('id', { count: 'exact', head: true }).not('delivered_at', 'is', null),
        supabase.from('whatsapp_logs').select('id', { count: 'exact', head: true }).not('read_at', 'is', null),
      ]);
      return { sms: sms.count || 0, whatsapp: whatsapp.count || 0, delivered: delivered.count || 0, read: read.count || 0 };
    },
  });

  const total = (stats?.sms || 0) + (stats?.whatsapp || 0);
  return (
    <DashboardLayout>
      <ChannelHeader title="Communications" description="Manage every guest message from one focused workspace." metric={total.toLocaleString()} metricLabel="total messages" />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[
          { title: 'SMS', subtitle: 'Bulk messages, variables and delivery reports', href: '/sms', icon: MessageSquare, value: stats?.sms || 0, label: 'messages sent', tone: 'bg-gold/15 text-gold' },
          { title: 'WhatsApp', subtitle: 'Approved templates, rich media and responses', href: '/whatsapp', icon: MessageCircle, value: stats?.whatsapp || 0, label: 'campaign messages', tone: 'bg-primary/10 text-primary' },
        ].map((channel, index) => (
          <motion.article key={channel.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="command-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${channel.tone}`}><channel.icon className="h-6 w-6" /></div>
                <div><h2 className="text-lg font-bold">{channel.title}</h2><p className="text-xs text-muted-foreground">{channel.subtitle}</p></div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary"><Radio className="h-3 w-3" /> Active</span>
            </div>
            <div className="mt-7 flex items-end justify-between">
              <div><p className="text-3xl font-bold text-foreground">{channel.value.toLocaleString()}</p><p className="text-xs text-muted-foreground">{channel.label}</p></div>
              <div className="flex h-12 items-end gap-1" aria-hidden="true">{[35, 55, 75, 100].map((height) => <span key={height} className="w-1.5 rounded-full bg-primary/20 last:bg-primary" style={{ height: `${height}%` }} />)}</div>
            </div>
            <Button asChild variant="outline" className="mt-5 w-full"><Link to={channel.href}>Open {channel.title} tools <ArrowRight className="h-4 w-4" /></Link></Button>
          </motion.article>
        ))}
      </div>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="metric-tile"><Send className="h-4 w-4 text-gold" /><div><p className="text-xl font-bold">{total.toLocaleString()}</p><p className="text-xs text-muted-foreground">Combined outreach</p></div></div>
        <div className="metric-tile"><CheckCheck className="h-4 w-4 text-primary" /><div><p className="text-xl font-bold">{(stats?.delivered || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">WhatsApp delivered</p></div></div>
        <div className="metric-tile"><Sparkles className="h-4 w-4 text-accent-foreground" /><div><p className="text-xl font-bold">{(stats?.read || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">WhatsApp read</p></div></div>
      </section>
    </DashboardLayout>
  );
};

export default Communications;