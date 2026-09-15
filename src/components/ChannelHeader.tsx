import { Link, useLocation } from 'react-router-dom';
import { BarChart3, LayoutGrid, MessageCircle, MessageSquare, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const channels = [
  { href: '/communications', label: 'Overview', icon: LayoutGrid },
  { href: '/sms', label: 'SMS', icon: MessageSquare },
  { href: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

type ChannelHeaderProps = {
  channel?: 'sms' | 'whatsapp';
  title: string;
  description: string;
  metric?: string;
  metricLabel?: string;
};

const ChannelHeader = ({ channel, title, description, metric, metricLabel }: ChannelHeaderProps) => {
  const location = useLocation();

  return (
    <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="channel-header">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <Radio className="h-3.5 w-3.5" /> Communications workspace
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {metric && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold leading-none text-foreground">{metric}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{metricLabel}</p>
            </div>
          </div>
        )}
      </div>

      <nav aria-label="Communication channels" className="mt-5 flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/60 p-1 scrollbar-hide">
        {channels.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Button key={item.href} asChild variant="ghost" size="sm" className={cn('min-w-fit flex-1', active && 'bg-card text-primary shadow-sm hover:bg-card')}>
              <Link to={item.href}><item.icon className="h-4 w-4" />{item.label}</Link>
            </Button>
          );
        })}
      </nav>
    </motion.header>
  );
};

export default ChannelHeader;