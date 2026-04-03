import { motion } from 'framer-motion';
import { RefreshCw, History, Clock, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary'; icon: any }> = {
  sent: { label: 'Sent', variant: 'default', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
};

const WhatsAppLogs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('whatsapp_logs').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
      setSelected([]);
      toast({ title: 'Logs deleted' });
    },
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === logs.length) setSelected([]);
    else setSelected(logs.map((l: any) => l.id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">WhatsApp Delivery Logs</h3>
          <Badge variant="secondary">{logs.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selected)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete ({selected.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No WhatsApp messages sent yet</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selected.length === logs.length && logs.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => {
                const config = statusConfig[log.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <TableRow key={log.id}>
                    <TableCell><Checkbox checked={selected.includes(log.id)} onCheckedChange={() => toggleSelect(log.id)} /></TableCell>
                    <TableCell className="font-medium">{log.recipient_name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.recipient_phone}</TableCell>
                    <TableCell><Badge variant="outline">{log.channel}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{log.message_type}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {log.template_name ? `Template: ${log.template_name}` : log.message_content || log.media_url || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" /> {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('en-TZ')}
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

export default WhatsAppLogs;
