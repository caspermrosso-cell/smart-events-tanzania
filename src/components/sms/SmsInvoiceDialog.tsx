import { useEffect, useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId?: string | null;
  eventTitle?: string;
  units: number; // total message units sent
  serviceName?: string; // e.g. 'SMS' or 'WhatsApp'
  storageKey?: string; // localStorage key for remembered unit price
}

const SmsInvoiceDialog = ({ open, onOpenChange, eventId, eventTitle, units, serviceName = 'SMS', storageKey = 'sms_unit_price' }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(units);
  const [unitPrice, setUnitPrice] = useState(100);
  const [clientName, setClientName] = useState(eventTitle || '');
  const [contactPerson, setContactPerson] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vatEnabled, setVatEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQty(units);
    setClientName(eventTitle || '');
    const stored = Number(localStorage.getItem(storageKey));
    setUnitPrice(stored > 0 ? stored : 100);
  }, [open, units, eventTitle]);

  const subtotal = useMemo(() => Math.max(0, Math.round(qty * unitPrice)), [qty, unitPrice]);
  const vatAmount = vatEnabled ? Math.round(subtotal * 0.18) : 0;
  const grandTotal = subtotal + vatAmount;

  const save = async () => {
    if (!user) return toast.error('Huna ruhusa. Ingia tena.');
    if (!clientName.trim()) return toast.error('Weka jina la mteja');
    if (qty <= 0 || unitPrice <= 0) return toast.error('Weka idadi na bei sahihi');
    setSaving(true);
    try {
      localStorage.setItem(storageKey, String(unitPrice));
      const { data: numData, error: numErr } = await supabase.rpc('next_invoice_number');
      if (numErr) throw numErr;
      const { error } = await supabase.from('invoices').insert({
        invoice_number: numData,
        event_id: eventId || null,
        client_name: clientName.trim(),
        contact_person: contactPerson || null,
        client_phone: clientPhone || null,
        items: [{
          description: `Huduma ya ${serviceName}${eventTitle ? ` - ${eventTitle}` : ''}`,
          qty,
          unitPrice,
          total: subtotal,
        }] as any,
        subtotal,
        vat_enabled: vatEnabled,
        vat_amount: vatAmount,
        discount_type: 'percentage',
        discount_value: 0,
        discount_amount: 0,
        grand_total: grandTotal,
        user_id: user.id,
      } as any);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`Invoice ${numData} imetengenezwa — TZS ${grandTotal.toLocaleString()}`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Imeshindikana kutengeneza invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Tengeneza Invoice ya {serviceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Jina la mteja</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Mwakilishi</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Hiari" />
            </div>
            <div>
              <Label className="text-xs">Simu</Label>
              <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+255..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Idadi ya {serviceName}</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Bei kwa {serviceName} (TZS)</Label>
              <Input type="number" min={1} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
            <Label className="text-sm">VAT (18%)</Label>
          </div>

          <div className="rounded-lg border border-border p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Jumla ndogo</span><span>TZS {subtotal.toLocaleString()}</span></div>
            {vatEnabled && <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span>TZS {vatAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between font-semibold text-foreground"><span>Jumla kuu</span><span>TZS {grandTotal.toLocaleString()}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Ghairi</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Inahifadhi...' : 'Hifadhi Invoice'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmsInvoiceDialog;
