import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, MapPin, Users, MoreVertical, Pencil, Trash2, Eye, MessageSquare, ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import EventForm from '@/components/events/EventForm';
import DashboardLayout from '@/components/DashboardLayout';

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Harusi',
  birthday: 'Birthday',
  corporate: 'Corporate',
  fundraiser: 'Fundraiser',
  memorial: 'Memorial',
  other: 'Nyingine',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-600 text-white shadow-sm',
  completed: 'bg-blue-600 text-white shadow-sm',
  cancelled: 'bg-destructive text-white shadow-sm',
};

const Events = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: smsUsageMap = {} } = useQuery({
    queryKey: ['events-sms-usage'],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('sms_logs')
        .select('event_id, sms_count')
        .eq('status', 'sent');
      if (error) throw error;
      const map: Record<string, number> = {};
      (logs || []).forEach((log: any) => {
        if (log.event_id) {
          map[log.event_id] = (map[log.event_id] || 0) + (log.sms_count || 1);
        }
      });
      return map;
    },
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Tukio limefutwa');
    },
    onError: () => toast.error('Imeshindikana kufuta tukio'),
  });

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground">
          Matukio
        </motion.h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Tukio Jipya
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">{editingEvent ? 'Hariri Tukio' : 'Unda Tukio Jipya'}</DialogTitle>
            </DialogHeader>
            <EventForm event={editingEvent} onSuccess={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Hakuna matukio bado</h3>
          <p className="text-muted-foreground mb-6">Anza kwa kuunda tukio lako la kwanza</p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Unda Tukio
          </Button>
        </motion.div>
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
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-hide"
          >
            {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 hover:shadow-warm transition-all group flex-shrink-0 snap-start basis-full sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)]"
            >
              {event.photo_url && (
                <div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-xl aspect-[3/4] bg-muted flex items-center justify-center">
                  <img src={event.photo_url} alt={event.title} className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wide ${STATUS_STYLES[event.status] || STATUS_STYLES.draft}`}>
                  {event.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                  {event.status === 'active' && <Clock className="w-4 h-4" />}
                  {event.status}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/events/${event.id}`)}>
                      <Eye className="w-4 h-4 mr-2" /> Tazama
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(event)}>
                      <Pencil className="w-4 h-4 mr-2" /> Hariri
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(event.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Futa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-heading font-semibold text-foreground text-lg mb-1">{event.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</p>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{event.event_date && !isNaN(new Date(event.event_date).getTime()) ? format(new Date(event.event_date), 'dd MMM yyyy, HH:mm') : 'Tarehe haijulikani'}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                )}
                {event.max_guests && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>Max {event.max_guests} wageni</span>
                  </div>
                )}
                {event.sms_allocation > 0 && (() => {
                  const used = smsUsageMap[event.id] || 0;
                  const remaining = Math.max(event.sms_allocation - used, 0);
                  const pct = Math.round((used / event.sms_allocation) * 100);
                  const isLow = remaining < event.sms_allocation * 0.2;
                  return (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground">SMS</span>
                        </div>
                        <span className={`text-xs font-semibold ${isLow ? 'text-destructive' : 'text-primary'}`}>
                          {remaining}/{event.sms_allocation}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isLow ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Events;
