import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import SmsCompose from '@/components/sms/SmsCompose';
import SmsDeliveryLogs from '@/components/sms/SmsDeliveryLogs';
import SmsReports from '@/components/sms/SmsReports';

const SMS = () => {
  const { data: balance } = useQuery({
    queryKey: ['beem-balance'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { action: 'balance' },
      });
      if (error) throw error;
      return data?.data?.data;
    },
    staleTime: 60000,
  });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-heading text-2xl font-bold text-foreground">
          SMS Management
        </motion.h2>
        {balance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 glass-card rounded-lg px-4 py-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Salio: SMS ~{Math.floor(Number(balance?.credit_balance || 0) / 25).toLocaleString()}
            </span>
          </motion.div>
        )}
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="compose">Tuma SMS</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          <TabsTrigger value="reports">Ripoti</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <SmsCompose />
        </TabsContent>

        <TabsContent value="logs">
          <SmsDeliveryLogs />
        </TabsContent>

        <TabsContent value="reports">
          <SmsReports />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SMS;
