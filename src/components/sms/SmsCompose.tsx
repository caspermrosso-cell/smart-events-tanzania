import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Clock, Plus, X, Phone, MessageSquare, Upload, FileSpreadsheet, AlertTriangle, ShieldCheck, Download, BadgeCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import ContactPicker from '@/components/ContactPicker';
import SmsTemplateManager from '@/components/sms/SmsTemplateManager';
import SmsPreviewDialog, { PreviewRecipient } from '@/components/sms/SmsPreviewDialog';

const SMS_TEMPLATES = [
  { id: 'invite', label: 'Mwaliko', template: 'Habari {name}, unaalikwa kwenye {event} tarehe {date}. Karibu sana!' },
  { id: 'reminder', label: 'Kikumbusho', template: 'Habari {name}, tunakukumbusha kuhusu {event} tarehe {date}. Tutakutarajia!' },
  { id: 'thank', label: 'Shukrani', template: 'Habari {name}, asante sana kwa mchango wako wa TZS {amount} kwa {event}. Mungu akubariki!' },
  { id: 'custom', label: 'Ujumbe Maalum', template: '' },
];

interface ManualRecipient {
  id: string;
  name: string;
  phone: string;
  vars?: Record<string, string>;
}

const SmsCompose = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceUnits, setInvoiceUnits] = useState(0);

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [manualRecipients, setManualRecipients] = useState<ManualRecipient[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newVars, setNewVars] = useState<Record<string, string>>({});
  const bulkFileRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [excludePaid, setExcludePaid] = useState(false);

  // Detect custom {variable} tokens in message (excluding built-ins)
  const BUILTIN_VARS = ['name', 'event', 'date'];
  const detectedVars = useMemo(() => {
    const matches = message.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    const names = matches.map((m) => m.slice(1, -1));
    return [...new Set(names)].filter((v) => !BUILTIN_VARS.includes(v));
  }, [message]);

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        const imported: ManualRecipient[] = [];
        rows.forEach((row, i) => {
          const name = String(row['Jina'] || row['Name'] || row['jina'] || row['name'] || '').trim();
          const phone = String(row['Simu'] || row['Phone'] || row['simu'] || row['phone'] || row['Namba'] || row['namba'] || '').trim();
          if (phone.length >= 9) {
            const vars: Record<string, string> = {};
            Object.keys(row).forEach((k) => {
              const key = k.trim();
              const lower = key.toLowerCase();
              if (['jina', 'name', 'simu', 'phone', 'namba'].includes(lower)) return;
              vars[key] = String(row[k] ?? '').trim();
            });
            imported.push({ id: `bulk-${Date.now()}-${i}`, name: name || 'Mgeni', phone, vars });
          }
        });

        if (imported.length === 0) {
          toast.error('Hakuna namba sahihi zilizopatikana. Hakikisha safu wima zina "Jina" na "Simu".');
          return;
        }
        setManualRecipients(prev => [...prev, ...imported]);
        toast.success(`Wapokeaji ${imported.length} wameongezwa kutoka kwenye faili`);
      } catch {
        toast.error('Imeshindikana kusoma faili. Jaribu tena.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (bulkFileRef.current) bulkFileRef.current.value = '';
  };

  const downloadBulkTemplate = () => {
    try {
      if (!message || message.trim().length === 0) {
        toast.error('Chagua au andika template kwanza kabla ya kupakua orodha');
        return;
      }
      // Build columns dynamically from the selected/typed template's variables
      const varCols = [...detectedVars]; // custom {vars}
      const headers = ['Jina', 'Simu', ...varCols];
      const sample1: (string | number)[] = ['Ali Mohamed', '0712345678'];
      const sample2: (string | number)[] = ['Fatma Hassan', '0654321098'];
      varCols.forEach((v) => {
        sample1.push(`Mfano ${v} 1`);
        sample2.push(`Mfano ${v} 2`);
      });
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        sample1,
        sample2,
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Wapokeaji');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sms_wapokeaji_${varCols.length ? varCols.join('_') : 'basic'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(
        varCols.length
          ? `Template yenye variables ${varCols.length} imepakuliwa`
          : 'Template ya msingi imepakuliwa (hakuna variables kwenye ujumbe)'
      );
    } catch (err: any) {
      console.error('Template download failed', err);
      toast.error('Imeshindikana kupakua template: ' + (err?.message || 'Hitilafu'));
    }
  };

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title, event_date, sms_allocation').order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get SMS used count for selected event
  const { data: eventSmsUsed = 0 } = useQuery({
    queryKey: ['event-sms-used', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return 0;
      const { data, error } = await supabase
        .from('sms_logs')
        .select('sms_count')
        .eq('event_id', selectedEvent)
        .eq('status', 'sent');
      if (error) throw error;
      return (data || []).reduce((sum: number, l: any) => sum + (l.sms_count || 1), 0);
    },
    enabled: !!selectedEvent,
  });

  const selectedEventData = events.find((e: any) => e.id === selectedEvent);
  const eventAllocation = selectedEventData?.sms_allocation || 0;
  const eventSmsRemaining = Math.max(eventAllocation - eventSmsUsed, 0);

  const { data: guests = [] } = useQuery({
    queryKey: ['sms-guests', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const { data, error } = await supabase.from('guests').select('id, full_name, phone').eq('event_id', selectedEvent).not('phone', 'is', null);
      if (error) throw error;
      return data.filter((g: any) => g.phone && g.phone.length > 4);
    },
    enabled: !!selectedEvent,
  });

  // Fetch pledges for selected event to identify guests who have fully paid
  const { data: eventPledges = [] } = useQuery({
    queryKey: ['sms-event-pledges', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const { data, error } = await supabase.from('pledges').select('guest_id, amount, paid_amount, status').eq('event_id', selectedEvent);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEvent,
  });

  const paidGuestIds = useMemo(() => new Set<string>(
    (eventPledges as any[])
      .filter((p) => p.guest_id && (p.status === 'paid' || Number(p.paid_amount || 0) >= Number(p.amount || 0)))
      .map((p) => p.guest_id as string)
  ), [eventPledges]);

  const paidCount = guests.filter((g: any) => paidGuestIds.has(g.id)).length;
  const visibleGuests = excludePaid ? guests.filter((g: any) => !paidGuestIds.has(g.id)) : guests;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = SMS_TEMPLATES.find((t) => t.id === templateId);
    if (tpl && tpl.id !== 'custom') setMessage(tpl.template);
    else setMessage('');
  };

  const toggleGuest = (id: string) => {
    setSelectedGuests((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedGuests.length === visibleGuests.length && visibleGuests.length > 0) setSelectedGuests([]);
    else setSelectedGuests(visibleGuests.map((g: any) => g.id));
  };

  const toggleExcludePaid = (checked: boolean) => {
    setExcludePaid(checked);
    if (checked) setSelectedGuests(prev => prev.filter(id => !paidGuestIds.has(id)));
  };

  const addManualRecipient = () => {
    if (!newPhone || newPhone.length < 9) {
      toast.error('Weka namba sahihi ya simu');
      return;
    }
    setManualRecipients(prev => [...prev, { id: `manual-${Date.now()}`, name: newName || 'Mgeni', phone: newPhone, vars: { ...newVars } }]);
    setNewPhone('');
    setNewName('');
    setNewVars({});
  };

  const removeManualRecipient = (id: string) => {
    setManualRecipients(prev => prev.filter(r => r.id !== id));
  };

  const handleContactImport = (contacts: { name: string; phone: string }[]) => {
    const newContacts = contacts.map((c, i) => ({
      id: `contact-${Date.now()}-${i}`,
      name: c.name,
      phone: c.phone,
    }));
    setManualRecipients(prev => [...prev, ...newContacts]);
  };

  const totalRecipients = selectedGuests.length + manualRecipients.length;

  const openPreview = () => {
    if (!message || totalRecipients === 0) {
      toast.error('Andika ujumbe na uchague wapokeaji');
      return;
    }
    if (!selectedEvent) {
      toast.error('Tafadhali chagua tukio kwanza kabla ya kutuma SMS.');
      return;
    }
    if (eventAllocation <= 0) {
      toast.error('Tukio hili halina SMS zilizotengwa. Tafadhali tenga SMS kwanza kwenye tukio.');
      return;
    }
    const smsNeeded = totalRecipients * smsCount;
    if (smsNeeded > eventSmsRemaining) {
      toast.error(`SMS hazitoshi! Unahitaji ${smsNeeded} lakini zimebaki ${eventSmsRemaining} tu kwa tukio hili.`);
      return;
    }
    setPreviewOpen(true);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const guestRecipients = guests
        .filter((g: any) => selectedGuests.includes(g.id))
        .map((g: any) => ({ name: g.full_name, phone: g.phone }));

      const allRecipients = [
        ...guestRecipients,
        ...manualRecipients.map(r => ({ name: r.name, phone: r.phone, vars: r.vars || {} })),
      ];

      const eventData = events.find((e: any) => e.id === selectedEvent);

      let beemScheduleTime = '';
      if (scheduleEnabled && scheduleDate && scheduleTime) {
        const dt = new Date(`${scheduleDate}T${scheduleTime}`);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        const hh = String(dt.getHours()).padStart(2, '0');
        const min = String(dt.getMinutes()).padStart(2, '0');
        beemScheduleTime = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      }

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          message,
          recipients: allRecipients,
          eventTitle: eventData?.title || '',
          eventDate: eventData?.event_date || '',
          scheduleTime: beemScheduleTime,
          logSms: true,
          userId: user?.id,
          eventId: selectedEvent || null,
        },
      });

      if (error) throw error;

      const failedCount = (data?.results || []).filter((r: any) => r.status === 'failed').length;
      if (scheduleEnabled) {
        toast.success(`SMS ${totalRecipients} zimepangwa kutumwa!`);
      } else if (failedCount > 0) {
        toast.warning(`SMS ${totalRecipients - failedCount} zimetumwa, ${failedCount} zimeshindikana`);
      } else {
        toast.success(`SMS ${totalRecipients} zimetumwa kupitia Beem Africa!`);
      }

      queryClient.invalidateQueries({ queryKey: ['sms-logs'] });
      queryClient.invalidateQueries({ queryKey: ['beem-balance'] });
      queryClient.invalidateQueries({ queryKey: ['event-sms-used'] });
      queryClient.invalidateQueries({ queryKey: ['events-sms-allocation'] });

      setSent(true);
      setPreviewOpen(false);
      if (!scheduleEnabled) {
        setInvoiceUnits((totalRecipients - failedCount) * smsCount);
        setInvoiceOpen(true);
      }
      setTimeout(() => {
        setSent(false);
        setSelectedGuests([]);
        setManualRecipients([]);
      }, 3000);

    } catch {
      toast.error('Imeshindikana kutuma SMS. Jaribu tena.');
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const smsCount = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  // --- SMS Validation ---
  const validationErrors = useMemo(() => {
    const errors: { type: 'error' | 'warning'; message: string }[] = [];

    // Message validation
    if (message.length === 0) {
      errors.push({ type: 'error', message: 'Ujumbe haujaandikwa' });
    } else if (message.trim().length === 0) {
      errors.push({ type: 'error', message: 'Ujumbe una nafasi tupu tu — andika ujumbe halisi' });
    }

    if (message.length > 918) {
      errors.push({ type: 'error', message: `Ujumbe ni mrefu sana (${message.length}/918 herufi max). Beem inaruhusu SMS 6 tu kwa ujumbe mmoja.` });
    } else if (smsCount > 3) {
      errors.push({ type: 'warning', message: `Ujumbe utagawanywa kuwa SMS ${smsCount} — hii itatumia vitengo vingi zaidi` });
    }

    // Check for non-GSM characters that may cause encoding issues
    const nonGsmChars = message.match(/[^\x20-\x7E\n\r]/g);
    if (nonGsmChars) {
      const unique = [...new Set(nonGsmChars)].slice(0, 5).join(' ');
      errors.push({ type: 'warning', message: `Ujumbe una herufi maalum (${unique}) — hii inaweza kupunguza idadi ya herufi kwa SMS hadi 70` });
    }

    // Placeholders without event
    if ((message.includes('{event}') || message.includes('{date}')) && !selectedEvent) {
      errors.push({ type: 'warning', message: 'Ujumbe una {event}/{date} lakini hukuchagua tukio — vitabadilishwa kuwa tupu' });
    }

    // Recipients validation
    if (totalRecipients === 0) {
      errors.push({ type: 'error', message: 'Hakuna wapokeaji — ongeza angalau mpokeaji mmoja' });
    }

    // Validate phone numbers
    const allPhones = [
      ...guests.filter((g: any) => selectedGuests.includes(g.id)).map((g: any) => ({ name: g.full_name, phone: g.phone })),
      ...manualRecipients.map(r => ({ name: r.name, phone: r.phone })),
    ];

    const invalidPhones: string[] = [];
    const duplicatePhones: string[] = [];
    const seenPhones = new Set<string>();

    allPhones.forEach(r => {
      let phone = r.phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '255' + phone.substring(1);
      if (!phone.startsWith('255')) phone = '255' + phone;

      if (phone.length < 12 || phone.length > 12) {
        invalidPhones.push(`${r.name} (${r.phone})`);
      }

      if (seenPhones.has(phone)) {
        duplicatePhones.push(`${r.name} (${r.phone})`);
      }
      seenPhones.add(phone);
    });

    if (invalidPhones.length > 0) {
      errors.push({ type: 'error', message: `Namba zisizo sahihi: ${invalidPhones.slice(0, 3).join(', ')}${invalidPhones.length > 3 ? ` na ${invalidPhones.length - 3} zaidi` : ''}` });
    }

    if (duplicatePhones.length > 0) {
      errors.push({ type: 'warning', message: `Namba zilizojirudia: ${duplicatePhones.slice(0, 3).join(', ')}${duplicatePhones.length > 3 ? ` na ${duplicatePhones.length - 3} zaidi` : ''}` });
    }

    // Event & allocation
    if (!selectedEvent) {
      errors.push({ type: 'error', message: 'Hujachagua tukio — SMS haziwezi kutumwa bila tukio' });
    } else if (eventAllocation <= 0) {
      errors.push({ type: 'error', message: 'Tukio hili halina SMS zilizotengwa' });
    } else if (totalRecipients > 0) {
      const smsNeeded = totalRecipients * smsCount;
      if (smsNeeded > eventSmsRemaining) {
        errors.push({ type: 'error', message: `SMS hazitoshi! Unahitaji ${smsNeeded} lakini zimebaki ${eventSmsRemaining} tu` });
      }
    }

    // Schedule validation
    if (scheduleEnabled) {
      if (!scheduleDate || !scheduleTime) {
        errors.push({ type: 'error', message: 'Umewasha ratiba lakini hukuweka tarehe au saa' });
      } else {
        const scheduleDt = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduleDt <= new Date()) {
          errors.push({ type: 'error', message: 'Muda uliopangwa umeshapita — weka muda ujao' });
        }
      }
    }

    // Sender ID length
    // Beem requires source_addr max 11 characters
    // Currently hardcoded to 'SmartEvents' (11 chars) so this is fine

    return errors;
  }, [message, selectedEvent, selectedGuests, manualRecipients, guests, totalRecipients, smsCount, eventAllocation, eventSmsRemaining, scheduleEnabled, scheduleDate, scheduleTime]);

  const hasErrors = validationErrors.some(e => e.type === 'error');
  const hasWarnings = validationErrors.some(e => e.type === 'warning');

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Compose */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground text-lg">Andika Ujumbe</h3>

        <div>
          <Label>Tukio (Hiari)</Label>
          <Select value={selectedEvent} onValueChange={(v) => { setSelectedEvent(v); setSelectedGuests([]); }}>
            <SelectTrigger><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
            <SelectContent>
              {events.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title} {e.sms_allocation > 0 ? `(SMS: ${e.sms_allocation})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEvent && eventAllocation > 0 && (
            <div className={`mt-1.5 flex items-center gap-2 text-xs ${eventSmsRemaining < eventAllocation * 0.2 ? 'text-destructive' : 'text-muted-foreground'}`}>
              <MessageSquare className="w-3 h-3" />
              <span>SMS zimebaki: <strong>{eventSmsRemaining.toLocaleString()}</strong> / {eventAllocation.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div>
          <Label>Template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger><SelectValue placeholder="Chagua template" /></SelectTrigger>
            <SelectContent>
              {SMS_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Ujumbe</Label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Andika ujumbe hapa... Tumia {name}, {event}, {date} kwa personalization"
            rows={4}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{charCount} herufi • SMS {smsCount}</span>
            <span>Gharama: ~{totalRecipients * smsCount} SMS</span>
          </div>
          {detectedVars.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Variables:</span>
              {detectedVars.map((v) => (
                <span key={v} className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-mono">{`{${v}}`}</span>
              ))}
              <span className="text-muted-foreground ml-1">— jaza kwa kila mpokeaji au safu wima kwenye Excel</span>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <Label className="text-sm">Panga Muda (Schedule)</Label>
          </div>
          <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
        </div>
        {scheduleEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tarehe</Label>
              <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label className="text-xs">Saa</Label>
              <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
          </div>
        )}

        {/* Validation Panel */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-border overflow-hidden"
            >
              <div className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold ${hasErrors ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}>
                {hasErrors ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {hasErrors ? `Makosa ${validationErrors.filter(e => e.type === 'error').length} — rekebisha kabla ya kutuma` : `Tahadhari ${validationErrors.length}`}
              </div>
              <div className="divide-y divide-border max-h-40 overflow-y-auto">
                {validationErrors.map((err, i) => (
                  <div key={i} className={`flex items-start gap-2 px-3 py-2 text-xs ${err.type === 'error' ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    <span className="mt-0.5 shrink-0">{err.type === 'error' ? '✕' : '⚠'}</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasErrors && totalRecipients > 0 && message.trim().length > 0 && selectedEvent && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SMS zote zimethibitishwa — tayari kutumwa</span>
          </div>
        )}

        <Button type="button" onClick={openPreview} disabled={sending || sent || hasErrors} className="w-full gap-2">
          {sent ? <><CheckCircle className="w-4 h-4" /> Zimetumwa!</> :
           hasErrors ? 'Rekebisha makosa kwanza' :
           sending ? 'Inatuma kupitia Beem Africa...' :
           <><Send className="w-4 h-4" /> Kagua & Tuma ({totalRecipients})</>}
        </Button>
      </motion.div>

      {/* Recipients */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground text-lg">Wapokeaji</h3>

        {/* Custom template manager */}
        <div className="p-3 rounded-lg border border-dashed border-border">
          <SmsTemplateManager onUse={(c) => { setMessage(c); setSelectedTemplate('custom'); toast.success('Template imepakiwa kwenye ujumbe'); }} />
        </div>

        {/* Manual phone entry */}
        <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Ongeza Namba Moja kwa Moja</span>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Jina" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1" />
            <Input placeholder="0712345678" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="flex-1" />
            <Button size="icon" variant="outline" onClick={addManualRecipient}><Plus className="w-4 h-4" /></Button>
          </div>
          {detectedVars.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {detectedVars.map((v) => (
                <Input
                  key={v}
                  placeholder={`{${v}}`}
                  value={newVars[v] || ''}
                  onChange={(e) => setNewVars(prev => ({ ...prev, [v]: e.target.value }))}
                  className="text-xs"
                />
              ))}
            </div>
          )}
          <ContactPicker
            onPick={(c) => handleContactImport([{ name: c.name || 'Mgeni', phone: c.phone || '' }])}
            onPickMultiple={(contacts) => handleContactImport(contacts.map(c => ({ name: c.name || 'Mgeni', phone: c.phone || '' })))}
            multiple
            label="Import Contacts"
            variant="outline"
            size="sm"
          />
        </div>

        {/* Bulk upload from Excel/CSV */}
        <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Pakia Orodha (Excel/CSV)</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Bonyeza <strong>Pakua Template</strong> kupata Excel yenye safu wima za <strong>Jina</strong>, <strong>Simu</strong>
            {detectedVars.length > 0 ? (
              <> pamoja na variables za template uliyochagua: {detectedVars.map((v) => (<code key={v} className="mx-0.5">{`{${v}}`}</code>))}.</>
            ) : (
              <>. Andika/chagua template yenye <code>{'{variables}'}</code> ili safu wima zake ziongezwe kiotomatiki.</>
            )}
          </p>
          <div className="flex gap-2">
            <input
              ref={bulkFileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleBulkFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => bulkFileRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Pakia Faili
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={downloadBulkTemplate}
            >
              <Download className="w-4 h-4" />
              Pakua Template
            </Button>
          </div>
        </div>

        {/* Manual recipients list */}
        {manualRecipients.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Namba za Moja kwa Moja ({manualRecipients.length})</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {manualRecipients.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded border border-border text-sm">
                  <span className="flex-1 text-foreground">{r.name}</span>
                  <span className="text-muted-foreground">{r.phone}</span>
                  <button onClick={() => removeManualRecipient(r.id)} className="text-destructive hover:text-destructive/80"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event guests */}
        {selectedEvent && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Wageni wa Tukio ({visibleGuests.length}{excludePaid ? ` · ${paidCount} walioshalipa wameondolewa` : ''})</Label>
              {visibleGuests.length > 0 && (
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedGuests.length === visibleGuests.length ? 'Ondoa Yote' : 'Chagua Wote'}
                </Button>
              )}
            </div>
            {paidCount > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <BadgeCheck className="w-4 h-4 text-green-600 shrink-0" />
                <div className="flex-1">
                  <Label className="text-xs">Wacha walioshalipa michango ({paidCount})</Label>
                  <p className="text-[10px] text-muted-foreground">Wageni wenye tag ya "Amelipa" hawatapokea SMS ya kikumbusho</p>
                </div>
                <Switch checked={excludePaid} onCheckedChange={toggleExcludePaid} />
              </div>
            )}
            {visibleGuests.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                {guests.length === 0 ? 'Hakuna wageni wenye namba ya simu' : 'Wageni wote walioshalipa wameondolewa kwenye orodha'}
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {visibleGuests.map((g: any) => (
                  <label key={g.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${selectedGuests.includes(g.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                    <Checkbox checked={selectedGuests.includes(g.id)} onCheckedChange={() => toggleGuest(g.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{g.full_name}</p>
                      <p className="text-xs text-muted-foreground">{g.phone}</p>
                    </div>
                    {paidGuestIds.has(g.id) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-semibold shrink-0">
                        <BadgeCheck className="w-3 h-3" /> Amelipa
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>

      <SmsPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        message={message}
        recipients={[
          ...guests.filter((g: any) => selectedGuests.includes(g.id)).map((g: any) => ({ name: g.full_name, phone: g.phone })),
          ...manualRecipients.map((r) => ({ name: r.name, phone: r.phone, vars: r.vars || {} })),
        ] as PreviewRecipient[]}
        eventTitle={selectedEventData?.title}
        eventDate={selectedEventData?.event_date}
        smsCount={smsCount}
        scheduled={scheduleEnabled}
        scheduleAt={scheduleEnabled && scheduleDate && scheduleTime ? `${scheduleDate} ${scheduleTime}` : undefined}
        sending={sending}
        onConfirm={handleSend}
      />
    </div>
  );
};

export default SmsCompose;
