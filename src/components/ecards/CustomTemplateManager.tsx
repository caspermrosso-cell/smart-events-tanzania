import { useRef, useState } from 'react';
import { Upload, Trash2, Loader2, Plus, Globe2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { CustomTemplate } from './CustomTemplateRenderer';

type Props = {
  userId?: string;
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function CustomTemplateManager({ userId, selectedId, onSelect }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [textColor, setTextColor] = useState<'light' | 'dark'>('light');
  const [overlayStyle, setOverlayStyle] = useState('gradient-bottom');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['ecard-custom-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ecard_templates' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) as CustomTemplate[] & { user_id: string; is_global: boolean }[];
    },
  });

  const reset = () => {
    setName(''); setFile(null); setTextColor('light'); setOverlayStyle('gradient-bottom');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!userId) return toast.error('Lazima uingie kwanza');
    if (!name.trim() || !file) return toast.error('Jaza jina na chagua picha');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('ecard-templates').upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('ecard-templates').getPublicUrl(path);
      const { error: insErr } = await supabase.from('ecard_templates' as any).insert({
        user_id: userId,
        name: name.trim(),
        image_url: publicUrl,
        text_color: textColor,
        overlay_style: overlayStyle,
      } as any);
      if (insErr) throw insErr;
      toast.success('Template imepakiwa!');
      qc.invalidateQueries({ queryKey: ['ecard-custom-templates'] });
      reset(); setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Imeshindikana kupakia');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (t: any) => {
    if (!confirm(`Futa template "${t.name}"?`)) return;
    try {
      const { error } = await supabase.from('ecard_templates' as any).delete().eq('id', t.id);
      if (error) throw error;
      toast.success('Template imefutwa');
      qc.invalidateQueries({ queryKey: ['ecard-custom-templates'] });
      if (selectedId === `custom:${t.id}`) onSelect('royal-emerald');
    } catch (e: any) {
      toast.error(e.message || 'Imeshindikana');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Templates Zako</Label>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
              <Plus className="w-3.5 h-3.5" /> Pakia Mpya
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pakia Template Mpya</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Jina la Template</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Mfano: Harusi ya Kifahari" />
              </div>
              <div>
                <Label>Picha (background ya kadi)</Label>
                <Input ref={fileRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-muted-foreground mt-1">Pendekezo: 900×1200px (3:4) ili kuonekana vizuri.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Rangi ya Maandishi</Label>
                  <Select value={textColor} onValueChange={(v: any) => setTextColor(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Nyeupe (light)</SelectItem>
                      <SelectItem value="dark">Nyeusi (dark)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Overlay</Label>
                  <Select value={overlayStyle} onValueChange={setOverlayStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gradient-bottom">Gradient (chini)</SelectItem>
                      <SelectItem value="gradient-full">Gradient (kamili)</SelectItem>
                      <SelectItem value="dark-veil">Veil Nyeusi</SelectItem>
                      <SelectItem value="light-veil">Veil Nyeupe</SelectItem>
                      <SelectItem value="none">Hakuna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { reset(); setOpen(false); }}>Ghairi</Button>
              <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Pakia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-lg">
          Hakuna templates zako bado. Bonyeza "Pakia Mpya" kuanza.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {templates.map((t: any) => {
            const id = `custom:${t.id}`;
            const isSelected = selectedId === id;
            return (
              <div key={t.id} className="relative group">
                <button
                  onClick={() => onSelect(id)}
                  className={`w-full p-1.5 rounded-lg border-2 text-center text-xs font-medium transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[3/4] rounded overflow-hidden mb-1.5 bg-muted">
                    <img src={t.image_url} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex items-center justify-center gap-1 truncate">
                    {t.is_global && <Globe2 className="w-3 h-3 text-primary" />}
                    <span className="truncate">{t.name}</span>
                  </div>
                </button>
                {t.user_id === userId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                    className="absolute top-1 right-1 p-1 rounded-md bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Futa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}