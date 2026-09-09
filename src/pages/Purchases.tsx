import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Receipt, Trash2, Upload, FileDown, Loader2, ShoppingCart } from 'lucide-react';

export const VAT_RATE = 0.18;
/** VAT imejumuishwa kwenye bei ya kuuza: VAT = jumla x 18/118 */
export const vatFromGross = (gross: number) => (Number(gross) || 0) * (VAT_RATE / (1 + VAT_RATE));

type Purchase = {
  id: string;
  supplier: string;
  receipt_number: string | null;
  purchase_date: string;
  channel: string;
  units: number;
  unit_cost: number;
  amount_excl_vat: number;
  vat_amount: number;
  total_amount: number;
  payment_method: string | null;
  notes: string | null;
  receipt_url: string | null;
};

const money = (n: number) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const emptyForm = () => ({
  supplier: 'Beem Africa',
  receipt_number: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  channel: 'sms',
  units: '0',
  total_amount: '0',
  payment_method: 'NBC Lipa No.',
  notes: '',
});

const Purchases = () => {
  const qc = useQueryClient();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ['supplier-purchases', year],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('supplier_purchases')
        .select('*')
        .gte('purchase_date', `${year}-01-01`)
        .lte('purchase_date', `${year}-12-31`)
        .order('purchase_date', { ascending: false });
      if (error) throw error;
      return (data || []) as Purchase[];
    },
  });

  const totals = useMemo(() => {
    const t = rows.reduce(
      (a, r) => ({
        units: a.units + (Number(r.units) || 0),
        net: a.net + (Number(r.amount_excl_vat) || 0),
        vat: a.vat + (Number(r.vat_amount) || 0),
        gross: a.gross + (Number(r.total_amount) || 0),
      }),
      { units: 0, net: 0, vat: 0, gross: 0 },
    );
    return t;
  }, [rows]);

  const gross = Number(form.total_amount) || 0;
  const vat = vatFromGross(gross);
  const net = gross - vat;
  const units = Number(form.units) || 0;

  const save = async () => {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Huja-login.');

      let receipt_url: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop() || 'pdf';
        const path = `${uid}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('purchase-receipts').upload(path, file);
        if (upErr) throw upErr;
        receipt_url = path;
      }

      const { error } = await (supabase as any).from('supplier_purchases').insert({
        user_id: uid,
        supplier: form.supplier.trim() || 'Beem Africa',
        receipt_number: form.receipt_number.trim() || null,
        purchase_date: form.purchase_date,
        channel: form.channel,
        units,
        unit_cost: units > 0 ? net / units : 0,
        amount_excl_vat: net,
        vat_amount: vat,
        total_amount: gross,
        payment_method: form.payment_method || null,
        notes: form.notes.trim() || null,
        receipt_url,
      });
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ['supplier-purchases'] });
      qc.invalidateQueries({ queryKey: ['financial-auto'] });
      setOpen(false);
      setForm(emptyForm());
      setFile(null);
      toast({ title: 'Imehifadhiwa', description: 'Risiti ya manunuzi imeongezwa.' });
    } catch (e: any) {
      toast({ title: 'Imeshindikana', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: Purchase) => {
    const { error } = await (supabase as any).from('supplier_purchases').delete().eq('id', r.id);
    if (error) return toast({ title: 'Imeshindikana', description: error.message, variant: 'destructive' });
    if (r.receipt_url) await supabase.storage.from('purchase-receipts').remove([r.receipt_url]);
    qc.invalidateQueries({ queryKey: ['supplier-purchases'] });
    qc.invalidateQueries({ queryKey: ['financial-auto'] });
    toast({ title: 'Imefutwa' });
  };

  const openReceipt = async (path: string) => {
    const { data, error } = await supabase.storage.from('purchase-receipts').createSignedUrl(path, 300);
    if (error || !data) return toast({ title: 'Imeshindikana kufungua risiti', variant: 'destructive' });
    window.open(data.signedUrl, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> Manunuzi ya Units
          </h2>
          <p className="text-sm text-muted-foreground">
            Hifadhi risiti za SMS/WhatsApp units kutoka Beem Africa na watoa huduma wengine. Zinaingia moja kwa moja kama Direct Cost.
          </p>
        </div>
        <div className="ml-auto flex items-end gap-2">
          <div>
            <Label className="text-xs">Mwaka</Label>
            <Input type="number" className="w-28" value={year} onChange={(e) => setYear(Number(e.target.value) || thisYear)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Ongeza risiti</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Risiti mpya ya manunuzi</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Mtoa huduma</Label>
                    <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Namba ya risiti</Label>
                    <Input value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Tarehe</Label>
                    <Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Huduma</Label>
                    <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="other">Nyingine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Idadi ya units</Label>
                    <Input type="number" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Jumla iliyolipwa (TZS)</Label>
                    <Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>Kiasi bila VAT</span><span className="tabular-nums">{money(net)}</span></div>
                  <div className="flex justify-between"><span>VAT 18% (ndani ya bei)</span><span className="tabular-nums">{money(vat)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Jumla</span><span className="tabular-nums">{money(gross)}</span></div>
                  {units > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Gharama kwa unit (bila VAT)</span><span>{money(net / units)}</span></div>}
                </div>

                <div>
                  <Label className="text-xs">Njia ya malipo</Label>
                  <Input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Nakala ya risiti (PDF au picha)</Label>
                  <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <Label className="text-xs">Maelezo</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Hifadhi risiti
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        {[
          ['Units zilizonunuliwa', totals.units.toLocaleString()],
          ['Direct Cost (bila VAT)', money(totals.net)],
          ['VAT ya manunuzi (input)', money(totals.vat)],
          ['Jumla iliyolipwa', money(totals.gross)],
        ].map(([l, v]) => (
          <Card key={l} className="p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-lg font-semibold tabular-nums">{v}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 overflow-x-auto">
        {isFetching && <p className="text-xs text-muted-foreground mb-2">Inapakia...</p>}
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Hakuna risiti za mwaka {year}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2">Tarehe</th>
                <th>Mtoa huduma</th>
                <th>Risiti</th>
                <th>Huduma</th>
                <th className="text-right">Units</th>
                <th className="text-right">Bila VAT</th>
                <th className="text-right">VAT 18%</th>
                <th className="text-right">Jumla</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-2 whitespace-nowrap">{r.purchase_date}</td>
                  <td>{r.supplier}</td>
                  <td>{r.receipt_number || '—'}</td>
                  <td className="uppercase text-xs">{r.channel}</td>
                  <td className="text-right tabular-nums">{Number(r.units).toLocaleString()}</td>
                  <td className="text-right tabular-nums">{money(r.amount_excl_vat)}</td>
                  <td className="text-right tabular-nums">{money(r.vat_amount)}</td>
                  <td className="text-right tabular-nums font-medium">{money(r.total_amount)}</td>
                  <td className="text-right whitespace-nowrap">
                    {r.receipt_url && (
                      <Button size="icon" variant="ghost" onClick={() => openReceipt(r.receipt_url!)} title="Fungua risiti">
                        <FileDown className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(r)} title="Futa">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
        <Receipt className="w-3.5 h-3.5" /> VAT inahesabiwa 18% ndani ya bei ya kuuza/kununua (jumla × 18/118).
      </p>
    </DashboardLayout>
  );
};

export default Purchases;
