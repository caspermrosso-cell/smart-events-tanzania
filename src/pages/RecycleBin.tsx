import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RotateCcw, Trash2, Loader2, Calendar, Users, Quote } from 'lucide-react';
import { format } from 'date-fns';

type ResourceKey = 'events' | 'guests' | 'testimonials';

const RESOURCES: { key: ResourceKey; label: string; icon: any; select: string; title: (r: any) => string; subtitle: (r: any) => string }[] = [
  {
    key: 'events', label: 'Matukio', icon: Calendar,
    select: 'id, title, event_type, event_date, deleted_at',
    title: (r) => r.title || 'Tukio',
    subtitle: (r) => [r.event_type, r.event_date && format(new Date(r.event_date), 'PP')].filter(Boolean).join(' • '),
  },
  {
    key: 'guests', label: 'Wageni', icon: Users,
    select: 'id, full_name, phone, card_number, deleted_at',
    title: (r) => r.full_name || 'Mgeni',
    subtitle: (r) => [r.phone, r.card_number && `Kadi #${r.card_number}`].filter(Boolean).join(' • '),
  },
  {
    key: 'testimonials', label: 'Testimonials', icon: Quote,
    select: 'id, client_name, quote, deleted_at',
    title: (r) => r.client_name || 'Ushuhuda',
    subtitle: (r) => (r.quote || '').slice(0, 90),
  },
];

const RecycleBinList = ({ resource }: { resource: typeof RESOURCES[number] }) => {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['recycle-bin', resource.key],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(resource.key)
        .select(resource.select)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['recycle-bin', resource.key] });
    qc.invalidateQueries({ queryKey: [resource.key] });
    if (resource.key === 'testimonials') {
      qc.invalidateQueries({ queryKey: ['admin-testimonials'] });
      qc.invalidateQueries({ queryKey: ['client-testimonials'] });
    }
    if (resource.key === 'guests' || resource.key === 'events') {
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  };

  const restore = async (id: string) => {
    setBusy(id);
    const { error } = await (supabase as any).from(resource.key).update({ deleted_at: null }).eq('id', id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success('Imerudishwa');
    invalidate();
  };

  const purge = async (id: string) => {
    if (!confirm('Futa kabisa? Kitendo hiki hakiwezi kurudishwa.')) return;
    setBusy(id);
    const { error } = await (supabase as any).from(resource.key).delete().eq('id', id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success('Imefutwa kabisa');
    invalidate();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Inapakia...</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <resource.icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>Hakuna {resource.label.toLowerCase()} zilizofutwa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r: any) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{resource.title(r)}</p>
            <p className="text-xs text-muted-foreground truncate">{resource.subtitle(r)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ilifutwa: {r.deleted_at ? format(new Date(r.deleted_at), 'PPp') : '—'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => restore(r.id)} disabled={busy === r.id} className="gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </Button>
            <Button size="sm" variant="ghost" onClick={() => purge(r.id)} disabled={busy === r.id} className="gap-1 text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" /> Futa kabisa
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const RecycleBin = () => {
  return (
    <DashboardLayout>
      <div className="p-2 md:p-6 space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Recycle Bin</h1>
          <p className="text-muted-foreground mt-1 text-sm">Rudisha au futa kabisa records zilizofutwa.</p>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList>
            {RESOURCES.map((r) => (
              <TabsTrigger key={r.key} value={r.key} className="gap-2">
                <r.icon className="w-4 h-4" /> {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {RESOURCES.map((r) => (
            <TabsContent key={r.key} value={r.key} className="mt-4">
              <RecycleBinList resource={r} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RecycleBin;