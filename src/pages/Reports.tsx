import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, DollarSign, Wallet, Users, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { format, subMonths, subYears, startOfMonth, eachMonthOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import * as XLSX from 'xlsx';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#8b5cf6'];

const PACKAGE_LABELS: Record<string, string> = {
  starter: 'Mwanzo (TZS 150,000)',
  professional: 'Kitaalamu (TZS 350,000)',
  enterprise: 'Biashara (TZS 750,000)',
};

const METHOD_LABELS: Record<string, string> = {
  selcom: 'Selcom Pesa',
  bank: 'Bank Transfer',
  cash: 'Cash',
  mpesa: 'M-Pesa', // legacy
};

const RSVP_LABELS: Record<string, string> = {
  confirmed: 'Wamethibitisha',
  pending: 'Wanasubiri',
  declined: 'Wamekataa',
};

// Export helpers
const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

import smartEventsLogo from '@/assets/smart-events-logo.png';

const exportToPDF = (title: string, headers: string[], rows: string[][]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  const tableRows = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ddd;padding:8px;font-size:12px">${c}</td>`).join('')}</tr>`).join('');
  printWindow.document.write(`
    <html><head><title>${title}</title><style>
      @page { margin: 20mm 15mm 20mm 15mm; }
      body{font-family:Arial,sans-serif;padding:0;margin:0}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px}
      .header img{height:40px}
      .header .address{text-align:right;font-size:10px;color:#555;line-height:1.5}
      h1{font-size:18px;margin-bottom:4px}
      p.date{color:#666;font-size:12px;margin-bottom:16px}
      table{border-collapse:collapse;width:100%}
      th{border:1px solid #333;padding:8px;background:#f5f5f5;font-size:12px;text-align:left}
      @media print {
        .footer{position:fixed;bottom:0;left:0;right:0;text-align:center;font-size:10px;color:#888;padding:8px 0;border-top:1px solid #ddd}
      }
    </style></head><body>
    <div class="header">
      <img src="${smartEventsLogo}" alt="Smart Events" />
      <div class="address">
        Plot No. 22, Mbezi Beach A, Kinondoni<br/>
        Dar es Salaam, Tanzania<br/>
        info@smartevents.co.tz | www.smartevents.co.tz
      </div>
    </div>
    <h1>${title}</h1>
    <p class="date">Tarehe: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer">
      <script>
        document.currentScript.parentElement.textContent = 'Smart Events Platform | Ukurasa ' + (window.performance ? '1' : '1');
      </script>
    </div>
    <script>
      // Add page numbers via print
      window.onafterprint = function() { window.close(); };
    </script>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const Reports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<string>('all');

  const periodFilter = useMemo(() => {
    if (period === 'month') return subMonths(new Date(), 1);
    if (period === '3months') return subMonths(new Date(), 3);
    if (period === 'year') return subYears(new Date(), 1);
    return null;
  }, [period]);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['report-events', period],
    queryFn: async () => {
      let q = supabase.from('events').select('*').order('event_date', { ascending: false });
      if (periodFilter) q = q.gte('event_date', periodFilter.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['report-payments', period],
    queryFn: async () => {
      let q = supabase.from('payments').select('*, events(title)').order('created_at', { ascending: false });
      if (periodFilter) q = q.gte('created_at', periodFilter.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: guests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['report-guests', period],
    queryFn: async () => {
      let q = supabase.from('guests').select('*, events(title)').order('created_at', { ascending: false });
      if (periodFilter) q = q.gte('created_at', periodFilter.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = eventsLoading || paymentsLoading || guestsLoading;

  const totalSubRevenue = events.reduce((s: number, e: any) => s + Number(e.subscription_amount || 0), 0);
  const totalEvents = events.length;
  const packageBreakdown = events.reduce((acc: Record<string, { count: number; revenue: number }>, e: any) => {
    const pkg = e.subscription_package || 'starter';
    if (!acc[pkg]) acc[pkg] = { count: 0, revenue: 0 };
    acc[pkg].count++;
    acc[pkg].revenue += Number(e.subscription_amount || 0);
    return acc;
  }, {});

  const totalPayments = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const paymentsByMethod = payments.reduce((acc: Record<string, number>, p: any) => {
    const m = p.payment_method || 'cash';
    acc[m] = (acc[m] || 0) + Number(p.amount);
    return acc;
  }, {});

  const monthlyPaymentData = useMemo(() => {
    if (payments.length === 0) return [];
    const sorted = [...payments].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const startDate = startOfMonth(new Date(sorted[0].created_at));
    const endDate = new Date();
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const label = format(month, 'MMM yyyy');
      const monthPayments = payments.filter((p: any) => format(new Date(p.created_at), 'yyyy-MM') === monthStr);
      const selcom = monthPayments.filter((p: any) => p.payment_method === 'selcom' || p.payment_method === 'mpesa').reduce((s: number, p: any) => s + Number(p.amount), 0);
      const bank = monthPayments.filter((p: any) => p.payment_method === 'bank').reduce((s: number, p: any) => s + Number(p.amount), 0);
      const cash = monthPayments.filter((p: any) => p.payment_method === 'cash').reduce((s: number, p: any) => s + Number(p.amount), 0);
      return { name: label, 'Selcom': selcom, Bank: bank, Cash: cash, total: selcom + bank + cash };
    });
  }, [payments]);

  const pieData = Object.entries(paymentsByMethod).map(([method, amount]) => ({
    name: METHOD_LABELS[method] || method,
    value: amount,
  }));

  const monthlySubData = useMemo(() => {
    if (events.length === 0) return [];
    const sorted = [...events].sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    const startDate = startOfMonth(new Date(sorted[0].event_date));
    const endDate = new Date();
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const label = format(month, 'MMM yyyy');
      const revenue = events.filter((e: any) => format(new Date(e.event_date), 'yyyy-MM') === monthStr)
        .reduce((s: number, e: any) => s + Number(e.subscription_amount || 0), 0);
      return { name: label, revenue };
    });
  }, [events]);

  const totalGuests = guests.length;
  const checkedInGuests = guests.filter((g: any) => g.checked_in).length;

  const rsvpBreakdown = guests.reduce((acc: Record<string, number>, g: any) => {
    const status = g.rsvp_status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const rsvpPieData = Object.entries(rsvpBreakdown).map(([status, count]) => ({
    name: RSVP_LABELS[status] || status,
    value: count,
  }));

  const monthlyGuestData = useMemo(() => {
    if (guests.length === 0) return [];
    const sorted = [...guests].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const startDate = startOfMonth(new Date(sorted[0].created_at));
    const endDate = new Date();
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const label = format(month, 'MMM yyyy');
      const monthGuests = guests.filter((g: any) => format(new Date(g.created_at), 'yyyy-MM') === monthStr);
      const total = monthGuests.length;
      const confirmed = monthGuests.filter((g: any) => g.rsvp_status === 'confirmed').length;
      const checkedIn = monthGuests.filter((g: any) => g.checked_in).length;
      return { name: label, Wageni: total, Wamethibitisha: confirmed, 'Check-In': checkedIn };
    });
  }, [guests]);

  const guestsByEvent = useMemo(() => {
    const map: Record<string, { title: string; count: number; checkedIn: number }> = {};
    guests.forEach((g: any) => {
      const eid = g.event_id;
      if (!map[eid]) map[eid] = { title: (g as any).events?.title || 'N/A', count: 0, checkedIn: 0 };
      map[eid].count++;
      if (g.checked_in) map[eid].checkedIn++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [guests]);

  const grandTotal = totalSubRevenue + totalPayments;

  // Export functions
  const handleExportPaymentsExcel = () => {
    const data = payments.map((p: any) => ({
      Tarehe: format(new Date(p.created_at), 'dd/MM/yyyy'),
      Mlipaji: p.payer_name,
      Tukio: p.events?.title || '-',
      Njia: METHOD_LABELS[p.payment_method] || p.payment_method,
      Reference: p.reference || '-',
      'Kiasi (TZS)': Number(p.amount),
    }));
    exportToExcel(data, `Malipo_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportPaymentsPDF = () => {
    const headers = ['Tarehe', 'Mlipaji', 'Tukio', 'Njia', 'Reference', 'Kiasi (TZS)'];
    const rows = payments.map((p: any) => [
      format(new Date(p.created_at), 'dd/MM/yyyy'),
      p.payer_name,
      p.events?.title || '-',
      METHOD_LABELS[p.payment_method] || p.payment_method,
      p.reference || '-',
      `TZS ${Number(p.amount).toLocaleString()}`,
    ]);
    exportToPDF('Ripoti ya Malipo - Smart Events', headers, rows);
  };

  const handleExportGuestsExcel = () => {
    const data = guests.map((g: any) => ({
      'Jina Kamili': g.full_name,
      Tukio: (g as any).events?.title || '-',
      Simu: g.phone || '-',
      Email: g.email || '-',
      RSVP: RSVP_LABELS[g.rsvp_status] || g.rsvp_status,
      'Check-In': g.checked_in ? 'Ndio' : 'Hapana',
      'Check-In Saa': g.checked_in_at ? format(new Date(g.checked_in_at), 'dd/MM/yyyy HH:mm') : '-',
    }));
    exportToExcel(data, `Wageni_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportGuestsPDF = () => {
    const headers = ['Jina', 'Tukio', 'Simu', 'RSVP', 'Check-In'];
    const rows = guests.map((g: any) => [
      g.full_name,
      (g as any).events?.title || '-',
      g.phone || '-',
      RSVP_LABELS[g.rsvp_status] || g.rsvp_status,
      g.checked_in ? 'Ndio' : 'Hapana',
    ]);
    exportToPDF('Ripoti ya Wageni - Smart Events', headers, rows);
  };

  return (
    <DashboardLayout>
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground mb-6">
        Ripoti za Mapato
      </motion.h2>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Yote</SelectItem>
            <SelectItem value="month">Mwezi 1</SelectItem>
            <SelectItem value="3months">Miezi 3</SelectItem>
            <SelectItem value="year">Mwaka 1</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top-level Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Jumla Yote</div>
          <p className="text-2xl font-bold text-foreground">TZS {grandTotal.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="w-4 h-4" /> Mapato Subscriptions</div>
          <p className="text-2xl font-bold text-foreground">TZS {totalSubRevenue.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Wallet className="w-4 h-4" /> Malipo Yaliyopokelewa</div>
          <p className="text-2xl font-bold text-foreground">TZS {totalPayments.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Calendar className="w-4 h-4" /> Matukio</div>
          <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Users className="w-4 h-4" /> Wageni</div>
          <p className="text-2xl font-bold text-foreground">{totalGuests}</p>
          <p className="text-xs text-muted-foreground">{checkedInGuests} wamefika</p>
        </motion.div>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="payments">Malipo</TabsTrigger>
          <TabsTrigger value="guests">Wageni</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* === PAYMENTS TAB === */}
        <TabsContent value="payments" className="space-y-6">
          {/* Export buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleExportPaymentsExcel} className="gap-2" disabled={payments.length === 0}>
              <Download className="w-4 h-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPaymentsPDF} className="gap-2" disabled={payments.length === 0}>
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Malipo kwa Mwezi</h3>
            {monthlyPaymentData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Hakuna data ya malipo</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyPaymentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `TZS ${v.toLocaleString()}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="Selcom" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Bank" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Cash" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Mgawanyo kwa Njia ya Malipo</h3>
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Hakuna data</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `TZS ${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Muhtasari wa Malipo</h3>
              <div className="space-y-3">
                {Object.entries(paymentsByMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <span className="text-sm font-medium text-foreground">{METHOD_LABELS[method] || method}</span>
                    <span className="font-bold text-foreground">TZS {amount.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(paymentsByMethod).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Hakuna malipo bado</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-heading font-semibold text-foreground">Malipo ya Hivi Karibuni</h3>
            </div>
            {paymentsLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16"><Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Hakuna malipo</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarehe</TableHead>
                    <TableHead>Mlipaji</TableHead>
                    <TableHead>Tukio</TableHead>
                    <TableHead>Njia</TableHead>
                    <TableHead className="text-right">Kiasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 20).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{p.payer_name}</TableCell>
                      <TableCell>{p.events?.title || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.payment_method === 'selcom' || p.payment_method === 'mpesa' ? 'bg-green-100 text-green-700' :
                          p.payment_method === 'bank' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{METHOD_LABELS[p.payment_method] || p.payment_method}</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">TZS {Number(p.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* === GUESTS TAB === */}
        <TabsContent value="guests" className="space-y-6">
          {/* Export buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleExportGuestsExcel} className="gap-2" disabled={guests.length === 0}>
              <Download className="w-4 h-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportGuestsPDF} className="gap-2" disabled={guests.length === 0}>
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Mwenendo wa Wageni kwa Mwezi</h3>
            {monthlyGuestData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Hakuna data ya wageni</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyGuestData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="Wageni" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} name="Wageni Wote" />
                  <Area type="monotone" dataKey="Wamethibitisha" stroke="#22c55e" fill="rgba(34,197,94,0.15)" strokeWidth={2} name="Wamethibitisha" />
                  <Area type="monotone" dataKey="Check-In" stroke="#f59e0b" fill="rgba(245,158,11,0.15)" strokeWidth={2} name="Wamefika" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Hali ya RSVP</h3>
              {rsvpPieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Hakuna data</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={rsvpPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {rsvpPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Muhtasari wa Wageni</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm font-medium text-foreground">Jumla Wageni</span>
                  <span className="font-bold text-foreground">{totalGuests}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm font-medium text-foreground">Wamefika (Check-In)</span>
                  <span className="font-bold text-foreground">{checkedInGuests}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm font-medium text-foreground">Kiwango cha Kufika</span>
                  <span className="font-bold text-foreground">{totalGuests > 0 ? `${Math.round((checkedInGuests / totalGuests) * 100)}%` : '0%'}</span>
                </div>
                {Object.entries(rsvpBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <span className="text-sm font-medium text-foreground">{RSVP_LABELS[status] || status}</span>
                    <span className="font-bold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-heading font-semibold text-foreground">Wageni kwa Tukio</h3>
            </div>
            {guestsLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : guestsByEvent.length === 0 ? (
              <div className="text-center py-16"><Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Hakuna wageni</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tukio</TableHead>
                    <TableHead className="text-right">Wageni</TableHead>
                    <TableHead className="text-right">Wamefika</TableHead>
                    <TableHead className="text-right">Kiwango</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guestsByEvent.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">{item.checkedIn}</TableCell>
                      <TableCell className="text-right font-semibold">{item.count > 0 ? `${Math.round((item.checkedIn / item.count) * 100)}%` : '0%'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* === SUBSCRIPTIONS TAB === */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Mapato ya Subscriptions kwa Mwezi</h3>
            {monthlySubData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Hakuna data</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlySubData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `TZS ${v.toLocaleString()}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Mapato" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Mapato kwa Kifurushi</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {Object.entries(packageBreakdown).map(([pkg, data]) => (
                <div key={pkg} className="p-4 rounded-lg border border-border">
                  <p className="text-sm font-medium text-foreground mb-1">{PACKAGE_LABELS[pkg] || pkg}</p>
                  <p className="text-xl font-bold text-foreground">TZS {data.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Matukio {data.count}</p>
                </div>
              ))}
              {Object.keys(packageBreakdown).length === 0 && <p className="text-sm text-muted-foreground col-span-3 text-center py-4">Hakuna data</p>}
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="font-heading font-semibold text-foreground">Matukio na Mapato</h3></div>
            {eventsLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : events.length === 0 ? (
              <div className="text-center py-16"><BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Hakuna matukio</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tukio</TableHead>
                    <TableHead>Tarehe</TableHead>
                    <TableHead>Kifurushi</TableHead>
                    <TableHead className="text-right">Mapato (TZS)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(e.event_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-sm">{PACKAGE_LABELS[e.subscription_package] || e.subscription_package}</TableCell>
                      <TableCell className="text-right font-semibold">TZS {Number(e.subscription_amount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Reports;
