import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Camera, CheckCircle, XCircle, Users, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

const CheckIn = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [search, setSearch] = useState('');
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title, event_date').order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['checkin-guests', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const { data, error } = await supabase.from('guests').select('*').eq('event_id', selectedEvent).order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEvent,
  });

  const checkInMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase.from('guests').update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      }).eq('id', guestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-guests'] });
      toast.success('Mgeni ameingia!');
    },
    onError: () => toast.error('Imeshindikana ku-check in'),
  });

  const undoCheckIn = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase.from('guests').update({
        checked_in: false,
        checked_in_at: null,
      }).eq('id', guestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-guests'] });
      toast.info('Check-in imetenguka');
    },
  });

  const startScanner = async () => {
    if (!scannerContainerRef.current) return;
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('scanner-container');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      toast.error('Kamera haiwezi kufunguliwa');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = (code: string) => {
    const guest = guests.find((g: any) => g.barcode === code || g.id === code);
    if (guest) {
      if ((guest as any).checked_in) {
        toast.warning(`${(guest as any).full_name} tayari ameingia`);
      } else {
        checkInMutation.mutate((guest as any).id);
      }
    } else {
      toast.error('Barcode haijapatikana');
    }
  };

  const handleManualCheckIn = () => {
    if (!manualCode.trim()) return;
    handleScanResult(manualCode.trim());
    setManualCode('');
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const checkedIn = guests.filter((g: any) => g.checked_in).length;
  const total = guests.length;
  const filtered = guests.filter((g: any) =>
    g.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (g.barcode && g.barcode.includes(search))
  );

  return (
    <DashboardLayout>
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground mb-6">
        Check-In Mlangoni
      </motion.h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scanner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-heading font-semibold text-foreground text-lg">Scanner</h3>
            
            <div>
              <Select value={selectedEvent} onValueChange={(v) => { setSelectedEvent(v); stopScanner(); }}>
                <SelectTrigger><SelectValue placeholder="Chagua tukio" /></SelectTrigger>
                <SelectContent>
                  {events.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent && (
              <>
                <div id="scanner-container" ref={scannerContainerRef} className="rounded-lg overflow-hidden bg-muted aspect-square" />
                
                <Button onClick={scanning ? stopScanner : startScanner} className="w-full gap-2" variant={scanning ? 'destructive' : 'default'}>
                  <Camera className="w-4 h-4" />
                  {scanning ? 'Simamisha Scanner' : 'Fungua Scanner'}
                </Button>

                <div className="flex gap-2">
                  <Input
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    placeholder="Ingiza barcode..."
                    onKeyDown={e => e.key === 'Enter' && handleManualCheckIn()}
                  />
                  <Button onClick={handleManualCheckIn} size="icon" variant="outline">
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {selectedEvent && (
            <div className="glass-card rounded-xl p-6">
              <h4 className="font-heading font-semibold text-foreground mb-3">Muhtasari</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jumla Wageni</span>
                  <span className="font-semibold text-foreground">{total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wameingia</span>
                  <span className="font-semibold text-green-600">{checkedIn}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wanaosubiri</span>
                  <span className="font-semibold text-foreground">{total - checkedIn}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 mt-2">
                  <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${total > 0 ? (checkedIn / total) * 100 : 0}%` }} />
                </div>
                <p className="text-xs text-center text-muted-foreground">{total > 0 ? Math.round((checkedIn / total) * 100) : 0}% wameingia</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Guest List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tafuta mgeni..." className="pl-10" />
              </div>
            </div>

            {!selectedEvent ? (
              <div className="text-center py-16">
                <QrCode className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chagua tukio kuanza check-in</p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Hakuna wageni</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jina</TableHead>
                      <TableHead className="hidden sm:table-cell">Meza</TableHead>
                      <TableHead>Hali</TableHead>
                      <TableHead className="hidden md:table-cell">Muda</TableHead>
                      <TableHead className="w-28"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((g: any) => (
                      <TableRow key={g.id} className={g.checked_in ? 'bg-green-50/50 dark:bg-green-950/10' : ''}>
                        <TableCell className="font-medium">{g.full_name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{g.table_number || '-'}</TableCell>
                        <TableCell>
                          {g.checked_in ? (
                            <div className="flex items-center gap-1.5 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Ameingia</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm">Hajaingia</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                          {g.checked_in_at ? new Date(g.checked_in_at).toLocaleTimeString('sw-TZ') : '-'}
                        </TableCell>
                        <TableCell>
                          {g.checked_in ? (
                            <Button size="sm" variant="ghost" onClick={() => undoCheckIn.mutate(g.id)} className="text-xs">
                              Tengua
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => checkInMutation.mutate(g.id)} className="text-xs">
                              Check In
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default CheckIn;
