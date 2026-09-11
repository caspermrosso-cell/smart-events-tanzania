import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Users, CreditCard, MessageSquare, MessageCircle, Mail, QrCode, Wallet,
  FileText, UserCog, Package, Quote, BarChart3, Trash2, Coins, Landmark, ShoppingCart,
  GripVertical, RotateCcw, ArrowRight, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { AppModule, usePermissions } from '@/hooks/usePermissions';

type Step = {
  id: string;
  title: string;
  desc: string;
  stage: string;
  icon: any;
  tone: string;
  href: string;
  module: AppModule;
};

const STEPS: Step[] = [
  { id: 'events', title: 'Matukio', desc: 'Anzisha tukio, weka tarehe, picha na bajeti', stage: 'Andaa', icon: Calendar, tone: 'bg-primary/10 text-primary', href: '/events', module: 'events' },
  { id: 'packages', title: 'Packages', desc: 'Panga vifurushi na huduma unazouza', stage: 'Andaa', icon: Package, tone: 'bg-accent/10 text-accent', href: '/packages', module: 'packages' },
  { id: 'guests', title: 'Wageni', desc: 'Pakia orodha, kadi namba na RSVP', stage: 'Andaa', icon: Users, tone: 'bg-gold/10 text-gold', href: '/guests', module: 'guests' },
  { id: 'ecards', title: 'E-Card Studio', desc: 'Buni kadi za mwaliko na QR ya kila mgeni', stage: 'Alika', icon: Mail, tone: 'bg-gold/10 text-gold', href: '/ecards', module: 'ecards' },
  { id: 'sms', title: 'SMS', desc: 'Templates, variables, bulk na ripoti za Beem', stage: 'Alika', icon: MessageSquare, tone: 'bg-primary/10 text-primary', href: '/sms', module: 'sms' },
  { id: 'whatsapp', title: 'WhatsApp', desc: 'Templates za Meta, media na majibu ya wageni', stage: 'Alika', icon: MessageCircle, tone: 'bg-accent/10 text-accent', href: '/whatsapp', module: 'whatsapp' },
  { id: 'checkin', title: 'Check-In', desc: 'Skani QR au kadi namba mlangoni', stage: 'Endesha', icon: QrCode, tone: 'bg-accent/10 text-accent', href: '/checkin', module: 'checkin' },
  { id: 'pledges', title: 'Michango', desc: 'Fuatilia ahadi, malipo na vikumbusho', stage: 'Endesha', icon: CreditCard, tone: 'bg-primary/10 text-primary', href: '/pledges', module: 'pledges' },
  { id: 'payments', title: 'Malipo', desc: 'Pokea malipo kupitia NBC Lipa No.', stage: 'Fedha', icon: Wallet, tone: 'bg-gold/10 text-gold', href: '/payments', module: 'payments' },
  { id: 'quotations', title: 'Nyaraka', desc: 'Quotations, Invoices na Receipts', stage: 'Fedha', icon: FileText, tone: 'bg-primary/10 text-primary', href: '/quotations', module: 'quotations' },
  { id: 'purchases', title: 'Manunuzi ya Units', desc: 'Risiti za SMS/WhatsApp kutoka kwa watoa huduma', stage: 'Fedha', icon: ShoppingCart, tone: 'bg-accent/10 text-accent', href: '/purchases', module: 'quotations' },
  { id: 'pricing', title: 'Mipangilio ya Bei', desc: 'Bei ya kuuza, ya kununua na faida', stage: 'Fedha', icon: Coins, tone: 'bg-gold/10 text-gold', href: '/pricing-setup', module: 'users' },
  { id: 'financials', title: 'Financial Statements', desc: 'Taarifa nne za kifedha na export ya Word', stage: 'Fedha', icon: Landmark, tone: 'bg-primary/10 text-primary', href: '/financial-statements', module: 'users' },
  { id: 'reports', title: 'Ripoti', desc: 'Chati, filters na export ya Excel/PDF', stage: 'Pima', icon: BarChart3, tone: 'bg-accent/10 text-accent', href: '/reports', module: 'reports' },
  { id: 'testimonials', title: 'Testimonials', desc: 'Onyesha kazi zako kwenye tovuti', stage: 'Pima', icon: Quote, tone: 'bg-gold/10 text-gold', href: '/testimonials', module: 'testimonials' },
  { id: 'users', title: 'Watumiaji', desc: 'Tengeneza users na ruhusa za modules', stage: 'Simamia', icon: UserCog, tone: 'bg-primary/10 text-primary', href: '/users', module: 'users' },
  { id: 'recycle', title: 'Recycle Bin', desc: 'Rejesha au futa kabisa records', stage: 'Simamia', icon: Trash2, tone: 'bg-muted text-muted-foreground', href: '/recycle-bin', module: 'recycle_bin' },
];

const ORDER_KEY = 'dashboard-playbook-order';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { can, isAdmin } = usePermissions();
  const [order, setOrder] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null');
      if (Array.isArray(saved)) setOrder(saved);
    } catch { /* ignore */ }
  }, []);

  const steps = useMemo(() => {
    const allowed = STEPS.filter((s) => can(s.module));
    if (!order.length) return allowed;
    const rank = (id: string) => (order.indexOf(id) === -1 ? 999 : order.indexOf(id));
    return [...allowed].sort((a, b) => rank(a.id) - rank(b.id));
  }, [order, can]);

  const persist = (ids: string[]) => {
    setOrder(ids);
    localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = steps.map((s) => s.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    persist(ids);
    setDragId(null);
  };

  const resetOrder = () => {
    localStorage.removeItem(ORDER_KEY);
    setOrder([]);
  };

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    enabled: isAdmin,
    queryFn: async () => {
      const [eventsRes, guestsRes, pledgesRes, checkinRes, smsRes, waRes, invRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('pledges').select('amount, paid_amount'),
        supabase.from('guests').select('id', { count: 'exact', head: true }).eq('checked_in', true),
        supabase.from('sms_logs').select('id', { count: 'exact', head: true }),
        (supabase as any).from('whatsapp_logs').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('grand_total, status'),
      ]);
      const pledges = pledgesRes.data || [];
      const totalPledged = pledges.reduce((s, p) => s + Number(p.amount), 0);
      const totalPaid = pledges.reduce((s, p) => s + Number(p.paid_amount), 0);
      const invoices = (invRes.data as any[]) || [];
      return {
        events: eventsRes.count || 0,
        guests: guestsRes.count || 0,
        checkedIn: checkinRes.count || 0,
        sms: smsRes.count || 0,
        whatsapp: waRes.count || 0,
        pledged: totalPledged,
        outstanding: totalPledged - totalPaid,
        billed: invoices.reduce((s, i) => s + Number(i.grand_total || 0), 0),
        collected: invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.grand_total || 0), 0),
      };
    },
  });

  const tzs = (n: number) => `TZS ${(n || 0).toLocaleString()}`;

  const statCards = [
    { label: 'Matukio', value: stats?.events ?? 0, icon: Calendar, hint: 'yaliyosajiliwa' },
    { label: 'Wageni', value: (stats?.guests ?? 0).toLocaleString(), icon: Users, hint: `${(stats?.checkedIn ?? 0).toLocaleString()} wame-check in` },
    { label: 'Ujumbe uliotumwa', value: ((stats?.sms ?? 0) + (stats?.whatsapp ?? 0)).toLocaleString(), icon: MessageSquare, hint: `SMS ${(stats?.sms ?? 0).toLocaleString()} · WhatsApp ${(stats?.whatsapp ?? 0).toLocaleString()}` },
    { label: 'Michango', value: tzs(stats?.pledged ?? 0), icon: CreditCard, hint: `${tzs(stats?.outstanding ?? 0)} bado` },
    { label: 'Mauzo (invoices)', value: tzs(stats?.billed ?? 0), icon: TrendingUp, hint: `${tzs(stats?.collected ?? 0)} zimelipwa` },
    { label: 'Check-in rate', value: `${stats?.guests ? Math.round(((stats.checkedIn || 0) / stats.guests) * 100) : 0}%`, icon: CheckCircle2, hint: 'wageni waliofika' },
  ];

  const stages = useMemo(() => {
    const seen: string[] = [];
    steps.forEach((s) => { if (!seen.includes(s.stage)) seen.push(s.stage); });
    return seen;
  }, [steps]);

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Playbook ya tukio</p>
          <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Karibu, {user?.user_metadata?.full_name || user?.email}
          </motion.h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fuata hatua kutoka maandalizi hadi ripoti. Buruta kadi kupanga mpangilio unaokufaa.
          </p>
        </div>
        {!!order.length && (
          <Button variant="outline" size="sm" onClick={resetOrder}>
            <RotateCcw className="w-4 h-4 mr-2" /> Rudisha mpangilio wa awali
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-10">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground leading-tight">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{s.hint}</p>
            </motion.div>
          ))}
        </div>
      )}

      {stages.map((stage) => (
        <section key={stage} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">{stage}</h3>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.filter((s) => s.stage === stage).map((m, i) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                draggable
                onDragStart={() => setDragId(m.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(m.id)}
                onClick={() => navigate(m.href)}
                className={`glass-card rounded-xl p-5 cursor-pointer group transition-all hover:shadow-warm ${
                  dragId === m.id ? 'opacity-50 ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 shrink-0 rounded-lg ${m.tone} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{m.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>
                  <GripVertical
                    className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Fungua <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </DashboardLayout>
  );
};

export default Dashboard;
