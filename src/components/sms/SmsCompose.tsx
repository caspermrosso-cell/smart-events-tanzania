import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Clock, Plus, X, Phone, MessageSquare, Upload, FileSpreadsheet, AlertTriangle, ShieldCheck } from 'lucide-react';
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
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [manualRecipients, setManualRecipients] = useState<ManualRecipient[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const bulkFileRef = useRef<HTMLInputElement>(null);

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
            imported.push({ id: `bulk-${Date.now()}-${i}`, name: name || 'Mgeni', phone });
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
    const ws = XLSX.utils.aoa_to_sheet([
      ['Jina', 'Simu'],
      ['Ali Mohamed', '0712345678'],
      ['Fatma Hassan', '0654321098'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wapokeaji');
    XLSX.writeFile(wb, 'sms_wapokeaji_template.xlsx');
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
    if (selectedGuests.length === guests.length) setSelectedGuests([]);
    else setSelectedGuests(guests.map((g: any) => g.id));
  };

  const addManualRecipient = () => {
    if (!newPhone || newPhone.length < 9) {
      toast.error('Weka namba sahihi ya simu');
      return;
    }
    setManualRecipients(prev => [...prev, { id: `manual-${Date.now()}`, name: newName || 'Mgeni', phone: newPhone }]);
    setNewPhone('');
    setNewName('');
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

  const handleSend = async () => {
    if (!message || totalRecipients === 0) {
      toast.error('Andika ujumbe na uchague wapokeaji');
      return;
    }

    // Must select an event
    if (!selectedEvent) {
      toast.error('Tafadhali chagua tukio kwanza kabla ya kutuma SMS.');
      return;
    }

    // Event must have SMS allocation
    if (eventAllocation <= 0) {
      toast.error('Tukio hili halina SMS zilizotengwa. Tafadhali tenga SMS kwanza kwenye tukio.');
      return;
    }

    // Check remaining SMS allocation
    const smsNeeded = totalRecipients * smsCount;
    if (smsNeeded > eventSmsRemaining) {
      toast.error(`SMS hazitoshi! Unahitaji ${smsNeeded} lakini zimebaki ${eventSmsRemaining} tu kwa tukio hili.`);
      return;
    }

    setSending(true);
    try {
      const guestRecipients = guests
        .filter((g: any) => selectedGuests.includes(g.id))
        .map((g: any) => ({ name: g.full_name, phone: g.phone }));

      const allRecipients = [
        ...guestRecipients,
        ...manualRecipients.map(r => ({ name: r.name, phone: r.phone })),
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

        <Button type="button" onClick={handleSend} disabled={sending || sent || !selectedEvent || eventAllocation <= 0 || eventSmsRemaining <= 0} className="w-full gap-2">
          {sent ? <><CheckCircle className="w-4 h-4" /> Zimetumwa!</> :
           !selectedEvent ? 'Chagua tukio kwanza' :
           eventAllocation <= 0 ? 'Hakuna SMS zilizotengwa' :
           eventSmsRemaining <= 0 ? 'SMS zimetumika zote' :
           sending ? 'Inatuma kupitia Beem Africa...' :
           scheduleEnabled ? <><Clock className="w-4 h-4" /> Panga SMS {totalRecipients}</> :
           <><Send className="w-4 h-4" /> Tuma kwa Wapokeaji {totalRecipients}</>}
        </Button>
      </motion.div>

      {/* Recipients */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground text-lg">Wapokeaji</h3>

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
            Faili lazima iwe na safu wima mbili: <strong>Jina</strong> na <strong>Namba ya Simu</strong>
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
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={downloadBulkTemplate}
            >
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
              <Label className="text-xs text-muted-foreground">Wageni wa Tukio ({guests.length})</Label>
              {guests.length > 0 && (
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedGuests.length === guests.length ? 'Ondoa Yote' : 'Chagua Wote'}
                </Button>
              )}
            </div>
            {guests.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Hakuna wageni wenye namba ya simu</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {guests.map((g: any) => (
                  <label key={g.id} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${selectedGuests.includes(g.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                    <Checkbox checked={selectedGuests.includes(g.id)} onCheckedChange={() => toggleGuest(g.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{g.full_name}</p>
                      <p className="text-xs text-muted-foreground">{g.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SmsCompose;
