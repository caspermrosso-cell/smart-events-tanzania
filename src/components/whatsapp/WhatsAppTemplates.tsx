import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, FileText, Send, Loader2, Plus, Trash2, CheckCircle2, Clock, XCircle, Upload, Image as ImageIcon, FileUp, Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// ----- helpers -----
const statusMeta: Record<string, { label: string; variant: any; icon: any }> = {
  APPROVED: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  PENDING: { label: 'Pending review', variant: 'secondary', icon: Clock },
  IN_APPEAL: { label: 'In appeal', variant: 'secondary', icon: Clock },
  REJECTED: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  DISABLED: { label: 'Disabled', variant: 'destructive', icon: XCircle },
  PAUSED: { label: 'Paused', variant: 'secondary', icon: Clock },
};

function countPlaceholders(text: string): number {
  const m = text.match(/\{\{\d+\}\}/g);
  if (!m) return 0;
  return new Set(m).size;
}

function getBodyText(components: any[]): string {
  const b = components?.find((c: any) => (c.type || '').toUpperCase() === 'BODY');
  return b?.text || '';
}

function getHeaderText(components: any[]): string {
  const h = components?.find(
    (c: any) => (c.type || '').toUpperCase() === 'HEADER' && (c.format || 'TEXT').toUpperCase() === 'TEXT',
  );
  return h?.text || '';
}

function getHeaderFormat(components: any[]): string {
  const h = components?.find((c: any) => (c.type || '').toUpperCase() === 'HEADER');
  return (h?.format || 'TEXT').toUpperCase();
}

// ----- Create template form -----
interface CreateFormProps {
  onCreated: () => void;
}

const CreateTemplateForm = ({ onCreated }: CreateFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en_US');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('UTILITY');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [bodyExamples, setBodyExamples] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const placeholderCount = useMemo(() => countPlaceholders(bodyText), [bodyText]);

  // keep examples array in sync with placeholders
  useMemo(() => {
    setBodyExamples((prev) => {
      const next = [...prev];
      while (next.length < placeholderCount) next.push('');
      next.length = placeholderCount;
      return next;
    });
  }, [placeholderCount]);

  const nameValid = /^[a-z0-9_]+$/.test(name);

  const submit = async () => {
    if (!nameValid) {
      toast({ title: 'Invalid name', description: 'Use lowercase letters, numbers, and underscores only.', variant: 'destructive' });
      return;
    }
    if (!bodyText.trim()) {
      toast({ title: 'Body is required', variant: 'destructive' });
      return;
    }
    if (placeholderCount > 0 && bodyExamples.some((v) => !v.trim())) {
      toast({ title: 'Provide an example for each placeholder', variant: 'destructive' });
      return;
    }

    const components: any[] = [];
    if (headerText.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
    }
    const body: any = { type: 'BODY', text: bodyText.trim() };
    if (placeholderCount > 0) {
      body.example = { body_text: [bodyExamples.map((s) => s.trim())] };
    }
    components.push(body);
    if (footerText.trim()) {
      components.push({ type: 'FOOTER', text: footerText.trim() });
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'meta-create-template',
          name,
          language,
          category,
          components,
        },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Create failed');
      toast({ title: 'Template submitted', description: 'Meta itafanya review. Utaona status ikibadilika hapa.' });
      onCreated();
      // reset
      setName(''); setHeaderText(''); setBodyText(''); setFooterText(''); setBodyExamples([]);
    } catch (err: any) {
      toast({ title: 'Create failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label>Template name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            placeholder="event_reminder"
          />
          {name && !nameValid && (
            <p className="text-xs text-destructive mt-1">Lowercase, numbers, underscores only</p>
          )}
        </div>
        <div>
          <Label>Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en_US">English (US)</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="sw">Swahili</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="UTILITY">Utility</SelectItem>
              <SelectItem value="MARKETING">Marketing</SelectItem>
              <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Header text (optional)</Label>
        <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Karibu kwa Smart Events" maxLength={60} />
      </div>

      <div>
        <Label>Body</Label>
        <Textarea
          rows={5}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Habari {{1}}, event yako {{2}} ipo tarehe {{3}}."
          maxLength={1024}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Tumia {'{{1}}, {{2}}'}... kwa placeholders. Detected: {placeholderCount}
        </p>
      </div>

      {placeholderCount > 0 && (
        <div className="space-y-2">
          <Label>Placeholder examples (required by Meta)</Label>
          {bodyExamples.map((val, i) => (
            <Input
              key={i}
              value={val}
              placeholder={`Example for {{${i + 1}}}`}
              onChange={(e) => setBodyExamples((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
          ))}
        </div>
      )}

      <div>
        <Label>Footer (optional)</Label>
        <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} maxLength={60} placeholder="Smart Events Tanzania" />
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={submitting || !name || !bodyText.trim()}>
          {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Plus className="w-4 h-4 mr-2" /> Submit for review</>}
        </Button>
      </div>
    </div>
  );
};

// ----- Send template dialog -----
interface SendDialogProps {
  template: any;
  onClose: () => void;
}

interface Recipient { id: string; name: string; phone: string; }

const SendTemplateDialog = ({ template, onClose }: SendDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bodyText = getBodyText(template.components || []);
  const headerText = getHeaderText(template.components || []);
  const bodyPh = countPlaceholders(bodyText);
  const headerPh = countPlaceholders(headerText);

  const [bodyParams, setBodyParams] = useState<string[]>(Array.from({ length: bodyPh }, () => ''));
  const [headerParams, setHeaderParams] = useState<string[]>(Array.from({ length: headerPh }, () => ''));
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

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

  const addRow = () => setRecipients((p) => [...p, { id: `r-${Date.now()}`, name: '', phone: '' }]);
  const removeRow = (id: string) => setRecipients((p) => p.filter((r) => r.id !== id));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      const imported: Recipient[] = rows
        .map((r, i) => ({
          id: `u-${Date.now()}-${i}`,
          name: r.name || r.Name || r.jina || '',
          phone: String(r.phone || r.Phone || r.simu || r.number || ''),
        }))
        .filter((r) => r.phone);
      setRecipients((p) => [...p, ...imported]);
      toast({ title: `${imported.length} contacts imported` });
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const send = async () => {
    const allRecipients = [
      ...guests.filter((g: any) => selectedGuests.includes(g.id)).map((g: any) => ({ name: g.full_name, phone: g.phone })),
      ...recipients.filter((r) => r.phone.trim()),
    ];
    if (allRecipients.length === 0) {
      toast({ title: 'Add at least one recipient', variant: 'destructive' });
      return;
    }
    if (bodyPh > 0 && bodyParams.some((v) => !v.trim())) {
      toast({ title: 'Fill all body parameters', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'meta-send-template',
          template_name: template.name,
          language_code: template.language,
          recipients: allRecipients,
          body_params: bodyParams,
          header_params: headerParams,
          userId: user?.id,
          eventId: selectedEventId || null,
        },
      });
      if (error) throw error;
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
      {(headerText || bodyText) && (
        <div className="bg-muted rounded-lg p-3 text-sm space-y-2">
          {headerText && <p className="font-semibold">{headerText}</p>}
          {bodyText && <p className="whitespace-pre-wrap">{bodyText}</p>}
        </div>
      )}

      {headerPh > 0 && (
        <div className="space-y-2">
          <Label>Header parameters</Label>
          {headerParams.map((v, i) => (
            <Input
              key={i}
              value={v}
              placeholder={`Header {{${i + 1}}}`}
              onChange={(e) => setHeaderParams((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
          ))}
        </div>
      )}

      {bodyPh > 0 && (
        <div className="space-y-2">
          <Label>Body parameters</Label>
          {bodyParams.map((v, i) => (
            <Input
              key={i}
              value={v}
              placeholder={i === 0 ? 'Use {name} to use each recipient name' : `Body {{${i + 1}}}`}
              onChange={(e) => setBodyParams((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
          ))}
          <p className="text-xs text-muted-foreground">
            Tip: andika <code>{'{name}'}</code> katika parameter yoyote ili ibadilishwe na jina la mpokeaji.
          </p>
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

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addRow}><Plus className="w-3 h-3 mr-1" /> Add manually</Button>
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" asChild><span><Upload className="w-3 h-3 mr-1" /> Upload Excel/CSV</span></Button>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {recipients.map((r) => (
        <div key={r.id} className="flex items-center gap-2">
          <Input placeholder="Name" value={r.name} onChange={(e) => setRecipients((p) => p.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))} />
          <Input placeholder="Phone (255...)" value={r.phone} onChange={(e) => setRecipients((p) => p.map((x) => (x.id === r.id ? { ...x, phone: e.target.value } : x)))} />
          <Button variant="ghost" size="icon" onClick={() => removeRow(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

// ----- Main list -----
const WhatsAppTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [sendTpl, setSendTpl] = useState<any | null>(null);

  const { data: templatesData, isLoading, refetch, error } = useQuery({
    queryKey: ['meta-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'meta-list-templates' },
      });
      if (error) throw new Error(error.message);
      if (data?.success === false) throw new Error(data?.error || 'Failed to load templates');
      return data?.data || { data: [] };
    },
    retry: false,
    staleTime: 30000,
  });

  const templates: any[] = templatesData?.data || [];

  const deleteTemplate = async (t: any) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'meta-delete-template', name: t.name, hsm_id: t.id },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error);
      toast({ title: 'Template deleted' });
      queryClient.invalidateQueries({ queryKey: ['meta-templates'] });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">WhatsApp Templates (Meta)</h3>
          <Badge variant="secondary">{templates.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New template</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create WhatsApp template</DialogTitle>
              </DialogHeader>
              <CreateTemplateForm onCreated={() => { setCreateOpen(false); refetch(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-normal">
            User journey: <span className="font-medium text-foreground">1. Unda template</span> →
            <span className="font-medium text-foreground"> 2. Meta i-approve</span> →
            <span className="font-medium text-foreground"> 3. Tuma kwa recipients</span>
          </CardTitle>
        </CardHeader>
      </Card>

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
          <p className="text-xs mt-1">Bofya "New template" kuanza</p>
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
                const cfg = statusMeta[tpl.status] || { label: tpl.status, variant: 'outline', icon: Clock };
                const StatusIcon = cfg.icon;
                const bodyText = getBodyText(tpl.components || []);
                const approved = tpl.status === 'APPROVED';
                return (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">{tpl.name}</TableCell>
                    <TableCell><Badge variant="outline">{tpl.category}</Badge></TableCell>
                    <TableCell>{tpl.language}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </Badge>
                      {tpl.rejected_reason && tpl.rejected_reason !== 'NONE' && (
                        <p className="text-xs text-destructive mt-1">{tpl.rejected_reason}</p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">{bodyText}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant={approved ? 'default' : 'outline'}
                        size="sm"
                        disabled={!approved}
                        onClick={() => setSendTpl(tpl)}
                        title={approved ? 'Send' : 'Available after approval'}
                      >
                        <Send className="w-3 h-3 mr-1" /> Send
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTemplate(tpl)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
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