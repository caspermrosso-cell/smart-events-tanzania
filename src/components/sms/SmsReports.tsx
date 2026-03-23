import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const SmsReports = () => {
  const { user } = useAuth();

  const { data: logs = [] } = useQuery({
    queryKey: ['sms-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: balance } = useQuery({
    queryKey: ['beem-balance'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { action: 'balance' },
      });
      if (error) throw error;
      return data?.data?.data;
    },
    staleTime: 60000,
  });

  const totalSent = logs.filter((l: any) => l.status === 'sent').length;
  const totalFailed = logs.filter((l: any) => l.status === 'failed').length;
  const totalScheduled = logs.filter((l: any) => l.status === 'scheduled').length;
  const totalSmsUnits = logs.reduce((sum: number, l: any) => sum + (l.sms_count || 1), 0);

  // Group by date for chart-like display
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailyCounts = last7Days.map(date => {
    const count = logs.filter((l: any) => l.created_at?.startsWith(date) && l.status === 'sent').length;
    return { date, count };
  });

  const maxCount = Math.max(...dailyCounts.map(d => d.count), 1);

  const stats = [
    { label: 'Zimetumwa', value: totalSent, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Zimeshindikana', value: totalFailed, icon: XCircle, color: 'text-destructive' },
    { label: 'Zimepangwa', value: totalScheduled, icon: Clock, color: 'text-amber-500' },
    { label: 'SMS Units', value: totalSmsUnits, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 text-center"
          >
            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Balance Card */}
      {balance && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <h4 className="font-heading font-semibold text-foreground mb-2">Salio la Beem Africa</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Salio (TZS)</p>
              <p className="text-xl font-bold text-primary">{Number(balance?.credit_balance || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SMS Zinazokadiriwa</p>
              <p className="text-xl font-bold text-foreground">~{Math.floor(Number(balance?.credit_balance || 0) / 25)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Daily Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h4 className="font-heading font-semibold text-foreground">SMS za Siku 7 Zilizopita</h4>
        </div>
        <div className="flex items-end gap-2 h-32">
          {dailyCounts.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-foreground">{d.count}</span>
              <div
                className="w-full bg-primary/80 rounded-t transition-all"
                style={{ height: `${Math.max((d.count / maxCount) * 100, 4)}%` }}
              />
              <span className="text-[10px] text-muted-foreground">{new Date(d.date).toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short' })}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SmsReports;
