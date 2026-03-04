import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, DollarSign, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';

const Reports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<string>('all');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['report-events', period],
    queryFn: async () => {
      let q = supabase.from('events').select('*').order('event_date', { ascending: false });
      if (period === 'month') {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        q = q.gte('event_date', d.toISOString());
      } else if (period === '3months') {
        const d = new Date(); d.setMonth(d.getMonth() - 3);
        q = q.gte('event_date', d.toISOString());
      } else if (period === 'year') {
        const d = new Date(); d.setFullYear(d.getFullYear() - 1);
        q = q.gte('event_date', d.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = events.reduce((s: number, e: any) => s + Number(e.subscription_amount || 0), 0);
  const totalEvents = events.length;
  const packageBreakdown = events.reduce((acc: Record<string, { count: number; revenue: number }>, e: any) => {
    const pkg = e.subscription_package || 'starter';
    if (!acc[pkg]) acc[pkg] = { count: 0, revenue: 0 };
    acc[pkg].count++;
    acc[pkg].revenue += Number(e.subscription_amount || 0);
    return acc;
  }, {});

  const PACKAGE_LABELS: Record<string, string> = {
    starter: 'Mwanzo (TZS 150,000)',
    professional: 'Kitaalamu (TZS 350,000)',
    enterprise: 'Biashara (TZS 750,000)',
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

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Jumla Mapato</div>
          <p className="text-2xl font-bold text-foreground">TZS {totalRevenue.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Calendar className="w-4 h-4" /> Matukio</div>
          <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="w-4 h-4" /> Wastani kwa Tukio</div>
          <p className="text-2xl font-bold text-foreground">TZS {totalEvents > 0 ? Math.round(totalRevenue / totalEvents).toLocaleString() : 0}</p>
        </motion.div>
      </div>

      {/* Package Breakdown */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Mapato kwa Kifurushi</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {Object.entries(packageBreakdown).map(([pkg, data]) => (
            <div key={pkg} className="p-4 rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-1">{PACKAGE_LABELS[pkg] || pkg}</p>
              <p className="text-xl font-bold text-foreground">TZS {data.revenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Matukio {data.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-heading font-semibold text-foreground">Matukio na Mapato</h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Hakuna matukio kwa kipindi hiki</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tukio</TableHead>
                <TableHead>Tarehe</TableHead>
                <TableHead>Kifurushi</TableHead>
                <TableHead>Mapato (TZS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(e.event_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-sm">{PACKAGE_LABELS[e.subscription_package] || e.subscription_package}</TableCell>
                  <TableCell className="font-semibold">TZS {Number(e.subscription_amount || 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
