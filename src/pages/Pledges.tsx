import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Search, Trash2, Pencil, TrendingUp, TrendingDown } from 'lucide-react';
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
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';

const STATUS_STYLES: Record<string, string> = {
  pledged: 'bg-primary/10 text-primary',
  partial: 'bg-gold/10 text-gold-foreground',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-destructive/10 text-destructive',
};

const Pledges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPledge, setEditingPledge] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ guest_name: '', amount: '', paid_amount: '', event_id: '', status: 'pledged', payment_method: '', notes: '' });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title').order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pledges = [], isLoading } = useQuery({
    queryKey: ['pledges', selectedEvent],
    queryFn: async () => {
      let q = supabase.from('pledges').select('*, events(title)').order('created_at', { ascending: false });
      if (selectedEvent !== 'all') q = q.eq('event_id', selectedEvent);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        amount: parseFloat(data.amount) || 0,
        paid_amount: parseFloat(data.paid_amount) || 0,
      };
      if (editingPledge) {
        const { error } = await supabase.from('pledges').update(payload).eq('id', editingPledge.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pledges').insert({ ...payload, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(editingPledge ? 'Mchango umesasishwa' : 'Mchango umeongezwa');
      handleClose();
    },
    onError: () => toast.error('Imeshindikana kuhifadhi mchango'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pledges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Mchango umefutwa');
    },
    onError: () => toast.error('Imeshindikana kufuta'),
  });

  const handleClose = () => {
    setDialogOpen(false);
    setEditingPledge(null);
    setForm({ guest_name: '', amount: '', paid_amount: '', event_id: '', status: 'pledged', payment_method: '', notes: '' });
  };

  const handleEdit = (p: any) => {
    setEditingPledge(p);
    setForm({
      guest_name: p.guest_name,
      amount: String(p.amount),
      paid_amount: String(p.paid_amount),
      event_id: p.event_id,
      status: p.status,
      payment_method: p.payment_method || '',
      notes: p.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name || !form.event_id || !form.amount) {
      toast.error('Jaza jina, tukio na kiasi');
      return;
    }
    saveMutation.mutate(form);
  };

  const filtered = pledges.filter((p: any) =>
    p.guest_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPledged = filtered.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalPaid = filtered.reduce((s: number, p: any) => s + Number(p.paid_amount), 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground">
          Michango
        </motion.h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleClose(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Ongeza Mchango</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">{editingPledge ? 'Hariri Mchango' : 'Ongeza Mchango Mpya'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Jina la Mgeni *</Label>
                <Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="Jina" />
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
                  <Label>Kiasi (TZS) *</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Kilicholipwa (TZS)</Label>
                  <Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hali</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pledged">Ameahidi</SelectItem>
                      <SelectItem value="partial">Sehemu</SelectItem>
                      <SelectItem value="paid">Amelipa</SelectItem>
                      <SelectItem value="cancelled">Imeghairiwa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Njia ya Malipo</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue placeholder="Chagua" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Benki</SelectItem>
                      <SelectItem value="other">Nyingine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Maelezo</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Maelezo ya ziada..." />
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Inahifadhi...' : editingPledge ? 'Sasisha' : 'Hifadhi'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="w-4 h-4" /> Jumla Ahadi</div>
          <p className="text-xl font-bold text-foreground">TZS {totalPledged.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><CreditCard className="w-4 h-4" /> Kilicholipwa</div>
          <p className="text-xl font-bold text-foreground">TZS {totalPaid.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingDown className="w-4 h-4" /> Baki</div>
          <p className="text-xl font-bold text-foreground">TZS {(totalPledged - totalPaid).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tafuta mchango..." className="pl-10" />
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
          <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Hakuna michango bado</h3>
          <p className="text-muted-foreground mb-6">Ongeza michango ya wageni</p>
        </motion.div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mgeni</TableHead>
                <TableHead className="hidden sm:table-cell">Tukio</TableHead>
                <TableHead>Ahadi</TableHead>
                <TableHead className="hidden md:table-cell">Amelipa</TableHead>
                <TableHead>Hali</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.guest_name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{p.events?.title}</TableCell>
                  <TableCell className="font-semibold">TZS {Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">TZS {Number(p.paid_amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[p.status] || STATUS_STYLES.pledged}`}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Pledges;
