import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, Upload, Loader2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { resolvePhotoUrls, resolvePhotoUrl } from '@/lib/testimonialPhoto';

type Testimonial = {
  id: string;
  client_name: string;
  client_role: string | null;
  event_type: string | null;
  photo_url: string | null;
  quote: string;
  recommendation: string | null;
  rating: number;
  is_published: boolean;
  display_order: number;
  resolved_photo_url?: string | null;
};

const EVENT_TYPES = ['wedding', 'birthday', 'corporate', 'fundraiser', 'memorial', 'other'];

const emptyForm = {
  client_name: '',
  client_role: '',
  event_type: 'wedding',
  photo_url: '',
  quote: '',
  recommendation: '',
  rating: 5,
  is_published: true,
  display_order: 0,
};

const TestimonialsPage = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    let cancelled = false;
    if (!form.photo_url) { setFormPhotoPreview(null); return; }
    resolvePhotoUrl(form.photo_url).then((url) => { if (!cancelled) setFormPhotoPreview(url); });
    return () => { cancelled = true; };
  }, [form.photo_url]);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('testimonials')
        .select('*')
        .is('deleted_at', null)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      const list = (data || []) as Testimonial[];
      return await resolvePhotoUrls(list);
    },
  });

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm({
      client_name: t.client_name,
      client_role: t.client_role || '',
      event_type: t.event_type || 'wedding',
      photo_url: t.photo_url || '',
      quote: t.quote,
      recommendation: t.recommendation || '',
      rating: t.rating,
      is_published: t.is_published,
      display_order: t.display_order,
    });
    setOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('testimonial-photos').upload(path, file, { upsert: false });
      if (error) throw error;
      // Store only the storage path — public component and admin resolve to signed URLs
      setForm(f => ({ ...f, photo_url: path }));
      toast.success(isEn ? 'Photo uploaded' : 'Picha imepakiwa');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.client_name.trim() || !form.quote.trim()) {
      toast.error(isEn ? 'Name and quote are required' : 'Jina na ushuhuda vinahitajika');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client_name: form.client_name.trim(),
        client_role: form.client_role.trim() || null,
        event_type: form.event_type || null,
        photo_url: form.photo_url || null,
        quote: form.quote.trim(),
        recommendation: form.recommendation.trim() || null,
        rating: form.rating,
        is_published: form.is_published,
        display_order: Number(form.display_order) || 0,
      };
      if (editingId) {
        const { error } = await (supabase as any).from('testimonials').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success(isEn ? 'Testimonial updated' : 'Ushuhuda umeboreshwa');
      } else {
        const { error } = await (supabase as any).from('testimonials').insert(payload);
        if (error) throw error;
        toast.success(isEn ? 'Testimonial added' : 'Ushuhuda umeongezwa');
      }
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin-testimonials'] });
      qc.invalidateQueries({ queryKey: ['client-testimonials'] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isEn ? 'Delete this testimonial?' : 'Futa ushuhuda huu?')) return;
    const { error } = await (supabase as any)
      .from('testimonials')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(isEn ? 'Moved to Recycle Bin' : 'Imehamishwa Recycle Bin');
    qc.invalidateQueries({ queryKey: ['admin-testimonials'] });
    qc.invalidateQueries({ queryKey: ['client-testimonials'] });
  };

  const togglePublish = async (t: Testimonial) => {
    const { error } = await (supabase as any)
      .from('testimonials')
      .update({ is_published: !t.is_published })
      .eq('id', t.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin-testimonials'] });
    qc.invalidateQueries({ queryKey: ['client-testimonials'] });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {isEn ? 'Client Testimonials' : 'Shukrani za Wateja'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEn ? 'Manage thank-you messages and recommendations shown on the website.' : 'Simamia shukrani na mapendekezo yanayoonyeshwa kwenye website.'}
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            {isEn ? 'New Testimonial' : 'Ongeza Ushuhuda'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl">
            <User className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              {isEn ? 'No testimonials yet. Add your first one.' : 'Hakuna ushuhuda bado. Ongeza wa kwanza.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => scrollBy('left')}
              aria-label="Scroll left"
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-background border border-border shadow-warm hover:bg-muted transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => scrollBy('right')}
              aria-label="Scroll right"
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-background border border-border shadow-warm hover:bg-muted transition-all"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-hide"
            >
            {testimonials.map((t) => (
              <div key={t.id} className="glass-card rounded-2xl overflow-hidden flex flex-col flex-shrink-0 snap-start basis-full sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]">
                {t.resolved_photo_url ? (
                  <div className="aspect-[4/5] w-full overflow-hidden bg-muted flex items-center justify-center">
                    <img src={t.resolved_photo_url} alt={t.client_name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="aspect-[4/5] w-full bg-secondary/40 flex items-center justify-center">
                    <User className="w-16 h-16 text-primary/40" />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground text-base">{t.client_name}</h3>
                      {t.client_role && <p className="text-xs text-muted-foreground">{t.client_role}</p>}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 italic mt-2 line-clamp-2">"{t.quote}"</p>
                  {t.recommendation && (
                    <p className="text-sm text-foreground/90 font-medium mt-2 line-clamp-1">{t.recommendation}</p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch checked={t.is_published} onCheckedChange={() => togglePublish(t)} />
                      <span className="text-xs text-muted-foreground">
                        {t.is_published ? (isEn ? 'Published' : 'Imechapishwa') : (isEn ? 'Hidden' : 'Imefichwa')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => openEdit(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? (isEn ? 'Edit Testimonial' : 'Hariri Ushuhuda') : (isEn ? 'New Testimonial' : 'Ushuhuda Mpya')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isEn ? 'Client Name' : 'Jina la Mteja'} *</Label>
                  <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                </div>
                <div>
                  <Label>{isEn ? 'Role / Title' : 'Nafasi'}</Label>
                  <Input placeholder={isEn ? 'e.g. Bride, CEO' : 'mf. Bibi Harusi'} value={form.client_role} onChange={(e) => setForm({ ...form, client_role: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isEn ? 'Event Type' : 'Aina ya Tukio'}</Label>
                  <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(et => <SelectItem key={et} value={et}>{et}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isEn ? 'Rating' : 'Ukadiriaji'}</Label>
                  <div className="flex gap-1 pt-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
                        <Star className={`w-6 h-6 ${n <= form.rating ? 'fill-primary text-primary' : 'text-muted-foreground/40'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>{isEn ? 'Photo' : 'Picha'}</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.photo_url && formPhotoPreview && (
                    <img src={formPhotoPreview} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                  )}
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />
                    <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span className="text-sm">{isEn ? 'Upload photo' : 'Pakia picha'}</span>
                    </div>
                  </label>
                  {form.photo_url && (
                    <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, photo_url: '' })}>
                      {isEn ? 'Remove' : 'Ondoa'}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label>{isEn ? 'Thank-you Quote' : 'Ushuhuda / Shukrani'} *</Label>
                <Textarea rows={3} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })}
                  placeholder={isEn ? 'What the client said about our service...' : 'Mteja anachosema kuhusu huduma...'} />
              </div>

              <div>
                <Label>{isEn ? 'Recommendation' : 'Pendekezo'}</Label>
                <Textarea rows={2} value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
                  placeholder={isEn ? 'Would they recommend us? Add their recommendation...' : 'Wangependekeza? Ongeza pendekezo lao...'} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isEn ? 'Display Order' : 'Mpangilio'}</Label>
                  <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                  <Label>{isEn ? 'Publish on website' : 'Chapisha kwenye website'}</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{isEn ? 'Cancel' : 'Ghairi'}</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEn ? 'Save' : 'Hifadhi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TestimonialsPage;