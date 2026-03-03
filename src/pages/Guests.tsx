import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Search, Phone, Mail, CheckCircle, XCircle, Clock, Trash2, Pencil } from 'lucide-react';
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

const RSVP_ICONS: Record<string, any> = {
  confirmed: { icon: CheckCircle, class: 'text-green-600' },
  declined: { icon: XCircle, class: 'text-destructive' },
  pending: { icon: Clock, class: 'text-muted-foreground' },
};

const Guests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Form state
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', event_id: '', rsvp_status: 'pending', table_number: '' });

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
      let q = supabase.from('guests').select('*, events(title)').order('created_at', { ascending: false });
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
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Mgeni amefutwa');
    },
    onError: () => toast.error('Imeshindikana kufuta mgeni'),
  });

  const handleClose = () => {
    setDialogOpen(false);
    setEditingGuest(null);
    setForm({ full_name: '', phone: '', email: '', event_id: '', rsvp_status: 'pending', table_number: '' });
  };

  const handleEdit = (guest: any) => {
    setEditingGuest(guest);
    setForm({
      full_name: guest.full_name,
      phone: guest.phone || '',
      email: guest.email || '',
      event_id: guest.event_id,
      rsvp_status: guest.rsvp_status,
      table_number: guest.table_number || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.event_id) {
      toast.error('Jaza jina na tukio');
      return;
    }
    saveMutation.mutate(form);
  };

  const filtered = guests.filter((g: any) =>
    g.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (g.phone && g.phone.includes(search)) ||
    (g.email && g.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground">
          Wageni
        </motion.h2>
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
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+255..." />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@..." />
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
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Inahifadhi...' : editingGuest ? 'Sasisha' : 'Hifadhi'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
