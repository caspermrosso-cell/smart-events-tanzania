import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import WhatsAppCompose from '@/components/whatsapp/WhatsAppCompose';
import WhatsAppActiveSessions from '@/components/whatsapp/WhatsAppActiveSessions';
import WhatsAppTemplates from '@/components/whatsapp/WhatsAppTemplates';
import WhatsAppLogs from '@/components/whatsapp/WhatsAppLogs';

const WhatsApp = () => {
  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="font-heading text-2xl font-bold text-foreground">WhatsApp & Chat</h2>
        </motion.div>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <WhatsAppCompose />
        </TabsContent>

        <TabsContent value="sessions">
          <WhatsAppActiveSessions />
        </TabsContent>

        <TabsContent value="templates">
          <WhatsAppTemplates />
        </TabsContent>

        <TabsContent value="logs">
          <WhatsAppLogs />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default WhatsApp;
