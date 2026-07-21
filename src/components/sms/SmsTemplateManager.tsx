import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, FileText, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'invite', label: 'Mwaliko' },
  { id: 'reminder', label: 'Kikumbusho' },
  { id: 'thank', label: 'Shukrani' },
  { id: 'payment', label: 'Malipo' },
  { id: 'custom', label: 'Nyingine' },
];

interface Props {
  onUse?: (content: string) => void;
}

const SmsTemplateManager = ({ onUse }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [content, setContent] = useState('');
  const [newVar, setNewVar] = useState('');
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const BUILTIN_VARS = ['name', 'event', 'date'];

  const insertVariable = (rawVar: string) => {
    const v = rawVar.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!v) return;
    const token = `{${v}}`;
    const el = contentRef.current;
    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart;
      const end = el.selectionEnd ?? start;
      const next = content.slice(0, start) + token + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      setContent((c) => c + token);
    }
  };

  const addCustomVar = () => {
    const v = newVar.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!v) return toast.error('Andika jina sahihi la variable (herufi/nambari tu)');
    insertVariable(v);
    setNewVar('');
  };

  const removeVariable = (v: string) => {
    const re = new RegExp(`\\{${v}\\}`, 'g');
    setContent((c) => c.replace(re, ''));
  };

  const { data: templates = [] } = useQuery({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('custom');
    setContent('');
    setNewVar('');
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setName(t.name);
    setCategory(t.category);
    setContent(t.content);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim() || !content.trim()) {
      toast.error('Jaza jina na ujumbe wa template');
      return;
    }
    try {
      if (editingId) {
        const { error } = await supabase
          .from('sms_templates')
          .update({ name: name.trim(), category, content })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Template imesasishwa');
      } else {
        const { error } = await supabase
          .from('sms_templates')
          .insert({ user_id: user?.id, name: name.trim(), category, content });
        if (error) throw error;
        toast.success('Template imehifadhiwa');
      }
      qc.invalidateQueries({ queryKey: ['sms-templates'] });
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || 'Imeshindikana kuhifadhi');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Hakika unataka kufuta template hii?')) return;
    const { error } = await supabase.from('sms_templates').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Template imefutwa');
    qc.invalidateQueries({ queryKey: ['sms-templates'] });
  };

  const charCount = content.length;
  const smsCount = charCount === 0 ? 0 : charCount <= 160 ? 1 : Math.ceil(charCount / 153);
  const detectedVars = [...new Set((content.match(/\{([a-zA-Z0-9_]+)\}/g) || []).map((m) => m.slice(1, -1)))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Templates Zangu ({templates.length})</span>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2" onClick={openNew}>
              <Plus className="w-3.5 h-3.5" /> Tengeneza
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Hariri Template' : 'Tengeneza Template Mpya'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Jina la Template</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mfano: Mwaliko Harusi" />
              </div>
              <div>
                <Label>Aina</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ujumbe</Label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  ref={(el) => { contentRef.current = el; }}
                  rows={5}
                  placeholder="Tumia {name}, {event}, {date}, au variables zako mfano {amount}"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{charCount} herufi • SMS {smsCount}</span>
                  {detectedVars.length > 0 && <span>Variables: {detectedVars.map((v) => `{${v}}`).join(', ')}</span>}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Variables</Label>
                <div className="flex flex-wrap gap-1.5">
                  {BUILTIN_VARS.map((v) => (
                    <Button
                      key={v}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => insertVariable(v)}
                    >
                      + {`{${v}}`}
                    </Button>
                  ))}
                  {detectedVars
                    .filter((v) => !BUILTIN_VARS.includes(v))
                    .map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-primary/10 text-primary text-xs border border-primary/20"
                      >
                        {`{${v}}`}
                        <button
                          type="button"
                          onClick={() => removeVariable(v)}
                          className="hover:text-destructive"
                          title="Ondoa"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newVar}
                    onChange={(e) => setNewVar(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomVar();
                      }
                    }}
                    placeholder="Jina la variable mpya (mf. amount, reference)"
                    className="h-8 text-sm"
                  />
                  <Button type="button" size="sm" onClick={addCustomVar} className="gap-1">
                    <Plus className="w-3.5 h-3.5" /> Ongeza
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Bonyeza variable kuiweka mahali pointer ilipo kwenye ujumbe. Wakati wa kutuma, jaza thamani kwa kila mpokeaji au tumia safu wima kwenye Excel.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Ghairi</Button>
              <Button onClick={save}>{editingId ? 'Sasisha' : 'Hifadhi'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded-lg">
          Bado hujatengeneza template. Bonyeza "Tengeneza" kuanza.
        </p>
      ) : (
        <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          {templates.map((t) => (
            <div key={t.id} className="p-2.5 rounded-lg border border-border hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                    <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary rounded px-1.5 py-0.5">
                      {CATEGORIES.find((c) => c.id === t.category)?.label || t.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.content}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {onUse && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Tumia" onClick={() => onUse(t.content)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Hariri" onClick={() => openEdit(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Futa" onClick={() => remove(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmsTemplateManager;