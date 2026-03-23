import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  sent: { label: 'Imetumwa', variant: 'default', icon: CheckCircle },
  failed: { label: 'Imeshindikana', variant: 'destructive', icon: XCircle },
  scheduled: { label: 'Imepangwa', variant: 'secondary', icon: Clock },
  pending: { label: 'Inasubiri', variant: 'outline', icon: Clock },
};

const SmsDeliveryLogs = () => {
  const { data: logs = [], refetch, isLoading } = useQuery({
    queryKey: ['sms-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-foreground text-lg">Historia ya SMS</h3>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Hakuna SMS zilizotumwa bado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mpokeaji</TableHead>
                <TableHead>Namba</TableHead>
                <TableHead>Ujumbe</TableHead>
                <TableHead>Hali</TableHead>
                <TableHead>SMS</TableHead>
                <TableHead>Tarehe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => {
                const cfg = statusConfig[log.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-foreground">{log.recipient_name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{log.recipient_phone}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{log.message}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{log.sms_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
};

export default SmsDeliveryLogs;
