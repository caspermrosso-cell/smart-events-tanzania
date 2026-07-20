import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';

interface EventFormProps {
  event?: any;
  onSuccess: () => void;
}

const EventForm = ({ event, onSuccess }: EventFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_date: event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
    venue: event?.venue || '',
    event_type: event?.event_type || 'wedding',
    status: event?.status || 'draft',
    max_guests: event?.max_guests?.toString() || '',
    budget: event?.budget?.toString() || '',
    sms_allocation: event?.sms_allocation?.toString() || '0',
    photo_url: event?.photo_url || '',
    show_on_website: event?.show_on_website || false,
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Picha ni kubwa mno (max 5MB)');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('event-photos').upload(path, file, { upsert: false });
    if (upErr) {
      toast.error('Imeshindikana kupakia picha');
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(path);
    setForm((f) => ({ ...f, photo_url: publicUrl }));
    setUploading(false);
    toast.success('Picha imepakiwa');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: new Date(form.event_date).toISOString(),
      venue: form.venue || null,
      event_type: form.event_type,
      status: form.status,
      max_guests: form.max_guests ? parseInt(form.max_guests) : null,
      budget: form.budget ? parseFloat(form.budget) : 0,
      sms_allocation: form.sms_allocation ? parseInt(form.sms_allocation) : 0,
      photo_url: form.photo_url || null,
      user_id: user.id,
    };

    let error;
    if (event) {
      ({ error } = await supabase.from('events').update(payload).eq('id', event.id));
    } else {
      ({ error } = await supabase.from('events').insert(payload));
    }

    setLoading(false);
    if (error) {
      toast.error('Imeshindikana kuhifadhi tukio');
      return;
    }

    toast.success(event ? 'Tukio limesasishwa' : 'Tukio limeundwa');
    queryClient.invalidateQueries({ queryKey: ['events'] });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Picha ya Mwenye Tukio</Label>
        <div className="mt-1 flex items-center gap-3">
          {form.photo_url ? (
            <div className="relative">
              <img src={form.photo_url} alt="Mwenye tukio" className="w-20 h-20 rounded-lg object-cover border border-border" />
              <button
                type="button"
                onClick={() => setForm({ ...form, photo_url: '' })}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            <span className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Inapakia...' : form.photo_url ? 'Badilisha' : 'Pakia Picha'}
            </span>
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="title">Jina la Tukio *</Label>
        <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mfano: Harusi ya Anna & John" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="event_type">Aina</Label>
          <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="wedding">Harusi</SelectItem>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="fundraiser">Fundraiser</SelectItem>
              <SelectItem value="memorial">Memorial</SelectItem>
              <SelectItem value="other">Nyingine</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Hali</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="event_date">Tarehe & Muda *</Label>
        <Input id="event_date" type="datetime-local" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
      </div>

      <div>
        <Label htmlFor="venue">Ukumbi / Mahali</Label>
        <Input id="venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Mfano: Diamond Jubilee Hall" />
      </div>

      <div>
        <Label htmlFor="description">Maelezo</Label>
        <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Maelezo ya tukio..." rows={3} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="max_guests">Wageni (Max)</Label>
          <Input id="max_guests" type="number" value={form.max_guests} onChange={(e) => setForm({ ...form, max_guests: e.target.value })} placeholder="500" />
        </div>
        <div>
          <Label htmlFor="sms_allocation">SMS Allocation</Label>
          <Input id="sms_allocation" type="number" value={form.sms_allocation} onChange={(e) => setForm({ ...form, sms_allocation: e.target.value })} placeholder="1000" />
        </div>
        <div>
          <Label htmlFor="budget">Bajeti (TZS)</Label>
          <Input id="budget" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="5000000" />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Inahifadhi...' : event ? 'Sasisha Tukio' : 'Unda Tukio'}
      </Button>
    </form>
  );
};

export default EventForm;
