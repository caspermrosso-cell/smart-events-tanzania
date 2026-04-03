import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, FileText, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  enabled: 'default',
  pending: 'secondary',
  rejected: 'destructive',
  failed: 'destructive',
};

const emptyTemplatesResponse = {
  data: [],
  pagination: {},
  warning: '',
};

const WhatsAppTemplates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sendingTemplateId, setSendingTemplateId] = useState<number | null>(null);
  const [sendTemplateName, setSendTemplateName] = useState('');
  const [sendFromAddr, setSendFromAddr] = useState('');
  const [sendPhones, setSendPhones] = useState('');
  const [sendParams, setSendParams] = useState('');
  const [sendMediaUrl, setSendMediaUrl] = useState('');
  const [sending, setSending] = useState(false);

  const normalizedCategory = filterCategory === 'all' ? undefined : filterCategory;
  const normalizedStatus = filterStatus === 'all' ? undefined : filterStatus;

  const { data: templatesData, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-templates', normalizedCategory, normalizedStatus, searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'templates',
          category: normalizedCategory,
          status: normalizedStatus,
          q: searchQuery || undefined,
        },
      });

      if (error) {
        return {
          ...emptyTemplatesResponse,
          warning: error.message,
        };
      }

      return {
        data: data?.data?.data || [],
        pagination: data?.data?.pagination || {},
        warning: data?.warning || '',
      };
    },
    staleTime: 60000,
    retry: false,
  });

  const templates = templatesData?.data || [];
  const pagination = templatesData?.pagination || {};
  const warning = templatesData?.warning || '';

  const handleSendTemplate = async () => {
    if (!sendingTemplateId || !sendFromAddr || !sendPhones.trim()) return;
    setSending(true);

    try {
      const phones = sendPhones.split(',').map((p) => p.trim()).filter(Boolean);
      const paramsList = sendParams ? sendParams.split(',').map((p) => p.trim()) : [];

      const destination_addr = phones.map((phone) => ({
        phoneNumber: phone.replace(/[^0-9]/g, '').startsWith('0')
          ? '255' + phone.replace(/[^0-9]/g, '').substring(1)
          : phone.replace(/[^0-9]/g, ''),
        params: paramsList,
      }));

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'send-template',
          from_addr: sendFromAddr,
          destination_addr,
          channel: 'whatsapp',
          content: sendMediaUrl ? { mediaUrl: sendMediaUrl } : {},
          messageTemplateData: { id: sendingTemplateId },
          templateName: sendTemplateName,
          userId: user?.id,
        },
      });

      if (error) throw error;

      const valid = data?.data?.validation?.validCounts || 0;
      const invalid = data?.data?.validation?.invalidCounts || 0;
      toast({ title: `Template sent! Valid: ${valid}, Invalid: ${invalid}` });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
      setSendingTemplateId(null);
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">WhatsApp Templates</h3>
          {pagination.totalItems && <Badge variant="secondary">{pagination.totalItems} total</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {warning && (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {warning}
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No templates found</p>
          <p className="text-xs mt-1">Create templates via the Beem Engage Portal or Moja</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((tpl: any) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-mono text-xs">{tpl.id}</TableCell>
                  <TableCell className="font-medium">{tpl.name}</TableCell>
                  <TableCell><Badge variant="outline">{tpl.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={statusColors[tpl.status] as any || 'secondary'}>{tpl.status}</Badge>
                  </TableCell>
                  <TableCell>{tpl.language || '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{tpl.content || '—'}</TableCell>
                  <TableCell>
                    {tpl.status === 'enabled' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => { setSendingTemplateId(tpl.id); setSendTemplateName(tpl.name); }}>
                            <Send className="w-3 h-3 mr-1" /> Send
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Template: {tpl.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {tpl.content && (
                              <div className="bg-muted rounded-lg p-3 text-sm">{tpl.content}</div>
                            )}
                            <div>
                              <Label>From (WhatsApp Business Number)</Label>
                              <Input value={sendFromAddr} onChange={(e) => setSendFromAddr(e.target.value)} placeholder="255701000000" />
                            </div>
                            <div>
                              <Label>Phone Numbers (comma separated)</Label>
                              <Input value={sendPhones} onChange={(e) => setSendPhones(e.target.value)} placeholder="255701000001, 255701000002" />
                            </div>
                            <div>
                              <Label>Parameters (comma separated, for {'{{1}}, {{2}}'} etc.)</Label>
                              <Input value={sendParams} onChange={(e) => setSendParams(e.target.value)} placeholder="John, Event Name" />
                            </div>
                            {tpl.mediaUrl && (
                              <div>
                                <Label>Media URL (optional)</Label>
                                <Input value={sendMediaUrl} onChange={(e) => setSendMediaUrl(e.target.value)} placeholder="https://..." />
                              </div>
                            )}
                            <Button onClick={handleSendTemplate} disabled={sending || !sendFromAddr || !sendPhones.trim()} className="w-full">
                              {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send Template</>}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
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

export default WhatsAppTemplates;
