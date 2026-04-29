import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Eye, Send, Palette, ImagePlus, QrCode } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import DashboardLayout from '@/components/DashboardLayout';
import ECardPreview, { CARD_TEMPLATES } from '@/components/ecards/ECardPreview';

const ECards = () => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('royal-emerald');
  const [customMessage, setCustomMessage] = useState('Unaalikwa kwa heshima kubwa kushiriki nasi katika tukio letu maalum.');
  const [hostNames, setHostNames] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [eventPhoto, setEventPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title, event_date, venue, event_type, photo_url').order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['ecard-guests', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const { data, error } = await supabase.from('guests').select('id, full_name, phone, email').eq('event_id', selectedEvent);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEvent,
  });

  const selectedEventData = events.find((e: any) => e.id === selectedEvent);

  const toggleGuest = (id: string) => {
    setSelectedGuests(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedGuests(selectedGuests.length === guests.length ? [] : guests.map((g: any) => g.id));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEvent) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${selectedEvent}/photo.${ext}`;
      const { error: uploadError } = await supabase.storage.from('event-photos').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(path);
      await supabase.from('events').update({ photo_url: publicUrl } as any).eq('id', selectedEvent);
      setEventPhoto(publicUrl);
      toast.success('Picha imepakiwa!');
    } catch (err: any) {
      toast.error('Imeshindikana kupakia picha');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEventSelect = (v: string) => {
    setSelectedEvent(v);
    setSelectedGuests([]);
    const ev = events.find((e: any) => e.id === v);
    if (ev) {
      setVenue((ev as any).venue || '');
      setEventPhoto((ev as any).photo_url || null);
    }
  };

  const handleSend = () => {
    if (selectedGuests.length === 0) {
      toast.error('Chagua wageni wa kutumia kadi');
      return;
    }
    toast.success(`E-Cards ${selectedGuests.length} zimetumwa kwa wageni!`);
    setSelectedGuests([]);
  };

  const getGoogleMapsUrl = (v: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`;

  const buildQRData = () => {
    if (!selectedEventData) return '';
    const lines = [
      `${selectedEventData.title}`,
      `${new Date(selectedEventData.event_date).toLocaleDateString('sw-TZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      `${new Date(selectedEventData.event_date).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}`,
    ];
    if (venue) {
      lines.push(venue);
      lines.push(getGoogleMapsUrl(venue));
    }
    return lines.join('\n');
  };

  return (
    <DashboardLayout>
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground mb-6">
        E-Cards za Mwaliko
      </motion.h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Design Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" /> Buni Kadi
          </h3>

          <div>
            <Label>Tukio</Label>
            <Select value={selectedEvent} onValueChange={handleEventSelect}>
              <SelectTrigger><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
              <SelectContent>
                {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Muundo wa Kadi</Label>
            <div className="grid grid-cols-2 gap-2 mt-1 max-h-64 overflow-y-auto pr-1">
              {CARD_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                    selectedTemplate === t.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`h-10 rounded bg-gradient-to-br ${t.preview} mb-1.5 shadow-sm`} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <Label>Picha ya Tukio</Label>
            <div className="mt-1">
              {eventPhoto ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={eventPhoto} alt="Event" className="w-full h-32 object-cover" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1 rounded-md bg-background/80 text-foreground text-xs font-medium hover:bg-background"
                  >
                    Badilisha
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedEvent || uploadingPhoto}
                  className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors disabled:opacity-50"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs">{uploadingPhoto ? 'Inapakia...' : 'Pakia picha ya tukio'}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
          </div>

          <div>
            <Label>Majina ya Wenyeji</Label>
            <Input value={hostNames} onChange={e => setHostNames(e.target.value)} placeholder="Mfano: Familia ya Mrosso" />
          </div>

          <div>
            <Label>Mahali pa Tukio</Label>
            <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Mfano: Mlimani City Hall" />
          </div>

          <div>
            <Label>Ujumbe wa Mwaliko</Label>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)} className="flex-1 gap-2">
              <Eye className="w-4 h-4" /> {previewMode ? 'Ficha' : 'Angalia'} Kadi
            </Button>
            <Button onClick={handleSend} disabled={selectedGuests.length === 0} className="flex-1 gap-2">
              <Send className="w-4 h-4" /> Tuma ({selectedGuests.length})
            </Button>
          </div>
        </motion.div>

        {/* Preview / Recipients */}
        <div className="space-y-6">
          {previewMode && selectedEventData && (
            <div className="space-y-0 rounded-3xl overflow-hidden shadow-warm">
              {eventPhoto && (
                <div className="relative h-44 overflow-hidden rounded-t-3xl -mb-3">
                  <img src={eventPhoto} alt={selectedEventData.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                </div>
              )}
              <ECardPreview
                template={selectedTemplate}
                title={selectedEventData.title}
                hostNames={hostNames}
                customMessage={customMessage}
                venue={venue}
                eventDate={selectedEventData.event_date}
                eventPhoto={eventPhoto}
                qrData={buildQRData()}
                getMapsUrl={getGoogleMapsUrl}
              />
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground text-lg">Wapokeaji</h3>
              {guests.length > 0 && (
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedGuests.length === guests.length ? 'Ondoa Yote' : 'Chagua Wote'}
                </Button>
              )}
            </div>

            {!selectedEvent ? (
              <div className="text-center py-10">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Chagua tukio kwanza</p>
              </div>
            ) : guests.length === 0 ? (
              <div className="text-center py-10">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Hakuna wageni kwa tukio hili</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {guests.map((g: any) => (
                  <label
                    key={g.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGuests.includes(g.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox checked={selectedGuests.includes(g.id)} onCheckedChange={() => toggleGuest(g.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{g.full_name}</p>
                      <p className="text-xs text-muted-foreground">{g.phone || g.email || 'Hakuna mawasiliano'}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ECards;
