import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, CheckCircle, XCircle, Clock, TrendingUp, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const SmsReports = () => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

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

      // Header
      doc.setFontSize(18);
      doc.text('Smart Events - Ripoti ya SMS', 14, 20);
      doc.setFontSize(10);
      doc.text(`Tarehe ya Ripoti: ${now}`, 14, 28);
      doc.line(14, 31, 196, 31);

      // Summary stats
      doc.setFontSize(12);
      doc.text('Muhtasari', 14, 40);
      doc.setFontSize(10);
      doc.text(`SMS Zimetumwa: ${totalSent}`, 14, 48);
      doc.text(`SMS Zimeshindikana: ${totalFailed}`, 14, 55);
      doc.text(`SMS Zimepangwa: ${totalScheduled}`, 14, 62);
      doc.text(`Jumla SMS Units: ${totalSmsUnits}`, 14, 69);

      if (balance) {
        const creditBal = Number(balance?.credit_balance || 0);
        doc.text(`Salio: TZS ${creditBal.toLocaleString()}`, 14, 76);
        doc.text(`SMS Zinazokadiriwa: ~${Math.floor(creditBal / 25).toLocaleString()}`, 14, 83);
      }

      // Table header
      let y = balance ? 96 : 82;
      doc.setFontSize(12);
      doc.text('Historia ya SMS', 14, y);
      y += 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Mpokeaji', 14, y);
      doc.text('Namba', 55, y);
      doc.text('Hali', 95, y);
      doc.text('SMS', 120, y);
      doc.text('Tarehe', 135, y);
      doc.line(14, y + 2, 196, y + 2);
      y += 6;

      doc.setFont('helvetica', 'normal');
      logs.forEach((log: any) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text((log.recipient_name || '-').substring(0, 20), 14, y);
        doc.text(log.recipient_phone || '', 55, y);
        doc.text(log.status === 'sent' ? 'Imetumwa' : log.status === 'failed' ? 'Imeshindikana' : log.status, 95, y);
        doc.text(String(log.sms_count || 1), 120, y);
        doc.text(formatDate(log.created_at), 135, y);
        y += 6;
      });

      // Footer
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
      // Summary sheet data
      const summaryData = [
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
        summaryData.push(['SMS Zinazokadiriwa', Math.floor(Number(balance?.credit_balance || 0) / 25)]);
      }

      // Logs sheet data
      const logsData = logs.map((log: any) => ({
        'Mpokeaji': log.recipient_name || '-',
        'Namba': log.recipient_phone,
        'Ujumbe': log.message,
        'Hali': log.status === 'sent' ? 'Imetumwa' : log.status === 'failed' ? 'Imeshindikana' : log.status,
        'SMS Units': log.sms_count || 1,
        'Tarehe': formatDate(log.created_at),
      }));

      const wb = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Muhtasari');

      const logsSheet = XLSX.utils.json_to_sheet(logsData);
      logsSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 22 }];
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
        <Button
          variant="outline"
          size="sm"
          onClick={exportPDF}
          disabled={exporting !== null || logs.length === 0}
          className="gap-1.5"
        >
          <FileText className="w-4 h-4" />
          {exporting === 'pdf' ? 'Inapakua...' : 'PDF'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportExcel}
          disabled={exporting !== null || logs.length === 0}
          className="gap-1.5"
        >
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
