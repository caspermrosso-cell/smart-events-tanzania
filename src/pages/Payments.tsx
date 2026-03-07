import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, Smartphone, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import selcomQr from '@/assets/selcom-qr.png';

const MPESA_MERCHANT_ID = '5537073';
const SELCOM_ACCOUNT = '5525100337337';

const paymentMethods = [
  { value: 'mpesa', label: 'M-Pesa', icon: Smartphone, desc: `Merchant ID: ${MPESA_MERCHANT_ID}` },
  { value: 'bank', label: 'Bank Transfer', icon: Banknote, desc: 'Lipa kupitia benki' },
  { value: 'cash', label: 'Cash', icon: CreditCard, desc: 'Malipo ya taslimu' },
];

const Payments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [payerName, setPayerName] = useState('');
  const [reference, setReference] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: events } = useQuery({
    queryKey: ['events-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title, event_type, subscription_amount').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, events(title)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('payments').insert({
        event_id: selectedEvent,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payer_name: payerName,
        reference: reference || null,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-revenue'] });
      toast.success('Malipo yameongezwa!');
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setSelectedEvent('');
    setAmount('');
    setPaymentMethod('');
    setPayerName('');
    setReference('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !amount || !paymentMethod || !payerName) {
      toast.error('Tafadhali jaza taarifa zote zinazohitajika');
      return;
    }
    addPayment.mutate();
  };

  const filteredPayments = (payments || []).filter(p =>
    p.payer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceived = (payments || []).reduce((s, p) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Malipo</h2>
          <p className="text-sm text-muted-foreground">Pokea na fuatilia malipo ya matukio</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Ongeza Malipo
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {paymentMethods.map((pm) => {
          const methodTotal = (payments || []).filter(p => p.payment_method === pm.value).reduce((s, p) => s + Number(p.amount), 0);
          return (
            <motion.div key={pm.value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <pm.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{pm.label}</p>
                  <p className="text-xs text-muted-foreground">{pm.desc}</p>
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">TZS {methodTotal.toLocaleString()}</p>
            </motion.div>
          );
        })}
      </div>

      {/* M-Pesa QR Code + Total */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Jumla ya Malipo Yaliyopokelewa</p>
          <p className="text-3xl font-bold text-foreground">TZS {totalReceived.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="bg-white rounded-lg p-2.5 shrink-0">
            <QRCodeSVG value={MPESA_MERCHANT_ID} size={70} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">M-Pesa Lipa Namba</p>
            <p className="text-2xl font-bold text-foreground">{MPESA_MERCHANT_ID}</p>
            <p className="text-xs text-muted-foreground">Scan QR code kulipa kupitia M-Pesa</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="bg-white rounded-lg p-1.5 shrink-0">
            <img src={selcomQr} alt="Selcom Pesa" className="w-[76px] h-[76px] object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Selcom Pesa</p>
            <p className="text-xl font-bold text-foreground">{SELCOM_ACCOUNT}</p>
            <p className="text-xs text-muted-foreground">Scan QR code kulipa kupitia Selcom</p>
          </div>
        </div>
      </div>

      {/* Add Payment Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 mb-8">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Ongeza Malipo Mapya</h3>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tukio *</label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
                <SelectContent>
                  {(events || []).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Jina la Mlipaji *</label>
              <Input value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="Jina kamili" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Kiasi (TZS) *</label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min="1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Njia ya Malipo *</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="Chagua njia" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.label} {pm.value === 'mpesa' ? `(${MPESA_MERCHANT_ID})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted-foreground mb-1 block">Reference / Namba ya Muamala</label>
              <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Mfano: Transaction ID" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={addPayment.isPending} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-accent transition-colors text-sm disabled:opacity-50">
                {addPayment.isPending ? 'Inahifadhi...' : 'Hifadhi Malipo'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors text-sm">
                Ghairi
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Payments List */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tafuta malipo..."
            className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Tarehe</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Mlipaji</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Tukio</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Njia</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Reference</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Kiasi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Inapakia...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Hakuna malipo bado</td></tr>
              ) : (
                filteredPayments.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-3 text-foreground">{new Date(p.created_at).toLocaleDateString('sw-TZ')}</td>
                    <td className="p-3 text-foreground font-medium">{p.payer_name}</td>
                    <td className="p-3 text-foreground">{p.events?.title || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.payment_method === 'mpesa' ? 'bg-green-100 text-green-700' :
                        p.payment_method === 'bank' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.payment_method === 'mpesa' ? 'M-Pesa' : p.payment_method === 'bank' ? 'Bank' : 'Cash'}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.reference || '-'}</td>
                    <td className="p-3 text-right font-semibold text-foreground">TZS {Number(p.amount).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
