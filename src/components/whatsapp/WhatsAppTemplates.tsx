import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, FileText, Send, Loader2, Plus, Trash2, CheckCircle2, Clock, XCircle,
  Upload, Image as ImageIcon, FileUp, Download, ExternalLink, Info, DownloadCloud,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const DEFAULT_FROM_ADDR = '255736670202';

// Beem statuses per Moja docs: pending, enabled, approved, rejected, failed
const statusMeta: Record<string, { label: string; variant: any; icon: any }> = {
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  enabled: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  pending: { label: 'Pending review', variant: 'secondary', icon: Clock },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
};

function countPlaceholders(text: string): number {
  const m = (text || '').match(/\{\{\d+\}\}/g);
  if (!m) return 0;
  return new Set(m).size;
}

function isApproved(status: string) {
  const s = String(status || '').toLowerCase();
  return s === 'approved' || s === 'enabled';
}

interface Recipient {
  id: string;
  name: string;
  phone: string;
  vars?: string[];
}

// ---------- Send dialog ----------
const SendTemplateDialog = ({ template, onClose }: { template: any; onClose: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bodyText: string = template.content || '';
  const bodyPh = countPlaceholders(bodyText);
  const requiresMedia = !!template.mediaUrl || ['image', 'document', 'video'].includes(String(template.type || '').toLowerCase());

  const [fromAddr, setFromAddr] = useState(DEFAULT_FROM_ADDR);
  const [defaultParams, setDefaultParams] = useState<string[]>(Array.from({ length: bodyPh }, () => ''));
  const [mediaUrl, setMediaUrl] = useState<string>(template.mediaUrl || '');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [perRecipientVars, setPerRecipientVars] = useState(false);
  const [sending, setSending] = useState(false);
  const mediaRef = useRef<HTMLInputElement>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['events-for-tpl'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('id,title,event_date').order('event_date', { ascending: false });
      return data || [];
    },
  });
  const { data: guests = [] } = useQuery({
    queryKey: ['guests-for-tpl', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data } = await supabase.from('guests').select('id,full_name,phone').eq('event_id', selectedEventId);
      return (data || []).filter((g: any) => g.phone);
    },
    enabled: !!selectedEventId,
  });

  const addRow = () => setRecipients((p) => [...p, { id: `r-${Date.now()}`, name: '', phone: '', vars: Array(bodyPh).fill('') }]);
  const removeRow = (id: string) => setRecipients((p) => p.filter((r) => r.id !== id));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const imported: Recipient[] = rows.map((r, i) => {
        const vars: string[] = [];
        for (let n = 1; n <= bodyPh; n++) {
          vars.push(String(r[`var${n}`] ?? r[`{{${n}}}`] ?? ''));
        }
        return {
          id: `u-${Date.now()}-${i}`,
          name: r.name || r.Name || r.jina || '',
          phone: String(r.phone || r.Phone || r.simu || r.number || ''),
          vars,
        };
      }).filter((r) => r.phone);
      setRecipients((p) => [...p, ...imported]);
      toast({ title: `${imported.length} contacts imported` });
      if (bodyPh > 0) setPerRecipientVars(true);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const downloadRecipientTemplate = () => {
    const headers: any = { name: 'Jina Mfano', phone: '2557XXXXXXXX' };
    for (let i = 1; i <= bodyPh; i++) headers[`var${i}`] = `Thamani ya {{${i}}}`;
    const ws = XLSX.utils.json_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recipients');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `whatsapp_recipients_${template.name}.xlsx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user?.id || 'anon'}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('whatsapp-media').upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('whatsapp-media').getPublicUrl(path);
      setMediaUrl(data.publicUrl);
      toast({ title: 'Media uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingMedia(false);
      if (mediaRef.current) mediaRef.current.value = '';
    }
  };

  const send = async () => {
    const guestRecipients = guests
      .filter((g: any) => selectedGuests.includes(g.id))
      .map((g: any) => ({ name: g.full_name, phone: g.phone, params: [] as string[] }));
    const manualRecipients = recipients
      .filter((r) => r.phone.trim())
      .map((r) => ({
        name: r.name,
        phone: r.phone,
        params: perRecipientVars && bodyPh > 0
          ? (r.vars || []).map((v, i) => (v && v.trim()) || defaultParams[i] || '')
          : [],
      }));
    const allRecipients = [...guestRecipients, ...manualRecipients];
    if (allRecipients.length === 0) {
      toast({ title: 'Add at least one recipient', variant: 'destructive' });
      return;
    }
    if (bodyPh > 0 && !perRecipientVars && defaultParams.some((v) => !v.trim() && v !== '{name}')) {
      // allow {name} placeholder to pass through
      const missing = defaultParams.some((v) => !v.trim());
      if (missing) {
        toast({ title: 'Fill all body parameters', variant: 'destructive' });
        return;
      }
    }
    if (requiresMedia && !mediaUrl) {
      toast({ title: 'Media URL is required for this template', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'send-template-bulk',
          from_addr: fromAddr,
          template_id: template.id,
          template_name: template.name,
          mediaUrl: mediaUrl || undefined,
          default_params: perRecipientVars ? [] : defaultParams,
          recipients: allRecipients,
          userId: user?.id,
          eventId: selectedEventId || null,
        },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Send failed');
      const s = data?.summary || {};
      toast({ title: `Sent: ${s.sent || 0}, Failed: ${s.failed || 0}` });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
      onClose();
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {(template.header || bodyText || template.footer) && (
        <div className="bg-muted rounded-lg p-3 text-sm space-y-2">
          {template.header && <p className="font-semibold">{template.header}</p>}
          {bodyText && <p className="whitespace-pre-wrap">{bodyText}</p>}
          {template.footer && <p className="text-xs text-muted-foreground">{template.footer}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>From (Beem WhatsApp number)</Label>
          <Input value={fromAddr} onChange={(e) => setFromAddr(e.target.value)} placeholder="2557XXXXXXXX" />
        </div>
        <div>
          <Label>Language</Label>
          <Input value={template.language || ''} disabled />
        </div>
      </div>

      {requiresMedia && (
        <div className="space-y-2 border rounded-lg p-3 bg-accent/5">
          <Label className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Media URL (required)
          </Label>
          <div className="flex items-center gap-2">
            <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
            <input ref={mediaRef} type="file" className="hidden" onChange={handleMediaUpload} />
            <Button variant="outline" size="sm" onClick={() => mediaRef.current?.click()} disabled={uploadingMedia}>
              {uploadingMedia ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Upload className="w-3 h-3 mr-1" /> Upload</>}
            </Button>
          </div>
        </div>
      )}

      {bodyPh > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Body variables ({bodyPh})</Label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={perRecipientVars} onCheckedChange={(v) => setPerRecipientVars(!!v)} />
              Different values per recipient
            </label>
          </div>
          {!perRecipientVars && defaultParams.map((v, i) => (
            <Input
              key={i}
              value={v}
              placeholder={i === 0 ? 'Tumia {name} kubadilishwa na jina la mpokeaji' : `{{${i + 1}}}`}
              onChange={(e) => setDefaultParams((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
          ))}
        </div>
      )}

      <div>
        <Label>Chagua event (optional)</Label>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger><SelectValue placeholder="Chagua event..." /></SelectTrigger>
          <SelectContent>
            {events.map((ev: any) => (
              <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {guests.length > 0 && (
        <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Checkbox
              checked={selectedGuests.length === guests.length && guests.length > 0}
              onCheckedChange={() => setSelectedGuests(selectedGuests.length === guests.length ? [] : guests.map((g: any) => g.id))}
            />
            <span className="text-sm font-medium">Select all ({guests.length})</span>
          </div>
          {guests.map((g: any) => (
            <div key={g.id} className="flex items-center gap-2">
              <Checkbox
                checked={selectedGuests.includes(g.id)}
                onCheckedChange={() => setSelectedGuests((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))}
              />
              <span className="text-sm">{g.full_name} — {g.phone}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={addRow}><Plus className="w-3 h-3 mr-1" /> Add manually</Button>
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" asChild><span><Upload className="w-3 h-3 mr-1" /> Upload Excel/CSV</span></Button>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
        </label>
        {bodyPh > 0 && (
          <Button variant="ghost" size="sm" onClick={downloadRecipientTemplate}>
            <Download className="w-3 h-3 mr-1" /> Pakua Template
          </Button>
        )}
      </div>

      {recipients.map((r) => (
        <div key={r.id} className="space-y-2 border rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Input placeholder="Name" value={r.name} onChange={(e) => setRecipients((p) => p.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))} />
            <Input placeholder="Phone (255...)" value={r.phone} onChange={(e) => setRecipients((p) => p.map((x) => (x.id === r.id ? { ...x, phone: e.target.value } : x)))} />
            <Button variant="ghost" size="icon" onClick={() => removeRow(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
          {perRecipientVars && bodyPh > 0 && (
            <div className="grid grid-cols-2 gap-2 pl-1">
              {Array.from({ length: bodyPh }).map((_, i) => (
                <Input
                  key={i}
                  placeholder={`{{${i + 1}}}`}
                  value={r.vars?.[i] || ''}
                  onChange={(e) => setRecipients((p) => p.map((x) => {
                    if (x.id !== r.id) return x;
                    const vars = [...(x.vars || Array(bodyPh).fill(''))];
                    vars[i] = e.target.value;
                    return { ...x, vars };
                  }))}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={send} disabled={sending}>
          {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send</>}
        </Button>
      </DialogFooter>
    </div>
  );
};

// ---------- Main list ----------
const WhatsAppTemplates = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sendTpl, setSendTpl] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [q, setQ] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!user?.id) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'import-templates', userId: user.id },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Import failed');
      toast({
        title: 'Import complete',
        description: `Imported ${data?.imported || 0} approved templates (of ${data?.total_fetched || 0} fetched).`,
      });
      queryClient.invalidateQueries({ queryKey: ['beem-templates'] });
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const { data: templatesData, isLoading, refetch, error } = useQuery({
    queryKey: ['beem-templates', statusFilter, categoryFilter, q],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'templates',
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          q: q || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.warning) toast({ title: 'Beem notice', description: data.warning });
      return data?.data || { data: [], pagination: {} };
    },
    retry: false,
    staleTime: 30000,
  });

  const templates: any[] = templatesData?.data || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">WhatsApp Templates (Beem Moja)</h3>
          <Badge variant="secondary">{templates.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleImport} disabled={importing}>
            {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-1" />}
            Import Approved
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" asChild>
            <a href="https://login.beem.africa" target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" /> Unda kwenye Beem
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-normal flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <span>
              Kwa mujibu wa Moja API, templates hutengenezwa kwenye <strong>Beem Engage Portal / Moja Settings</strong>.
              Baada ya Beem/Meta ku-approve, zitaonekana hapa na utaweza kuzituma kwa recipients wako.
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input placeholder="Search (name, content)" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="MARKETING">Marketing</SelectItem>
            <SelectItem value="UTILITY">Utility</SelectItem>
            <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Hakuna templates bado</p>
          <p className="text-xs mt-1">Tengeneza kwenye Beem Portal, kisha refresh hapa</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Body</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((tpl: any) => {
                const statusKey = String(tpl.status || '').toLowerCase();
                const cfg = statusMeta[statusKey] || { label: tpl.status || 'unknown', variant: 'outline', icon: Clock };
                const StatusIcon = cfg.icon;
                const approved = isApproved(tpl.status);
                return (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">{tpl.name}</TableCell>
                    <TableCell><Badge variant="outline">{tpl.category}</Badge></TableCell>
                    <TableCell>{tpl.language}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">{tpl.content}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={approved ? 'default' : 'outline'}
                        size="sm"
                        disabled={!approved}
                        onClick={() => setSendTpl(tpl)}
                        title={approved ? 'Send' : 'Available after approval'}
                      >
                        <Send className="w-3 h-3 mr-1" /> Send
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!sendTpl} onOpenChange={(o) => !o && setSendTpl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send template: {sendTpl?.name}</DialogTitle>
          </DialogHeader>
          {sendTpl && <SendTemplateDialog template={sendTpl} onClose={() => setSendTpl(null)} />}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default WhatsAppTemplates;