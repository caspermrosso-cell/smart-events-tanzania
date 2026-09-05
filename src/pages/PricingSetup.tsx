import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Save, SlidersHorizontal, Gift } from 'lucide-react';
import { usePricingSettings } from '@/hooks/usePricingSettings';

const PricingSetup = () => {
  const { settings, isLoading } = usePricingSettings();
  const queryClient = useQueryClient();

  const [smsRate, setSmsRate] = useState(50);
  const [waRate, setWaRate] = useState(1000);
  const [threshold, setThreshold] = useState(300000);
  const [maxUnits, setMaxUnits] = useState(5000);
  const [noteSw, setNoteSw] = useState('');
  const [noteEn, setNoteEn] = useState('');
  const [previewUnits, setPreviewUnits] = useState(500);
  const [previewChannel, setPreviewChannel] = useState<'sms' | 'whatsapp'>('sms');

  useEffect(() => {
    if (isLoading) return;
    setSmsRate(settings.sms_rate);
    setWaRate(settings.whatsapp_rate);
    setThreshold(settings.unlock_threshold);
    setMaxUnits(settings.max_units);
    setNoteSw(settings.discount_note_sw ?? '');
    setNoteEn(settings.discount_note_en ?? '');
  }, [isLoading, settings]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        sms_rate: smsRate,
        whatsapp_rate: waRate,
        unlock_threshold: threshold,
        max_units: maxUnits,
        discount_note_sw: noteSw || null,
        discount_note_en: noteEn || null,
      };
      if (settings.id) {
        const { error } = await supabase.from('pricing_settings').update(payload).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pricing_settings').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-settings'] });
      toast.success('Bei zimehifadhiwa');
    },
    onError: (e: any) => toast.error(e.message || 'Imeshindikana kuhifadhi'),
  });

  const rate = previewChannel === 'sms' ? smsRate : waRate;
  const total = previewUnits * rate;
  const fmt = (n: number) => n.toLocaleString();

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Mipangilio ya Bei</h1>
          <p className="text-sm text-muted-foreground">
            Badilisha bei za SMS na WhatsApp, kiwango cha zawadi na maelezo ya discount. Mabadiliko yanaonekana moja kwa moja kwenye tovuti.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="w-4 h-4" /> Bei za huduma
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bei ya SMS (TZS kwa unit)</Label>
              <Input type="number" min={0} value={smsRate} onChange={(e) => setSmsRate(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Bei ya WhatsApp (TZS kwa unit)</Label>
              <Input type="number" min={0} value={waRate} onChange={(e) => setWaRate(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Kiwango cha zawadi (TZS)</Label>
              <Input type="number" min={0} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">
                Bajeti ikifika hapa, mteja anaonyeshwa E-Cards, Check-In & QR na Ripoti Kamili bure.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Idadi ya juu ya ujumbe (simulator)</Label>
              <Input type="number" min={100} value={maxUnits} onChange={(e) => setMaxUnits(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="w-4 h-4" /> Maelezo ya discount
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kiswahili</Label>
              <Textarea rows={4} value={noteSw} onChange={(e) => setNoteSw(e.target.value)} placeholder="Acha wazi kutumia maneno ya kawaida" />
            </div>
            <div className="space-y-2">
              <Label>English</Label>
              <Textarea rows={4} value={noteEn} onChange={(e) => setNoteEn(e.target.value)} placeholder="Leave empty to use the default text" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jaribio la haraka</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {(['sms', 'whatsapp'] as const).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={previewChannel === c ? 'default' : 'outline'}
                  onClick={() => setPreviewChannel(c)}
                >
                  {c === 'sms' ? 'SMS' : 'WhatsApp'}
                </Button>
              ))}
            </div>
            <Slider
              value={[Math.min(previewUnits, maxUnits)]}
              min={0}
              max={Math.max(maxUnits, 100)}
              step={10}
              onValueChange={(v) => setPreviewUnits(v[0])}
            />
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{fmt(previewUnits)} ujumbe</span>
              <span className="font-heading text-2xl font-bold text-primary">TZS {fmt(total)}</span>
            </div>
            {total >= threshold && (
              <p className="text-sm text-foreground rounded-lg bg-primary/10 border border-primary/30 p-3">
                Zawadi zimevashwa: E-Cards, Check-In & QR, Ripoti Kamili.
              </p>
            )}
          </CardContent>
        </Card>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {save.isPending ? 'Inahifadhi...' : 'Hifadhi bei'}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default PricingSetup;
