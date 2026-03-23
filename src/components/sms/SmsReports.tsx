import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, CheckCircle, XCircle, Clock, TrendingUp, FileText, FileSpreadsheet, Signal, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Tanzania mobile network prefixes
const NETWORK_PREFIXES: Record<string, { prefixes: string[]; color: string; bg: string }> = {
  Vodacom: { prefixes: ['2557[456]', '25574', '25575', '25576'], color: 'text-red-600', bg: 'bg-red-500' },
  Airtel: { prefixes: ['2556[89]', '25568', '25569', '25578'], color: 'text-red-500', bg: 'bg-red-400' },
  Tigo: { prefixes: ['2556[567]', '25565', '25566', '25567', '25571'], color: 'text-blue-600', bg: 'bg-blue-500' },
  Halotel: { prefixes: ['2556[12]', '25561', '25562'], color: 'text-orange-500', bg: 'bg-orange-500' },
  TTCL: { prefixes: ['2557[23]', '25572', '25573'], color: 'text-green-600', bg: 'bg-green-500' },
  Zantel: { prefixes: ['25577'], color: 'text-purple-600', bg: 'bg-purple-500' },
};

const detectNetwork = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const num = cleaned.startsWith('255') ? cleaned : '255' + cleaned;

  // Vodacom: 074, 075, 076
  if (/^255(74|75|76)/.test(num)) return 'Vodacom';
  // Airtel: 068, 069, 078
  if (/^255(68|69|78)/.test(num)) return 'Airtel';
  // Tigo (Yas): 065, 067, 071
  if (/^255(65|67|71)/.test(num)) return 'Tigo';
  // Halotel: 061, 062
  if (/^255(61|62)/.test(num)) return 'Halotel';
  // TTCL: 072, 073
  if (/^255(72|73)/.test(num)) return 'TTCL';
  // Zantel: 077
  if (/^255(77)/.test(num)) return 'Zantel';
  // Smile: 066
  if (/^255(66)/.test(num)) return 'Smile';

  return 'Nyingine';
};

const NETWORK_COLORS: Record<string, { color: string; bg: string }> = {
  Vodacom: { color: 'text-red-600', bg: 'bg-red-500' },
  Airtel: { color: 'text-red-400', bg: 'bg-red-400' },
  Tigo: { color: 'text-blue-600', bg: 'bg-blue-500' },
  Halotel: { color: 'text-orange-500', bg: 'bg-orange-500' },
  TTCL: { color: 'text-green-600', bg: 'bg-green-500' },
  Zantel: { color: 'text-purple-600', bg: 'bg-purple-500' },
  Smile: { color: 'text-yellow-500', bg: 'bg-yellow-500' },
  Nyingine: { color: 'text-muted-foreground', bg: 'bg-muted-foreground' },
};

const SmsReports = () => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  const { data: events = [] } = useQuery({
    queryKey: ['events-for-sms-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allLogs = [] } = useQuery({
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

  // Filter logs by selected event
  const logs = useMemo(() => {
    if (selectedEventId === 'all') return allLogs;
    if (selectedEventId === 'no-event') return allLogs.filter((l: any) => !l.event_id);
    return allLogs.filter((l: any) => l.event_id === selectedEventId);
  }, [allLogs, selectedEventId]);

  const selectedEventTitle = selectedEventId === 'all'
    ? 'Matukio Yote'
    : selectedEventId === 'no-event'
      ? 'Bila Tukio'
      : events.find((e: any) => e.id === selectedEventId)?.title || '';

  const totalSent = logs.filter((l: any) => l.status === 'sent').length;
  const totalFailed = logs.filter((l: any) => l.status === 'failed').length;
  const totalScheduled = logs.filter((l: any) => l.status === 'scheduled').length;
  const totalSmsUnits = logs.reduce((sum: number, l: any) => sum + (l.sms_count || 1), 0);

  // Network breakdown
  const networkBreakdown = logs.reduce((acc: Record<string, { total: number; sent: number; failed: number }>, log: any) => {
    const network = detectNetwork(log.recipient_phone || '');
    if (!acc[network]) acc[network] = { total: 0, sent: 0, failed: 0 };
    acc[network].total++;
    if (log.status === 'sent') acc[network].sent++;
    if (log.status === 'failed') acc[network].failed++;
    return acc;
  }, {});

  const sortedNetworks = Object.entries(networkBreakdown).sort(([, a], [, b]) => b.total - a.total);
  const maxNetworkCount = Math.max(...sortedNetworks.map(([, v]) => v.total), 1);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sw-TZ', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleDateString('sw-TZ', { day: '2-digit', month: 'long', year: 'numeric' });

      doc.setFontSize(18);
      doc.text(`Smart Events - Ripoti ya SMS`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Tukio: ${selectedEventTitle}`, 14, 28);
      doc.setFontSize(10);
      doc.text(`Tarehe ya Ripoti: ${now}`, 14, 35);
      doc.line(14, 38, 196, 38);

      doc.setFontSize(12);
      doc.text('Muhtasari', 14, 47);
      doc.setFontSize(10);
      doc.text(`SMS Zimetumwa: ${totalSent}`, 14, 55);
      doc.text(`SMS Zimeshindikana: ${totalFailed}`, 14, 62);
      doc.text(`SMS Zimepangwa: ${totalScheduled}`, 14, 69);
      doc.text(`Jumla SMS Units: ${totalSmsUnits}`, 14, 76);

      let y = 89;
      if (balance) {
        const creditBal = Number(balance?.credit_balance || 0);
        doc.text(`Salio: TZS ${creditBal.toLocaleString()}`, 14, 83);
        y = 96;
      }

      // Network breakdown in PDF
      doc.setFontSize(12);
      doc.text('Mgawanyo wa Mitandao', 14, y);
      y += 8;
      doc.setFontSize(9);
      sortedNetworks.forEach(([network, data]) => {
        doc.text(`${network}: ${data.total} SMS (Zimetumwa: ${data.sent}, Zimeshindikana: ${data.failed})`, 14, y);
        y += 6;
      });

      y += 4;
      doc.setFontSize(12);
      doc.text('Historia ya SMS', 14, y);
      y += 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Mpokeaji', 14, y);
      doc.text('Namba', 50, y);
      doc.text('Mtandao', 85, y);
      doc.text('Hali', 110, y);
      doc.text('SMS', 135, y);
      doc.text('Tarehe', 148, y);
      doc.line(14, y + 2, 196, y + 2);
      y += 6;

      doc.setFont('helvetica', 'normal');
      logs.forEach((log: any) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text((log.recipient_name || '-').substring(0, 18), 14, y);
        doc.text(log.recipient_phone || '', 50, y);
        doc.text(detectNetwork(log.recipient_phone || ''), 85, y);
        doc.text(log.status === 'sent' ? 'Imetumwa' : log.status === 'failed' ? 'Imeshindikana' : log.status, 110, y);
        doc.text(String(log.sms_count || 1), 135, y);
        doc.text(formatDate(log.created_at), 148, y);
        y += 6;
      });

      doc.setFontSize(8);
      doc.text('info@smartevents.co.tz | Smart Events Platform', 14, 290);
      doc.save(`SMS_Ripoti_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF imepakuwa!');
    } catch (err) {
      toast.error('Imeshindikana ku-export PDF');
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = async () => {
    setExporting('excel');
    try {
      const summaryData: any[][] = [
        ['Smart Events - Ripoti ya SMS'],
        ['Tarehe ya Ripoti', new Date().toLocaleDateString('sw-TZ')],
        [],
        ['Muhtasari'],
        ['SMS Zimetumwa', totalSent],
        ['SMS Zimeshindikana', totalFailed],
        ['SMS Zimepangwa', totalScheduled],
        ['Jumla SMS Units', totalSmsUnits],
      ];

      if (balance) {
        summaryData.push(['Salio (TZS)', Number(balance?.credit_balance || 0)]);
      }

      summaryData.push([], ['Mgawanyo wa Mitandao'], ['Mtandao', 'Jumla', 'Zimetumwa', 'Zimeshindikana']);
      sortedNetworks.forEach(([network, data]) => {
        summaryData.push([network, data.total, data.sent, data.failed]);
      });

      const logsData = logs.map((log: any) => ({
        'Mpokeaji': log.recipient_name || '-',
        'Namba': log.recipient_phone,
        'Mtandao': detectNetwork(log.recipient_phone || ''),
        'Ujumbe': log.message,
        'Hali': log.status === 'sent' ? 'Imetumwa' : log.status === 'failed' ? 'Imeshindikana' : log.status,
        'SMS Units': log.sms_count || 1,
        'Tarehe': formatDate(log.created_at),
      }));

      const wb = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Muhtasari');

      const logsSheet = XLSX.utils.json_to_sheet(logsData);
      logsSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, logsSheet, 'SMS Logs');

      XLSX.writeFile(wb, `SMS_Ripoti_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel imepakuwa!');
    } catch (err) {
      toast.error('Imeshindikana ku-export Excel');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting !== null || logs.length === 0} className="gap-1.5">
          <FileText className="w-4 h-4" />
          {exporting === 'pdf' ? 'Inapakua...' : 'PDF'}
        </Button>
        <Button variant="outline" size="sm" onClick={exportExcel} disabled={exporting !== null || logs.length === 0} className="gap-1.5">
          <FileSpreadsheet className="w-4 h-4" />
          {exporting === 'excel' ? 'Inapakua...' : 'Excel'}
        </Button>
      </div>

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

      {/* Network Breakdown */}
      {sortedNetworks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Signal className="w-5 h-5 text-primary" />
            <h4 className="font-heading font-semibold text-foreground">Mgawanyo wa Mitandao</h4>
          </div>
          <div className="space-y-3">
            {sortedNetworks.map(([network, data]) => {
              const colors = NETWORK_COLORS[network] || NETWORK_COLORS.Nyingine;
              const percentage = logs.length > 0 ? Math.round((data.total / logs.length) * 100) : 0;
              return (
                <div key={network} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-semibold ${colors.color}`}>{network}</span>
                    <span className="text-muted-foreground">
                      {data.total} SMS ({percentage}%) — 
                      <span className="text-green-500"> ✓{data.sent}</span>
                      {data.failed > 0 && <span className="text-destructive"> ✗{data.failed}</span>}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div className="h-full flex">
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${(data.sent / maxNetworkCount) * 100}%` }}
                      />
                      {data.failed > 0 && (
                        <div
                          className="bg-destructive transition-all"
                          style={{ width: `${(data.failed / maxNetworkCount) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Balance Card */}
      {balance && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
          <h4 className="font-heading font-semibold text-foreground mb-2">Salio la Beem Africa</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Salio (TZS)</p>
              <p className="text-xl font-bold text-primary">TZS {Number(balance?.credit_balance || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SMS Zinazokadiriwa</p>
              <p className="text-xl font-bold text-foreground">~{Math.floor(Number(balance?.credit_balance || 0) / 25).toLocaleString()}</p>
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
