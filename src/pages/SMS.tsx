import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Wallet, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import SmsCompose from '@/components/sms/SmsCompose';
import SmsDeliveryLogs from '@/components/sms/SmsDeliveryLogs';
import SmsReports from '@/components/sms/SmsReports';
import SmsErrorLogs from '@/components/sms/SmsErrorLogs';
import SmsTemplateManager from '@/components/sms/SmsTemplateManager';

const SMS = () => {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const { data: balance } = useQuery({
    queryKey: ['beem-balance'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { action: 'balance' },
      });
      if (error) throw error;
      return data?.data?.data;
    },
    staleTime: 30000,
  });

  // Fetch events with their SMS allocation and usage
  const { data: eventsWithSms = [] } = useQuery({
    queryKey: ['events-sms-allocation'],
    queryFn: async () => {
      const { data: events, error: evError } = await supabase
        .from('events')
        .select('id, title, sms_allocation')
        .order('event_date', { ascending: false });
      if (evError) throw evError;

      // Get SMS usage counts per event
      const { data: logs, error: logError } = await supabase
        .from('sms_logs')
        .select('event_id, sms_count')
        .eq('status', 'sent');
      if (logError) throw logError;

      const usageMap: Record<string, number> = {};
      (logs || []).forEach((log: any) => {
        if (log.event_id) {
          usageMap[log.event_id] = (usageMap[log.event_id] || 0) + (log.sms_count || 1);
        }
      });

      return (events || []).map((ev: any) => ({
        ...ev,
        sms_used: usageMap[ev.id] || 0,
        sms_remaining: Math.max((ev.sms_allocation || 0) - (usageMap[ev.id] || 0), 0),
      }));
    },
    staleTime: 30000,
  });

  const creditBalance = Number(balance?.credit_balance || 0);
  const eventsWithAllocation = eventsWithSms.filter((e: any) => e.sms_allocation > 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-3">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-xl font-bold text-foreground">
          SMS Management
        </motion.h2>
        {balance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 glass-card rounded-lg px-3 py-1.5">
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">
              Salio: TZS {creditBalance.toLocaleString()}
            </span>
          </motion.div>
        )}
      </div>

      {/* Per-Event SMS Allocation Cards */}
      {eventsWithAllocation.length > 0 && (
        <div className="relative mb-4">
          <button
            onClick={() => scrollBy('left')}
            aria-label="Scroll left"
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-background border border-border shadow-warm hover:bg-muted transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => scrollBy('right')}
            aria-label="Scroll right"
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-background border border-border shadow-warm hover:bg-muted transition-all"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth scrollbar-hide"
          >
            {eventsWithAllocation.map((ev: any) => {
            const usedPercent = ev.sms_allocation > 0 ? Math.round((ev.sms_used / ev.sms_allocation) * 100) : 0;
            const isLow = ev.sms_remaining < ev.sms_allocation * 0.2;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-lg p-2.5 min-w-[220px] flex-shrink-0 snap-start"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="w-3 h-3 text-primary" />
                  <h4 className="font-semibold text-foreground text-xs truncate">{ev.title}</h4>
                </div>
                <div className="flex items-end justify-between mb-1.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Zimebaki</p>
                    <p className={`text-base font-bold ${isLow ? 'text-destructive' : 'text-primary'}`}>
                      {ev.sms_remaining.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Zimetumika / Zote</p>
                    <p className="text-xs font-medium text-foreground">
                      {ev.sms_used.toLocaleString()} / {ev.sms_allocation.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isLow ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5 text-right">{usedPercent}% zimetumika</p>
              </motion.div>
            );
          })}
        </div>
      )}

      <Tabs defaultValue="compose" className="space-y-3">
        <TabsList className="grid grid-cols-5 w-full max-w-xl h-9">
          <TabsTrigger value="compose" className="text-xs">Tuma SMS</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Delivery Logs</TabsTrigger>
          <TabsTrigger value="errors" className="text-xs">Error Log</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">Ripoti</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <SmsCompose />
        </TabsContent>

        <TabsContent value="templates">
          <SmsTemplateManager />
        </TabsContent>

        <TabsContent value="logs">
          <SmsDeliveryLogs />
        </TabsContent>

        <TabsContent value="errors">
          <SmsErrorLogs />
        </TabsContent>

        <TabsContent value="reports">
          <SmsReports />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SMS;
