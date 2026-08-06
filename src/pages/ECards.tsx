import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon, Type, QrCode, Sparkles, Download, Trash2, Copy,
  BringToFront, SendToBack, Save, RotateCcw, Users, Loader2, Send,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import CardCanvas from '@/components/ecards/CardCanvas';
import { buildQrPayload, CARD_H, CARD_W, CardData, CardElement, FONT_OPTIONS, newElement, TOKENS, uid } from '@/components/ecards/cardTypes';

const STORAGE_KEY = 'ecard-studio-design';

const DEFAULT_ELEMENTS: CardElement[] = [
  { ...newElement('logo'), y: 70, x: 375, w: 150, h: 150 },
  { ...newElement('text'), id: uid(), y: 300, text: '{tukio}', fontSize: 48, weight: 700, color: '#F5E6C8' },
  { ...newElement('text'), id: uid(), y: 470, text: 'Mgeni Rasmi', fontSize: 28, weight: 400, color: '#ffffff', opacity: 0.85 },
  { ...newElement('text'), id: uid(), y: 540, text: '{jina}', fontSize: 62, weight: 700, color: '#ffffff' },
  { ...newElement('text'), id: uid(), y: 660, text: '{tarehe}\n{mahali}', fontSize: 30, h: 120, weight: 400, color: '#ffffff' },
  { ...newElement('qr'), x: 345, y: 880 },
  { ...newElement('text'), id: uid(), y: 1110, text: 'Kadi Na. {kadi}', fontSize: 26, weight: 500, color: '#ffffff' },
];

const ECards = () => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [background, setBackground] = useState<string | null>(null);
  const [overlay, setOverlay] = useState(0.35);
  const [elements, setElements] = useState<CardElement[]>(DEFAULT_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [previewGuestId, setPreviewGuestId] = useState<string>('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(0.42);

  // WhatsApp sending
  const [waOpen, setWaOpen] = useState(false);
  const [waFrom, setWaFrom] = useState('255736670202');
  const [waTemplateId, setWaTemplateId] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waProgress, setWaProgress] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fit = () => {
      const w = wrapRef.current?.clientWidth ?? 500;
      setScale(Math.min(0.65, Math.max(0.22, (w - 24) / CARD_W)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d.elements?.length) setElements(d.elements);
      if (typeof d.overlay === 'number') setOverlay(d.overlay);
      if (d.background) setBackground(d.background);
    } catch { /* ignore */ }
  }, []);

  const { data: events = [] } = useQuery({
    queryKey: ['ecard-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, venue')
        .is('deleted_at', null)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['ecard-guests', selectedEvent],
    enabled: !!selectedEvent,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('id, full_name, phone, card_number')
        .eq('event_id', selectedEvent)
        .is('deleted_at', null)
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const event = events.find((e: any) => e.id === selectedEvent) as any;
  const previewGuest = guests.find((g: any) => g.id === previewGuestId) as any;

  const buildData = (guest: any): CardData => ({
    guestName: guest?.full_name || 'Jina la Mgeni',
    cardNumber: guest?.card_number || '0001',
    title: event?.title || 'Jina la Tukio',
    dateText: event
      ? new Date(event.event_date).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Tarehe ya Tukio',
    venue: event?.venue || 'Mahali pa Tukio',
    qrValue: buildQrPayload({
      guestId: guest?.id,
      guestName: guest?.full_name,
      cardNumber: guest?.card_number,
      title: event?.title,
      dateText: event
        ? new Date(event.event_date).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'long', year: 'numeric' })
        : undefined,
      venue: event?.venue,
      eventId: selectedEvent,
    }),
  });

  const previewData = useMemo(() => buildData(previewGuest), [previewGuest, event, selectedEvent]);

  const { data: waTemplates = [] } = useQuery({
    queryKey: ['ecard-wa-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('id, beem_id, name, status, content, type')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const selected = elements.find((e) => e.id === selectedId) || null;

  const patch = (id: string, p: Partial<CardElement>) =>
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const addEl = (type: 'text' | 'qr' | 'logo') => {
    const el = newElement(type);
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };

  const removeEl = (id: string) => {
    setElements((p) => p.filter((e) => e.id !== id));
    setSelectedId(null);
  };

  // Keyboard: Delete kufuta, arrows kusogeza kipengele kilichochaguliwa
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setElements((p) => p.filter((x) => x.id !== selectedId));
        setSelectedId(null);
        return;
      }
      const step = e.shiftKey ? 20 : 4;
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0],
      };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      setElements((p) => p.map((x) => (x.id === selectedId ? { ...x, x: x.x + d[0], y: x.y + d[1] } : x)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const duplicateEl = (el: CardElement) => {
    const copy = { ...el, id: uid(), x: el.x + 24, y: el.y + 24 };
    setElements((p) => [...p, copy]);
    setSelectedId(copy.id);
  };

  const reorder = (id: string, dir: 'front' | 'back') =>
    setElements((prev) => {
      const el = prev.find((e) => e.id === id);
      if (!el) return prev;
      const rest = prev.filter((e) => e.id !== id);
      return dir === 'front' ? [...rest, el] : [el, ...rest];
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('ecard-templates').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('ecard-templates').getPublicUrl(path);
      setBackground(data.publicUrl);
      toast.success('Picha imepakiwa. Sasa unaweza kuhariri kadi.');
    } catch (err: any) {
      toast.error(err.message || 'Imeshindikana kupakia picha');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveDesign = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ elements, overlay, background }));
    toast.success('Muundo umehifadhiwa');
  };

  const resetDesign = () => {
    setElements(DEFAULT_ELEMENTS);
    setOverlay(0.35);
    setSelectedId(null);
    toast.info('Muundo umerudishwa kwa chaguo-msingi');
  };

  const captureFor = async (guest: any) => {
    setSelectedId(null);
    setPreviewGuestId(guest?.id || '');
    await new Promise((r) => setTimeout(r, 250));
    const node = cardRef.current;
    if (!node) return;
    const canvas = await html2canvas(node, { useCORS: true, backgroundColor: null, scale: 2, width: CARD_W, height: CARD_H });
    const link = document.createElement('a');
    link.download = `ecard-${(guest?.full_name || 'mgeni').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadCurrent = async () => {
    setExporting(true);
    try { await captureFor(previewGuest); } catch { toast.error('Imeshindikana kupakua kadi'); }
    finally { setExporting(false); }
  };

  const downloadSelected = async () => {
    if (selectedGuests.length === 0) return toast.error('Chagua wageni kwanza');
    setExporting(true);
    try {
      for (const id of selectedGuests) {
        const g = guests.find((x: any) => x.id === id);
        await captureFor(g);
      }
      toast.success(`Kadi ${selectedGuests.length} zimepakuliwa`);
    } catch {
      toast.error('Imeshindikana kupakua baadhi ya kadi');
    } finally {
      setExporting(false);
    }
  };

  /** Render the card for a guest and return a PNG blob. */
  const captureBlob = async (guest: any): Promise<Blob | null> => {
    setSelectedId(null);
    setPreviewGuestId(guest?.id || '');
    await new Promise((r) => setTimeout(r, 300));
    const node = cardRef.current;
    if (!node) return null;
    const canvas = await html2canvas(node, { useCORS: true, backgroundColor: null, scale: 2, width: CARD_W, height: CARD_H });
    return await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/png'));
  };

  const sendCardsWhatsApp = async () => {
    if (!user) return;
    if (!waTemplateId) return toast.error('Chagua template ya WhatsApp');
    if (!waFrom.trim()) return toast.error('Weka namba ya kutumia (from)');
    const targets = guests.filter((g: any) => selectedGuests.includes(g.id) && g.phone);
    if (targets.length === 0) return toast.error('Chagua wageni wenye namba za simu');

    setWaSending(true);
    setWaProgress(0);
    try {
      const recipients: any[] = [];
      for (let i = 0; i < targets.length; i++) {
        const g: any = targets[i];
        const blob = await captureBlob(g);
        if (!blob) continue;
        const path = `${user.id}/ecards/${selectedEvent}/${g.id}-${Date.now()}.png`;
        const { error: upErr } = await supabase.storage
          .from('whatsapp-media')
          .upload(path, blob, { contentType: 'image/png', upsert: true });
        if (upErr) throw upErr;
        const { data: signed, error: signErr } = await supabase.storage
          .from('whatsapp-media')
          .createSignedUrl(path, 60 * 60 * 24 * 30);
        if (signErr) throw signErr;
        recipients.push({
          name: g.full_name,
          phone: g.phone,
          mediaUrl: signed.signedUrl,
          params: [g.full_name || '', g.card_number || '', event?.title || ''],
        });
        setWaProgress(Math.round(((i + 1) / targets.length) * 100));
      }

      const tpl: any = waTemplates.find((t: any) => t.id === waTemplateId);
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          action: 'send-template-personalized',
          from_addr: waFrom.trim(),
          template_id: tpl?.beem_id,
          template_name: tpl?.name,
          recipients,
          userId: user.id,
          eventId: selectedEvent || null,
        },
      });
      if (error) throw error;
      const s = data?.summary || {};
      toast.success(`Zimetumwa: ${s.sent || 0}, Zimeshindwa: ${s.failed || 0}`);
      setWaOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Imeshindikana kutuma kadi kwa WhatsApp');
    } finally {
      setWaSending(false);
      setWaProgress(0);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground">
          E-Card Studio
        </motion.h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetDesign} className="gap-2"><RotateCcw className="h-4 w-4" /> Anza Upya</Button>
          <Button variant="outline" size="sm" onClick={saveDesign} className="gap-2"><Save className="h-4 w-4" /> Hifadhi Muundo</Button>
          <Button size="sm" onClick={downloadCurrent} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Pakua Kadi
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Canvas */}
        <div ref={wrapRef} className="glass-card rounded-xl p-4">
          <div className="mx-auto" style={{ width: CARD_W * scale, height: CARD_H * scale }}>
            <CardCanvas
              ref={cardRef}
              background={background}
              overlay={overlay}
              elements={elements}
              data={previewData}
              scale={scale}
              selectedId={selectedId}
              interactive
              onSelect={setSelectedId}
              onChange={patch}
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Buruta kipengele kukisogeza, tumia duara la pembeni kubadilisha ukubwa.
          </p>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <Tabs defaultValue="design">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design">Muundo</TabsTrigger>
              <TabsTrigger value="element">Kipengele</TabsTrigger>
              <TabsTrigger value="guests">Wageni</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="glass-card mt-3 space-y-4 rounded-xl p-4">
              <div>
                <Label>Picha ya Kadi (background)</Label>
                <Button variant="outline" className="mt-1 w-full gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} Pakia Picha
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <p className="mt-1 text-xs text-muted-foreground">Pendekezo: 900×1200px (3:4)</p>
              </div>

              <div>
                <Label>Giza la Picha ({Math.round(overlay * 100)}%)</Label>
                <Slider value={[overlay * 100]} max={80} step={5} onValueChange={([v]) => setOverlay(v / 100)} className="mt-2" />
              </div>

              <div>
                <Label>Ongeza Vipengele</Label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addEl('text')}><Type className="h-4 w-4" /> Maandishi</Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addEl('qr')}><QrCode className="h-4 w-4" /> QR</Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addEl('logo')}><Sparkles className="h-4 w-4" /> Logo</Button>
                </div>
              </div>

              <div>
                <Label>Tukio</Label>
                <Select value={selectedEvent} onValueChange={(v) => { setSelectedEvent(v); setPreviewGuestId(''); setSelectedGuests([]); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
                  <SelectContent>
                    {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-dashed p-3">
                <p className="mb-1 text-xs font-medium">Vigezo (tokens) unavyoweza kutumia:</p>
                <p className="text-xs text-muted-foreground">{TOKENS.join('  ·  ')}</p>
              </div>
            </TabsContent>

            <TabsContent value="element" className="glass-card mt-3 space-y-4 rounded-xl p-4">
              {!selected ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Bonyeza kipengele kwenye kadi ili kukihariri.</p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => reorder(selected.id, 'front')}><BringToFront className="h-4 w-4" /> Mbele</Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => reorder(selected.id, 'back')}><SendToBack className="h-4 w-4" /> Nyuma</Button>
                    <Button variant="outline" size="sm" onClick={() => duplicateEl(selected)}><Copy className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => removeEl(selected.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>

                  {selected.type === 'text' && (
                    <>
                      <div>
                        <Label>Maandishi</Label>
                        <textarea
                          value={selected.text}
                          onChange={(e) => patch(selected.id, { text: e.target.value })}
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <div className="mt-1 flex flex-wrap gap-1">
                          {TOKENS.map((t) => (
                            <button key={t} onClick={() => patch(selected.id, { text: `${selected.text || ''}${t}` })}
                              className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted">{t}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Ukubwa ({selected.fontSize}px)</Label>
                          <Slider value={[selected.fontSize || 40]} min={12} max={140} step={1} className="mt-2" onValueChange={([v]) => patch(selected.id, { fontSize: v })} />
                        </div>
                        <div>
                          <Label>Uzito ({selected.weight})</Label>
                          <Slider value={[selected.weight || 500]} min={300} max={800} step={100} className="mt-2" onValueChange={([v]) => patch(selected.id, { weight: v })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Rangi</Label>
                          <Input type="color" value={selected.color} onChange={(e) => patch(selected.id, { color: e.target.value })} className="mt-1 h-9 p-1" />
                        </div>
                        <div>
                          <Label>Mpangilio</Label>
                          <Select value={selected.align} onValueChange={(v: any) => patch(selected.id, { align: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Kushoto</SelectItem>
                              <SelectItem value="center">Katikati</SelectItem>
                              <SelectItem value="right">Kulia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={!!selected.shadow} onCheckedChange={(v) => patch(selected.id, { shadow: !!v })} /> Kivuli cha maandishi
                      </label>
                    </>
                  )}

                  {selected.type === 'qr' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Rangi ya QR</Label>
                        <Input type="color" value={selected.qrFg} onChange={(e) => patch(selected.id, { qrFg: e.target.value })} className="mt-1 h-9 p-1" />
                      </div>
                      <div>
                        <Label>Mandharinyuma</Label>
                        <Select value={selected.qrBg} onValueChange={(v: any) => patch(selected.id, { qrBg: v })}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="white">Nyeupe</SelectItem>
                            <SelectItem value="transparent">Uwazi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Mzunguko ({selected.rotation}°)</Label>
                      <Slider value={[selected.rotation]} min={-45} max={45} step={1} className="mt-2" onValueChange={([v]) => patch(selected.id, { rotation: v })} />
                    </div>
                    <div>
                      <Label>Uwazi ({Math.round(selected.opacity * 100)}%)</Label>
                      <Slider value={[selected.opacity * 100]} min={10} max={100} step={5} className="mt-2" onValueChange={([v]) => patch(selected.id, { opacity: v / 100 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>X</Label>
                      <Input type="number" value={selected.x} onChange={(e) => patch(selected.id, { x: Number(e.target.value) })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Y</Label>
                      <Input type="number" value={selected.y} onChange={(e) => patch(selected.id, { y: Number(e.target.value) })} className="mt-1" />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="guests" className="glass-card mt-3 space-y-3 rounded-xl p-4">
              {!selectedEvent ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Chagua tukio kwenye tab ya Muundo.</p>
              ) : guests.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Hakuna wageni kwa tukio hili.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Users className="h-4 w-4" /> {guests.length} wageni</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGuests(selectedGuests.length === guests.length ? [] : guests.map((g: any) => g.id))}>
                      {selectedGuests.length === guests.length ? 'Ondoa Wote' : 'Chagua Wote'}
                    </Button>
                  </div>
                  <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                    {guests.map((g: any) => (
                      <div key={g.id} className={`flex items-center gap-2 rounded-lg border p-2 ${previewGuestId === g.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <Checkbox
                          checked={selectedGuests.includes(g.id)}
                          onCheckedChange={() => setSelectedGuests((p) => p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id])}
                        />
                        <button className="flex-1 text-left" onClick={() => setPreviewGuestId(g.id)}>
                          <p className="text-sm font-medium text-foreground">{g.full_name}</p>
                          <p className="text-xs text-muted-foreground">Kadi: {g.card_number || '—'}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full gap-2" onClick={downloadSelected} disabled={exporting}>
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Pakua Kadi ({selectedGuests.length})
                  </Button>
                  <Button variant="secondary" className="w-full gap-2" onClick={() => setWaOpen(true)} disabled={exporting || selectedGuests.length === 0}>
                    <Send className="h-4 w-4" /> Tuma WhatsApp ({selectedGuests.length})
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Kila mgeni hupokea kadi yake binafsi (jina, kadi namba na QR yake) kupitia WhatsApp.
                  </p>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={waOpen} onOpenChange={(o) => !waSending && setWaOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tuma Kadi kwa WhatsApp</DialogTitle>
            <DialogDescription>
              Kadi ya kila mgeni itatengenezwa peke yake na kutumwa kwake kama picha ya template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Namba ya kutumia (from)</Label>
              <Input value={waFrom} onChange={(e) => setWaFrom(e.target.value)} placeholder="2557XXXXXXXX" className="mt-1" />
            </div>
            <div>
              <Label>Template ya WhatsApp (iliyoidhinishwa)</Label>
              <Select value={waTemplateId} onValueChange={setWaTemplateId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chagua template" /></SelectTrigger>
                <SelectContent>
                  {waTemplates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} {t.status ? `· ${t.status}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Template inatakiwa iwe na header ya picha (IMAGE) ili kadi ionekane.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Wageni waliochaguliwa: {guests.filter((g: any) => selectedGuests.includes(g.id) && g.phone).length}
            </p>
            {waSending && <p className="text-xs text-muted-foreground">Inatengeneza kadi… {waProgress}%</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaOpen(false)} disabled={waSending}>Ghairi</Button>
            <Button onClick={sendCardsWhatsApp} disabled={waSending} className="gap-2">
              {waSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Tuma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ECards;
