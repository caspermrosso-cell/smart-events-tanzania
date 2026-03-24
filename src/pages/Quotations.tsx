import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Download, Eye, ArrowRight, Trash2, Receipt, Contact, ImageDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DocumentPreview, { type DocItem, type DocumentData } from '@/components/documents/DocumentPreview';
import ContactPicker from '@/components/ContactPicker';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type LineItem = { description: string; qty: number; unitPrice: number };

const emptyItem = (): LineItem => ({ description: '', qty: 1, unitPrice: 0 });

const Quotations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previewRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState('quotations');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'quotation' | 'invoice'>('quotation');
  const [previewDoc, setPreviewDoc] = useState<DocumentData | null>(null);

  // Form state
  const [selectedEvent, setSelectedEvent] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [vatEnabled, setVatEnabled] = useState(true);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Receipt form
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState('');
  const [receiptPaymentMethod, setReceiptPaymentMethod] = useState('selcom');
  const [receiptAmountInWords, setReceiptAmountInWords] = useState('');

  const { data: events = [] } = useQuery({
    queryKey: ['events-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title, event_type, subscription_amount, venue').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: quotations = [], isLoading: loadingQ } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('quotations').select('*, events(title)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: invoices = [], isLoading: loadingI } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, events(title), quotations(quotation_number)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: receipts = [], isLoading: loadingR } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('receipts').select('*, invoices(invoice_number, client_name, contact_person, client_address, client_email, client_phone, items, grand_total, event_id, events(title))').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['packages-for-quotation'],
    queryFn: async () => {
      const { data, error } = await supabase.from('packages').select('id, title, price, features').eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const selectedEventData = events.find((e: any) => e.id === selectedEvent);
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vatAmount = vatEnabled ? Math.round(subtotal * 0.18) : 0;
  const discountAmount = discountType === 'percentage' ? Math.round(subtotal * discountValue / 100) : discountValue;
  const grandTotal = subtotal + vatAmount - discountAmount;

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedEvent('');
    setContactPerson('');
    setClientAddress('');
    setClientEmail('');
    setClientPhone('');
    setTinNumber('');
    setItems([emptyItem()]);
    setVatEnabled(true);
    setDiscountType('percentage');
    setDiscountValue(0);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedEvent || !selectedEventData) throw new Error('Missing data');
      const { data: numData, error: numErr } = await supabase.rpc(
        formType === 'quotation' ? 'next_quotation_number' : 'next_invoice_number'
      );
      if (numErr) throw numErr;

      const docItems: DocItem[] = items.map(i => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice, total: i.qty * i.unitPrice }));
      const payload = {
        [formType === 'quotation' ? 'quotation_number' : 'invoice_number']: numData,
        event_id: selectedEvent,
        client_name: selectedEventData.title,
        contact_person: contactPerson,
        client_address: clientAddress,
        client_email: clientEmail,
        client_phone: clientPhone,
        items: docItems as any,
        subtotal, vat_enabled: vatEnabled, vat_amount: vatAmount,
        discount_type: discountType, discount_value: discountValue, discount_amount: discountAmount,
        grand_total: grandTotal,
        user_id: user.id,
      };

      const table = formType === 'quotation' ? 'quotations' : 'invoices';
      const { error } = await supabase.from(table).insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [formType === 'quotation' ? 'quotations' : 'invoices'] });
      toast.success(formType === 'quotation' ? 'Quotation imehifadhiwa!' : 'Invoice imehifadhiwa!');
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertToInvoice = useMutation({
    mutationFn: async (q: any) => {
      if (!user) throw new Error('Not authenticated');
      const { data: numData, error: numErr } = await supabase.rpc('next_invoice_number');
      if (numErr) throw numErr;
      const { error } = await supabase.from('invoices').insert({
        invoice_number: numData,
        quotation_id: q.id,
        event_id: q.event_id,
        client_name: q.client_name,
        contact_person: q.contact_person,
        client_address: q.client_address,
        client_email: q.client_email,
        client_phone: q.client_phone,
        items: q.items,
        subtotal: q.subtotal,
        vat_enabled: q.vat_enabled,
        vat_amount: q.vat_amount,
        discount_type: q.discount_type,
        discount_value: q.discount_value,
        discount_amount: q.discount_amount,
        grand_total: q.grand_total,
        user_id: user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Proforma Invoice imetengenezwa!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveReceipt = useMutation({
    mutationFn: async () => {
      if (!user || !receiptInvoiceId) throw new Error('Missing data');
      const inv = invoices.find((i: any) => i.id === receiptInvoiceId) as any;
      if (!inv) throw new Error('Invoice not found');
      const { data: numData, error: numErr } = await supabase.rpc('next_receipt_number');
      if (numErr) throw numErr;
      const { error } = await supabase.from('receipts').insert({
        receipt_number: numData,
        invoice_id: receiptInvoiceId,
        amount_paid: inv.grand_total,
        amount_in_words: receiptAmountInWords,
        payment_method: receiptPaymentMethod,
        remarks: `Thank you for your payment. This receipt confirms full settlement of Invoice ${inv.invoice_number}.`,
        user_id: user.id,
      } as any);
      if (error) throw error;
      await supabase.from('invoices').update({ status: 'paid' } as any).eq('id', receiptInvoiceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts', 'invoices'] });
      toast.success('Receipt imehifadhiwa!');
      setShowReceiptForm(false);
      setReceiptInvoiceId('');
      setReceiptAmountInWords('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const buildPreviewData = useCallback((doc: any, type: 'quotation' | 'invoice' | 'receipt'): DocumentData => {
    if (type === 'receipt') {
      const inv = doc.invoices || {};
      return {
        type: 'receipt', docNumber: doc.receipt_number,
        date: new Date(doc.created_at).toLocaleDateString('en-GB'),
        clientName: inv.client_name || '', contactPerson: inv.contact_person || '',
        clientAddress: inv.client_address || '', clientEmail: inv.client_email || '', clientPhone: inv.client_phone || '',
        eventTitle: inv.events?.title || '',
        items: (inv.items || []).map((it: any) => ({ ...it, total: it.total || it.qty * it.unitPrice })),
        subtotal: doc.amount_paid, vatEnabled: false, vatAmount: 0,
        discountType: 'fixed', discountValue: 0, discountAmount: 0,
        grandTotal: doc.amount_paid, amountInWords: doc.amount_in_words,
        paymentMethod: doc.payment_method === 'selcom' ? 'Selcom Pesa' : doc.payment_method === 'bank' ? 'Bank Transfer' : doc.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash',
        remarks: doc.remarks, invoiceRef: inv.invoice_number,
      };
    }
    return {
      type, docNumber: type === 'quotation' ? doc.quotation_number : doc.invoice_number,
      date: new Date(doc.created_at).toLocaleDateString('en-GB'),
      clientName: doc.client_name, contactPerson: doc.contact_person || '',
      clientAddress: doc.client_address || '', clientEmail: doc.client_email || '', clientPhone: doc.client_phone || '',
      eventTitle: doc.events?.title || '',
      items: (doc.items || []).map((it: any) => ({ ...it, total: it.total || it.qty * it.unitPrice })),
      subtotal: doc.subtotal, vatEnabled: doc.vat_enabled, vatAmount: doc.vat_amount,
      discountType: doc.discount_type || 'percentage', discountValue: doc.discount_value,
      discountAmount: doc.discount_amount, grandTotal: doc.grand_total,
      validityDays: doc.validity_days || 14, paymentDueDays: doc.payment_due_days || 7,
    };
  }, []);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    toast.info('Inaandaa PDF...');
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 10;
      if (imgH <= pageH - 20) {
        pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH);
      } else {
        // Multi-page
        const pageCanvas = document.createElement('canvas');
        const ctx = pageCanvas.getContext('2d')!;
        const sliceH = Math.floor((canvas.width * (pageH - 20)) / imgW);
        let srcY = 0;
        let page = 0;
        while (srcY < canvas.height) {
          const h = Math.min(sliceH, canvas.height - srcY);
          pageCanvas.width = canvas.width;
          pageCanvas.height = h;
          ctx.drawImage(canvas, 0, srcY, canvas.width, h, 0, 0, canvas.width, h);
          if (page > 0) pdf.addPage();
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 10, 10, imgW, (h * imgW) / canvas.width);
          srcY += h;
          page++;
        }
      }
      pdf.save(`${previewDoc?.docNumber || 'document'}.pdf`);
      toast.success('PDF imepakuliwa!');
    } catch {
      toast.error('Imeshindikana kutengeneza PDF');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const { error } = await supabase.from(table as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations', 'invoices', 'receipts'] });
      toast.success('Imefutwa!');
    },
  });

  const handleEventSelect = (v: string) => {
    setSelectedEvent(v);
    const ev = events.find((e: any) => e.id === v);
    if (ev) {
      const pkg = (ev as any).subscription_amount || 0;
      if (pkg > 0) {
        setItems([{ description: `${(ev as any).event_type} - ${(ev as any).title}`, qty: 1, unitPrice: pkg }]);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Nyaraka za Fedha</h2>
          <p className="text-sm text-muted-foreground">Quotations, Invoices & Receipts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFormType('quotation'); setShowForm(true); }} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Quotation
          </Button>
          <Button onClick={() => { setFormType('invoice'); setShowForm(true); }} size="sm" variant="outline" className="gap-1">
            <Plus className="w-4 h-4" /> Invoice
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="quotations">Quotations ({quotations.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="receipts">Receipts ({receipts.length})</TabsTrigger>
        </TabsList>

        {/* Quotations List */}
        <TabsContent value="quotations">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Namba</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tukio</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tarehe</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Jumla</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Vitendo</th>
                </tr></thead>
                <tbody>
                  {loadingQ ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Inapakia...</td></tr> :
                  quotations.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Hakuna quotations</td></tr> :
                  quotations.map((q: any) => (
                    <tr key={q.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground">{q.quotation_number}</td>
                      <td className="p-3 text-foreground">{q.events?.title || '-'}</td>
                      <td className="p-3 text-muted-foreground">{new Date(q.created_at).toLocaleDateString('en-GB')}</td>
                      <td className="p-3 text-right font-semibold text-foreground">TZS {Number(q.grand_total).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(buildPreviewData(q, 'quotation'))} title="Angalia"><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => convertToInvoice.mutate(q)} title="Badilisha kuwa Invoice"><ArrowRight className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ table: 'quotations', id: q.id })} title="Futa"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Invoices List */}
        <TabsContent value="invoices">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Namba</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tukio</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Hali</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tarehe</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Jumla</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Vitendo</th>
                </tr></thead>
                <tbody>
                  {loadingI ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Inapakia...</td></tr> :
                  invoices.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Hakuna invoices</td></tr> :
                  invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground">{inv.invoice_number}</td>
                      <td className="p-3 text-foreground">{inv.events?.title || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString('en-GB')}</td>
                      <td className="p-3 text-right font-semibold text-foreground">TZS {Number(inv.grand_total).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(buildPreviewData(inv, 'invoice'))} title="Angalia"><Eye className="w-4 h-4" /></Button>
                          {inv.status !== 'paid' && (
                            <Button size="sm" variant="ghost" onClick={() => { setReceiptInvoiceId(inv.id); setShowReceiptForm(true); }} title="Tengeneza Receipt"><Receipt className="w-4 h-4 text-green-600" /></Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ table: 'invoices', id: inv.id })} title="Futa"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Receipts List */}
        <TabsContent value="receipts">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Namba</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Njia</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tarehe</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Kiasi</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Vitendo</th>
                </tr></thead>
                <tbody>
                  {loadingR ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Inapakia...</td></tr> :
                  receipts.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Hakuna receipts</td></tr> :
                  receipts.map((r: any) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground">{r.receipt_number}</td>
                      <td className="p-3 text-foreground">{r.invoices?.invoice_number || '-'}</td>
                      <td className="p-3 text-muted-foreground">{r.payment_method}</td>
                      <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                      <td className="p-3 text-right font-semibold text-foreground">TZS {Number(r.amount_paid).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(buildPreviewData(r, 'receipt'))} title="Angalia"><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate({ table: 'receipts', id: r.id })} title="Futa"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Quotation/Invoice Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formType === 'quotation' ? 'Tengeneza Quotation' : 'Tengeneza Proforma Invoice'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Tukio (Quotation Title) *</Label>
                <Select value={selectedEvent} onValueChange={handleEventSelect}>
                  <SelectTrigger><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
                  <SelectContent>{events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>TIN Number</Label>
                <Input value={tinNumber} onChange={e => setTinNumber(e.target.value)} placeholder="TIN Number" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3">Client Information</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Contact Person *</Label><Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Jina la contact person" /></div>
                <div><Label>Address</Label><Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Anwani" /></div>
                <div><Label>Email</Label><Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email" /></div>
                <div>
                  <Label>Phone</Label>
                  <div className="flex gap-1">
                    <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Simu" />
                    <ContactPicker size="icon" variant="outline" onPick={(c) => {
                      if (c.phone) setClientPhone(c.phone.replace(/[\s\-()]/g, ''));
                      if (c.name && !contactPerson) setContactPerson(c.name);
                      if (c.email && !clientEmail) setClientEmail(c.email);
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Huduma / Products</Label>
                <div className="flex gap-2">
                  <Select onValueChange={(pkgId) => {
                    const pkg = packages.find((p: any) => p.id === pkgId);
                    if (pkg) {
                      const features = (Array.isArray(pkg.features) ? pkg.features : []) as string[];
                      const desc = `${pkg.title}${features.length > 0 ? ' (' + features.join(', ') + ')' : ''}`;
                      const newItem: LineItem = { description: desc, qty: 1, unitPrice: Number(pkg.price) || 0 };
                      const hasContent = items.some(it => it.description.trim() !== '');
                      setItems(hasContent ? [...items, newItem] : [newItem]);
                      toast.success(`"${pkg.title}" imeongezwa`);
                    }
                  }}>
                    <SelectTrigger className="w-[200px] h-8 text-xs">
                      <SelectValue placeholder="📦 Chagua kutoka Vifurushi" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg: any) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.title} - TZS {Number(pkg.price).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1"><Plus className="w-3 h-3" /> Ongeza</Button>
                </div>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min={1} placeholder="Qty" value={item.qty} onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-3">
                      <Input type="number" min={0} placeholder="Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-1 text-right text-sm font-medium text-foreground pt-2">
                      {(item.qty * item.unitPrice).toLocaleString()}
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-3">
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">TZS {subtotal.toLocaleString()}</span></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Switch checked={vatEnabled} onCheckedChange={setVatEnabled} /><Label className="text-sm">VAT (18%)</Label></div>
                {vatEnabled && <span className="text-sm font-medium">TZS {vatAmount.toLocaleString()}</span>}
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm whitespace-nowrap">Discount:</Label>
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Asilimia %</SelectItem>
                    <SelectItem value="fixed">Kiasi (TZS)</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={0} className="w-24" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)} />
                {discountAmount > 0 && <span className="text-sm text-destructive">- TZS {discountAmount.toLocaleString()}</span>}
              </div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2"><span>Grand Total:</span><span className="text-primary">TZS {grandTotal.toLocaleString()}</span></div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saveMutation.isPending || !selectedEvent || !contactPerson} className="flex-1">
                {saveMutation.isPending ? 'Inahifadhi...' : 'Hifadhi'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Ghairi</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Form */}
      <Dialog open={showReceiptForm} onOpenChange={setShowReceiptForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tengeneza Payment Receipt</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveReceipt.mutate(); }} className="space-y-4">
            <div>
              <Label>Invoice</Label>
              <Select value={receiptInvoiceId} onValueChange={setReceiptInvoiceId}>
                <SelectTrigger><SelectValue placeholder="Chagua invoice" /></SelectTrigger>
                <SelectContent>
                  {invoices.filter((i: any) => i.status !== 'paid').map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>{i.invoice_number} - TZS {Number(i.grand_total).toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Njia ya Malipo</Label>
              <Select value={receiptPaymentMethod} onValueChange={setReceiptPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="selcom">Selcom Pesa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kiasi kwa Maneno</Label>
              <Input value={receiptAmountInWords} onChange={e => setReceiptAmountInWords(e.target.value)} placeholder="Mfano: Milioni moja na laki tano" />
            </div>
            <Button type="submit" disabled={saveReceipt.isPending || !receiptInvoiceId} className="w-full">
              {saveReceipt.isPending ? 'Inahifadhi...' : 'Hifadhi Receipt'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background border-b border-border">
            <h3 className="font-semibold text-foreground">{previewDoc?.docNumber}</h3>
            <Button onClick={handleDownloadPDF} size="sm" className="gap-2"><Download className="w-4 h-4" /> Download PDF</Button>
          </div>
          {previewDoc && <DocumentPreview ref={previewRef} data={previewDoc} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Quotations;
