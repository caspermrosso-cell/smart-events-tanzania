import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

const SMS_TEMPLATES = [
  { id: 'invite', label: 'Mwaliko', template: 'Habari {name}, unaalikwa kwenye {event} tarehe {date}. Karibu sana!' },
  { id: 'reminder', label: 'Kikumbusho', template: 'Habari {name}, tunakukumbusha kuhusu {event} tarehe {date}. Tutakutarajia!' },
  { id: 'thank', label: 'Shukrani', template: 'Habari {name}, asante sana kwa mchango wako wa TZS {amount} kwa {event}. Mungu akubariki!' },
  { id: 'custom', label: 'Ujumbe Maalum', template: '' },
];

const SMS = () => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title, event_date').order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['sms-guests', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const { data, error } = await supabase.from('guests').select('id, full_name, phone').eq('event_id', selectedEvent).not('phone', 'is', null);
      if (error) throw error;
      return data.filter((g: any) => g.phone && g.phone.length > 4);
    },
    enabled: !!selectedEvent,
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = SMS_TEMPLATES.find((t) => t.id === templateId);
    if (tpl && tpl.id !== 'custom') {
      setMessage(tpl.template);
    } else {
      setMessage('');
    }
  };

  const toggleGuest = (id: string) => {
    setSelectedGuests((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map((g: any) => g.id));
    }
  };

  const handleSend = async () => {
    if (!message || selectedGuests.length === 0) {
      toast.error('Andika ujumbe na uchague wageni');
      return;
    }

    setSending(true);
    try {
      const recipients = guests
        .filter((g: any) => selectedGuests.includes(g.id))
        .map((g: any) => ({ name: g.full_name, phone: g.phone }));

      const eventData = events.find((e: any) => e.id === selectedEvent);

      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          message,
          recipients,
          eventTitle: eventData?.title || '',
          eventDate: eventData?.event_date || '',
        },
      });

      if (error) throw error;
      setSent(true);
      toast.success(`SMS ${selectedGuests.length} zimetumwa!`);
      setTimeout(() => {
        setSent(false);
        setSelectedGuests([]);
      }, 3000);
    } catch {
      toast.error('Imeshindikana kutuma SMS. Jaribu tena.');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground mb-6">
        Tuma SMS
      </motion.h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground text-lg">Andika Ujumbe</h3>

          <div>
            <Label>Tukio</Label>
            <Select value={selectedEvent} onValueChange={(v) => { setSelectedEvent(v); setSelectedGuests([]); }}>
              <SelectTrigger><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
              <SelectContent>
                {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger><SelectValue placeholder="Chagua template" /></SelectTrigger>
              <SelectContent>
                {SMS_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ujumbe</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Andika ujumbe hapa..."
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/160 herufi</p>
          </div>

          <Button onClick={handleSend} disabled={sending || sent || !message || selectedGuests.length === 0} className="w-full gap-2">
            {sent ? <><CheckCircle className="w-4 h-4" /> Zimetumwa!</> :
             sending ? 'Inatuma...' :
             <><Send className="w-4 h-4" /> Tuma kwa Wageni {selectedGuests.length}</>}
          </Button>
        </motion.div>

        {/* Recipients */}
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
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Chagua tukio kwanza</p>
            </div>
          ) : guests.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Hakuna wageni wenye namba ya simu</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {guests.map((g: any) => (
                <label
                  key={g.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedGuests.includes(g.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedGuests.includes(g.id)}
                    onCheckedChange={() => toggleGuest(g.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{g.full_name}</p>
                    <p className="text-xs text-muted-foreground">{g.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SMS;
