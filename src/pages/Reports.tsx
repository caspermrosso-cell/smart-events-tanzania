import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, DollarSign, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subMonths, subYears, startOfMonth, eachMonthOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#8b5cf6'];

const PACKAGE_LABELS: Record<string, string> = {
  starter: 'Mwanzo (TZS 150,000)',
  professional: 'Kitaalamu (TZS 350,000)',
  enterprise: 'Biashara (TZS 750,000)',
};

const METHOD_LABELS: Record<string, string> = {
  mpesa: 'M-Pesa',
  bank: 'Bank Transfer',
  cash: 'Cash',
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

  const isLoading = eventsLoading || paymentsLoading;

  // Subscription revenue stats
  const totalSubRevenue = events.reduce((s: number, e: any) => s + Number(e.subscription_amount || 0), 0);
  const totalEvents = events.length;
  const packageBreakdown = events.reduce((acc: Record<string, { count: number; revenue: number }>, e: any) => {
    const pkg = e.subscription_package || 'starter';
    if (!acc[pkg]) acc[pkg] = { count: 0, revenue: 0 };
    acc[pkg].count++;
    acc[pkg].revenue += Number(e.subscription_amount || 0);
    return acc;
  }, {});

  // Payment stats
  const totalPayments = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const paymentsByMethod = payments.reduce((acc: Record<string, number>, p: any) => {
    const m = p.payment_method || 'cash';
    acc[m] = (acc[m] || 0) + Number(p.amount);
    return acc;
  }, {});

  // Monthly payment chart data
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
      const mpesa = monthPayments.filter((p: any) => p.payment_method === 'mpesa').reduce((s: number, p: any) => s + Number(p.amount), 0);
      const bank = monthPayments.filter((p: any) => p.payment_method === 'bank').reduce((s: number, p: any) => s + Number(p.amount), 0);
      const cash = monthPayments.filter((p: any) => p.payment_method === 'cash').reduce((s: number, p: any) => s + Number(p.amount), 0);
      return { name: label, 'M-Pesa': mpesa, Bank: bank, Cash: cash, total: mpesa + bank + cash };
    });
  }, [payments]);

  // Pie chart data for payment methods
  const pieData = Object.entries(paymentsByMethod).map(([method, amount]) => ({
    name: METHOD_LABELS[method] || method,
    value: amount,
  }));

  // Monthly subscription revenue
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

  const grandTotal = totalSubRevenue + totalPayments;

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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="payments">Malipo</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* === PAYMENTS TAB === */}
        <TabsContent value="payments" className="space-y-6">
          {/* Monthly Payment Bar Chart */}
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
                  <Bar dataKey="M-Pesa" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Bank" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Cash" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Method Pie + Summary */}
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

          {/* Recent payments table */}
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
                          p.payment_method === 'mpesa' ? 'bg-green-100 text-green-700' :
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

        {/* === SUBSCRIPTIONS TAB === */}
        <TabsContent value="subscriptions" className="space-y-6">
          {/* Monthly Subscription Line Chart */}
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

          {/* Package Breakdown */}
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

          {/* Events Table */}
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
