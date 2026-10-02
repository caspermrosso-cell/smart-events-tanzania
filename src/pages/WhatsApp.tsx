import { BarChart3, LayoutTemplate, Send, MessagesSquare, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import WhatsAppCompose from '@/components/whatsapp/WhatsAppCompose';
import WhatsAppActiveSessions from '@/components/whatsapp/WhatsAppActiveSessions';
import WhatsAppTemplates from '@/components/whatsapp/WhatsAppTemplates';
import WhatsAppLogs from '@/components/whatsapp/WhatsAppLogs';
import WhatsAppDashboard from '@/components/whatsapp/WhatsAppDashboard';
import ChannelHeader from '@/components/ChannelHeader';

const whatsAppTabs = [
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { value: 'templates', label: 'Templates', icon: LayoutTemplate },
  { value: 'compose', label: 'Compose', icon: Send },
  { value: 'sessions', label: 'Sessions', icon: MessagesSquare },
  { value: 'logs', label: 'Logs', icon: History },
];

const WhatsApp = () => {
  return (
    <DashboardLayout>
      <ChannelHeader channel="whatsapp" title="WhatsApp Management" description="Templates, campaigns, conversations na delivery status katika sehemu moja." />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-5 gap-1 bg-muted/60 p-1">
          {whatsAppTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value} className="min-h-11 gap-2 text-xs"><tab.icon className="h-4 w-4" /><span className="hidden sm:inline">{tab.label}</span></TabsTrigger>)}
        </TabsList>

        <TabsContent value="dashboard">
          <WhatsAppDashboard />
        </TabsContent>

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
