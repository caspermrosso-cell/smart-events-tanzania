import { motion } from 'framer-motion';
import { RefreshCw, Users, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const WhatsAppActiveSessions = () => {
  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-active-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'active-sessions' },
      });
      if (error) throw error;
      return data?.data || [];
    },
    staleTime: 30000,
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Active Sessions (24h window)</h3>
          <Badge variant="secondary">{sessions.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Only users who have messaged your business in the last 24 hours can receive direct messages. For others, use Templates.
      </p>

      {sessions.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No active sessions found</p>
          <p className="text-xs mt-1">Sessions appear when users message your WhatsApp Business number</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Session Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{session.from_addr}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{session.channel}</Badge>
                  </TableCell>
                  <TableCell>{session.username || '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{session.last_message || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.sesssion_start_time ? new Date(session.sesssion_start_time).toLocaleString('en-TZ') : '—'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
};

export default WhatsAppActiveSessions;
