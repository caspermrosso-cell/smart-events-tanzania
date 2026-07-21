import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Search, Phone, Mail, CheckCircle, XCircle, Clock, Trash2, Pencil, Upload, X, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PhoneInput from '@/components/PhoneInput';
import * as XLSX from 'xlsx';

const RSVP_ICONS: Record<string, any> = {
  confirmed: { icon: CheckCircle, class: 'text-green-600' },
  declined: { icon: XCircle, class: 'text-destructive' },
  pending: { icon: Clock, class: 'text-muted-foreground' },
};

const Guests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [bulkEventId, setBulkEventId] = useState('');
  const [bulkData, setBulkData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    full_name: string; phone: string; email: string; event_id: string;
    rsvp_status: string; table_number: string; card_number: string;
    custom_fields: Record<string, string>;
  }>({ full_name: '', phone: '+255', email: '', event_id: '', rsvp_status: 'pending', table_number: '', card_number: '', custom_fields: {} });
  const [newVarKey, setNewVarKey] = useState('');

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title').order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['guests', selectedEvent],
    queryFn: async () => {
      let q = supabase.from('guests').select('*, events(title)').is('deleted_at', null).order('created_at', { ascending: false });
      if (selectedEvent !== 'all') q = q.eq('event_id', selectedEvent);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingGuest) {
        const { error } = await supabase.from('guests').update(data).eq('id', editingGuest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('guests').insert({ ...data, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(editingGuest ? 'Mgeni amesasishwa' : 'Mgeni ameongezwa');
      handleClose();
    },
    onError: () => toast.error('Imeshindikana kuhifadhi mgeni'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('guests')
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Mgeni amehamishwa Recycle Bin');
    },
    onError: () => toast.error('Imeshindikana kufuta mgeni'),
  });

  const bulkMutation = useMutation({
    mutationFn: async (rows: any[]) => {
      const { error } = await supabase.from('guests').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(`Wageni ${bulkData.length} wameongezwa!`);
      setBulkDialogOpen(false);
      setBulkData([]);
      setBulkEventId('');
    },
    onError: () => toast.error('Imeshindikana kuongeza wageni'),
  });

  const handleClose = () => {
    setDialogOpen(false);
    setEditingGuest(null);
    setForm({ full_name: '', phone: '+255', email: '', event_id: '', rsvp_status: 'pending', table_number: '', card_number: '', custom_fields: {} });
    setNewVarKey('');
  };

  const handleEdit = (guest: any) => {
    setEditingGuest(guest);
    setForm({
      full_name: guest.full_name,
      phone: guest.phone || '+255',
      email: guest.email || '',
      event_id: guest.event_id,
      rsvp_status: guest.rsvp_status,
      table_number: guest.table_number || '',
      card_number: guest.card_number || '',
      custom_fields: guest.custom_fields && typeof guest.custom_fields === 'object' ? { ...guest.custom_fields } : {},
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.event_id) {
      toast.error('Jaza jina na tukio');
      return;
    }
    const payload: any = { ...form };
    if (!payload.card_number) payload.card_number = null;
    saveMutation.mutate(payload);
  };

  const addCustomField = () => {
    const key = newVarKey.trim();
    if (!key) return;
    if (form.custom_fields[key] !== undefined) { toast.error('Variable ipo tayari'); return; }
    setForm({ ...form, custom_fields: { ...form.custom_fields, [key]: '' } });
    setNewVarKey('');
  };

  const removeCustomField = (key: string) => {
    const next = { ...form.custom_fields };
    delete next[key];
    setForm({ ...form, custom_fields: next });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const STANDARD = ['Jina','Name','full_name','Simu','Phone','phone','Email','email','Meza','Table','table_number','Kadi','Card','card_number'];
        const parsed = data.map((row: any) => {
          const custom: Record<string, string> = {};
          Object.keys(row).forEach(k => {
            if (!STANDARD.includes(k) && row[k] !== '' && row[k] != null) custom[k] = String(row[k]);
          });
          return {
            full_name: row['Jina'] || row['Name'] || row['full_name'] || '',
            phone: row['Simu'] || row['Phone'] || row['phone'] || '',
            email: row['Email'] || row['email'] || '',
            table_number: row['Meza'] || row['Table'] || row['table_number'] || '',
            card_number: row['Kadi'] || row['Card'] || row['card_number'] || '',
            custom_fields: custom,
          };
        }).filter(r => r.full_name);
        setBulkData(parsed);
        if (parsed.length === 0) toast.error('Hakuna data iliyopatikana kwenye faili');
      } catch {
        toast.error('Imeshindikana kusoma faili');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBulkSubmit = () => {
    if (!bulkEventId) { toast.error('Chagua tukio'); return; }
    if (bulkData.length === 0) { toast.error('Hakuna wageni'); return; }
    const rows = bulkData.map(r => ({
      ...r,
      phone: r.phone ? (String(r.phone).startsWith('+255') ? String(r.phone) : '+255' + String(r.phone).replace(/^0/, '')) : null,
      card_number: r.card_number ? String(r.card_number).trim() : null,
      custom_fields: r.custom_fields || {},
      event_id: bulkEventId,
      user_id: user!.id,
      rsvp_status: 'pending',
    }));
    bulkMutation.mutate(rows);
  };

  const filtered = guests.filter((g: any) =>
    g.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (g.phone && g.phone.includes(search)) ||
    (g.email && g.email.toLowerCase().includes(search.toLowerCase())) ||
    (g.card_number && g.card_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground">
          Wageni
        </motion.h2>
        <div className="flex gap-2">
          {/* Bulk Upload Dialog */}
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" /> Bulk Upload</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Ongeza Wageni Wengi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tukio *</Label>
                  <Select value={bulkEventId} onValueChange={setBulkEventId}>
                    <SelectTrigger><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
                    <SelectContent>
                      {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Faili (Excel/CSV)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Safu: Jina, Simu, Kadi (standard) + safu zingine zozote zitakuwa custom variables. Pia inasoma Name, Phone, Card.</p>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                </div>
                {bulkData.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Wageni {bulkData.length} wamepatikana:</p>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                      <Table>
                        <TableHeader><TableRow><TableHead>Jina</TableHead><TableHead>Simu</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {bulkData.slice(0, 20).map((r, i) => (
                            <TableRow key={i}><TableCell className="text-sm">{r.full_name}</TableCell><TableCell className="text-sm text-muted-foreground">{r.phone || '-'}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {bulkData.length > 20 && <p className="text-xs text-muted-foreground text-center py-2">...na {bulkData.length - 20} zaidi</p>}
                    </div>
                  </div>
                )}
                <Button onClick={handleBulkSubmit} className="w-full" disabled={bulkMutation.isPending || bulkData.length === 0}>
                  {bulkMutation.isPending ? 'Inaongeza...' : `Ongeza Wageni ${bulkData.length}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Single Guest Dialog */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleClose(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Ongeza Mgeni</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">{editingGuest ? 'Hariri Mgeni' : 'Ongeza Mgeni Mpya'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Jina Kamili *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jina la mgeni" />
                </div>
                <div>
                  <Label>Tukio *</Label>
                  <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
                    <SelectContent>
                      {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Simu</Label>
                    <PhoneInput
                      value={form.phone}
                      onChange={(v) => setForm({ ...form, phone: v })}
                      onContactPicked={(c) => {
                        if (c.name && !form.full_name) setForm(prev => ({ ...prev, full_name: c.name! }));
                        if (c.email && !form.email) setForm(prev => ({ ...prev, email: c.email! }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Kadi Namba</Label>
                    <Input value={form.card_number} onChange={(e) => setForm({ ...form, card_number: e.target.value })} placeholder="mfano: 001" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>RSVP</Label>
                    <Select value={form.rsvp_status} onValueChange={(v) => setForm({ ...form, rsvp_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Meza #</Label>
                    <Input value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} placeholder="e.g. A1" />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@..." />
                </div>

                <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Variables za Ziada</Label>
                    <span className="text-xs text-muted-foreground">{Object.keys(form.custom_fields).length} field(s)</span>
                  </div>
                  {Object.entries(form.custom_fields).map(([k, v]) => (
                    <div key={k} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">{k}</Label>
                        <Input value={v} onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [k]: e.target.value } })} placeholder={`Weka ${k}`} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomField(k)}>
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newVarKey}
                      onChange={(e) => setNewVarKey(e.target.value)}
                      placeholder="Jina la variable (mfano: cheo)"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomField(); } }}
                    />
                    <Button type="button" variant="outline" onClick={addCustomField} className="gap-1"><Plus className="w-4 h-4" />Ongeza</Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Inahifadhi...' : editingGuest ? 'Sasisha' : 'Hifadhi'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tafuta mgeni..." className="pl-10" />
        </div>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Tukio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Matukio Yote</SelectItem>
            {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Hakuna wageni bado</h3>
          <p className="text-muted-foreground mb-6">Ongeza wageni wa tukio lako</p>
        </motion.div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jina</TableHead>
                <TableHead className="hidden sm:table-cell">Tukio</TableHead>
                <TableHead className="hidden md:table-cell">Simu</TableHead>
                <TableHead className="hidden md:table-cell">Kadi</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead className="hidden md:table-cell">Meza</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((guest: any) => {
                const rsvp = RSVP_ICONS[guest.rsvp_status] || RSVP_ICONS.pending;
                const RsvpIcon = rsvp.icon;
                return (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.full_name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{guest.events?.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{guest.phone || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {guest.card_number ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/20 text-foreground font-mono text-xs">
                          <CreditCard className="w-3 h-3" />{guest.card_number}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <RsvpIcon className={`w-4 h-4 ${rsvp.class}`} />
                        <span className="text-sm capitalize">{guest.rsvp_status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{guest.table_number || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(guest)} className="p-1.5 rounded hover:bg-muted transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(guest.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Guests;
