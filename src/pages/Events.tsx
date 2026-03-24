import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, MapPin, Users, MoreVertical, Pencil, Trash2, Eye, MessageSquare } from 'lucide-react';
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
  active: 'bg-primary/10 text-primary',
  completed: 'bg-accent/10 text-accent',
  cancelled: 'bg-destructive/10 text-destructive',
};

const Events = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 hover:shadow-warm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[event.status] || STATUS_STYLES.draft}`}>
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
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Events;
