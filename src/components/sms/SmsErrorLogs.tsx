import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, XCircle, Info, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Beem Africa API error codes mapping
const BEEM_ERROR_CODES: Record<number, { label: string; description: string; fix: string }> = {
  100: { label: 'Success', description: 'Ujumbe umetumwa kwa mafanikio', fix: '' },
  101: { label: 'Internal Server Error', description: 'Tatizo la ndani la Beem server', fix: 'Jaribu tena baadaye au wasiliana na Beem Africa support' },
  102: { label: 'Authentication Failed', description: 'API Key au Secret Key si sahihi', fix: 'Hakikisha BEEM_API_KEY na BEEM_SECRET_KEY ni sahihi' },
  103: { label: 'Insufficient Balance', description: 'Salio la SMS halitoshi kutuma ujumbe', fix: 'Ongeza salio kwenye akaunti yako ya Beem Africa' },
  104: { label: 'Invalid Destination', description: 'Namba ya simu ya mpokeaji si sahihi', fix: 'Hakikisha namba ina format ya 255XXXXXXXXX' },
  105: { label: 'Message Too Long', description: 'Ujumbe ni mrefu kupita kiasi', fix: 'Punguza urefu wa ujumbe (max 1600 characters)' },
  106: { label: 'Invalid Schedule Time', description: 'Muda wa kuratibu si sahihi', fix: 'Tumia format sahihi ya tarehe na saa (YYYY-MM-DD HH:MM)' },
  107: { label: 'Empty Message', description: 'Ujumbe ni tupu', fix: 'Andika ujumbe kabla ya kutuma' },
  108: { label: 'Invalid Encoding', description: 'Encoding si sahihi', fix: 'Tumia encoding 0 kwa ASCII au 8 kwa Unicode' },
  109: { label: 'Invalid Source Address', description: 'Sender ID si sahihi au haijasajiliwa', fix: 'Hakikisha Sender ID "SmartEvents" imesajiliwa kwenye Beem Africa' },
  110: { label: 'No Recipients', description: 'Hakuna wapokeaji wa ujumbe', fix: 'Ongeza angalau mpokeaji mmoja' },
  111: { label: 'Invalid Sender Id', description: 'Sender ID haijasajiliwa au si sahihi kwenye Beem Africa', fix: 'Wasiliana na Beem Africa kusajili Sender ID "SmartEvents"' },
  112: { label: 'Duplicate Request', description: 'Ombi hili tayari limetumwa', fix: 'Subiri dakika chache kabla ya kutuma tena' },
};

const SmsErrorLogs = () => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: failedLogs = [], refetch, isLoading } = useQuery({
    queryKey: ['sms-error-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const getErrorInfo = (log: any) => {
    const beemResponse = log.beem_response;
    if (!beemResponse) return { code: 'N/A', message: 'Hakuna majibu', description: '', fix: '' };

    // Handle nested data structure: { data: { code: 111, message: "..." } }
    const responseData = beemResponse.data || beemResponse;
    const code = responseData.code;
    const message = responseData.message || beemResponse.error || 'Kosa lisilojulikana';

    const knownError = code ? BEEM_ERROR_CODES[code] : null;

    return {
      code: code || 'N/A',
      message,
      description: knownError?.description || message,
      fix: knownError?.fix || 'Wasiliana na Beem Africa support kwa msaada zaidi',
    };
  };

  // Group errors by error code
  const errorSummary = failedLogs.reduce((acc: Record<string, number>, log: any) => {
    const { code } = getErrorInfo(log);
    const key = String(code);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('sms_logs').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['sms-error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sms-logs'] });
      queryClient.invalidateQueries({ queryKey: ['events-sms-allocation'] });
      setSelectedIds(new Set());
      toast.success(`SMS ${ids.length} zilizoshindikana zimefutwa`);
    },
    onError: () => toast.error('Imeshindikana kufuta SMS'),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === failedLogs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(failedLogs.map((l: any) => l.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    deleteMutation.mutate(Array.from(selectedIds));
  };

  const handleDeleteAll = () => {
    if (failedLogs.length === 0) return;
    deleteMutation.mutate(failedLogs.map((l: any) => l.id));
  };

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      {failedLogs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h4 className="font-heading font-semibold text-foreground">Muhtasari wa Makosa</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(errorSummary).map(([code, count]) => {
              const known = BEEM_ERROR_CODES[Number(code)];
              return (
                <div key={code} className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                  <p className="text-sm font-mono font-bold text-destructive">Code: {code}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{known?.label || 'Unknown Error'}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{count} SMS</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Error Code Reference */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
        <Accordion type="single" collapsible>
          <AccordionItem value="reference" className="border-none">
            <AccordionTrigger className="py-0 hover:no-underline">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <span className="font-heading font-semibold text-foreground">Beem API Error Codes Reference</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mt-3 space-y-2">
                {Object.entries(BEEM_ERROR_CODES).filter(([code]) => Number(code) !== 100).map(([code, info]) => (
                  <div key={code} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <Badge variant="outline" className="font-mono shrink-0">{code}</Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">{info.label}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                      <p className="text-xs text-primary mt-0.5">💡 {info.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>

      {/* Error Logs Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-foreground text-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            SMS Zilizoshindikana ({failedLogs.length})
          </h3>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected} disabled={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4 mr-1" />
                Futa ({selectedIds.size})
              </Button>
            )}
            {failedLogs.length > 0 && selectedIds.size === 0 && (
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleDeleteAll} disabled={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4 mr-1" />
                Futa Zote
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {failedLogs.length === 0 ? (
          <div className="text-center py-10">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Hakuna makosa ya SMS yaliyorekodiwa</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mpokeaji</TableHead>
                  <TableHead>Namba</TableHead>
                  <TableHead>Error Code</TableHead>
                  <TableHead>Sababu</TableHead>
                  <TableHead>Suluhisho</TableHead>
                  <TableHead>Tarehe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedLogs.map((log: any) => {
                  const errorInfo = getErrorInfo(log);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-foreground">{log.recipient_name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">{log.recipient_phone}</TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-mono">{errorInfo.code}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-destructive max-w-[200px]">{errorInfo.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px]">{errorInfo.fix}</TableCell>
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
    </div>
  );
};

export default SmsErrorLogs;
