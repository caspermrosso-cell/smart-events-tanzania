import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, CheckCircle2, CheckCheck, Eye, XCircle, Clock, MessageSquare,
  Filter, RefreshCw, Send, Loader2, Reply, Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';

type LogRow = {
  id: string;
  recipient_name: string | null;
  recipient_phone: string;
  template_name: string | null;
  campaign_name: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  response_text: string | null;
  response_at: string | null;
  error_message: string | null;
  message_content: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  sent: 'hsl(var(--primary))',
  delivered: '#3b82f6',
  read: '#22c55e',
  failed: '#ef4444',
  pending: '#f59e0b',
};

const deriveStatus = (l: LogRow): 'sent' | 'delivered' | 'read' | 'failed' | 'pending' => {
  if (l.status === 'failed') return 'failed';
  if (l.read_at) return 'read';
  if (l.delivered_at) return 'delivered';
  if (l.status === 'sent') return 'sent';
  return 'pending';
};

const KPI = ({ label, value, icon: Icon, color }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const WhatsAppDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = new Date();
  const monthAgo = new Date(); monthAgo.setDate(today.getDate() - 30);
  const [from, setFrom] = useState(monthAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [campaign, setCampaign] = useState<string>('all');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['wa-dashboard', user?.id, from, to],
    queryFn: async () => {
      const fromIso = new Date(from + 'T00:00:00').toISOString();
      const toIso = new Date(to + 'T23:59:59').toISOString();
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('id,recipient_name,recipient_phone,template_name,campaign_name,status,created_at,delivered_at,read_at,response_text,response_at,error_message,message_content')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as LogRow[];
    },
  });

  const campaigns = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      const c = l.campaign_name || l.template_name;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    if (campaign === 'all') return logs;
    return logs.filter((l) => (l.campaign_name || l.template_name) === campaign);
  }, [logs, campaign]);

  const stats = useMemo(() => {
    const c = { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 };
    filtered.forEach((l) => { c[deriveStatus(l)] += 1; });
    return c;
  }, [filtered]);

  const total = filtered.length;
  const rate = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const byCampaign = useMemo(() => {
    const map = new Map<string, any>();
    filtered.forEach((l) => {
      const key = l.campaign_name || l.template_name || 'Direct message';
      if (!map.has(key)) map.set(key, { name: key, sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 });
      const row = map.get(key);
      row[deriveStatus(l)] += 1;
    });
    return Array.from(map.values()).slice(0, 10);
  }, [filtered]);

  const pieData = useMemo(() => (
    (['read', 'delivered', 'sent', 'pending', 'failed'] as const)
      .map((k) => ({ name: k[0].toUpperCase() + k.slice(1), value: stats[k], key: k }))
      .filter((d) => d.value > 0)
  ), [stats]);

  const responses = useMemo(() => filtered.filter((l) => l.response_text && l.response_text.trim()), [filtered]);

  const clearFailed = useMutation({
    mutationFn: async () => {
      const { error, count } = await supabase
        .from('whatsapp_logs')
        .delete({ count: 'exact' })
        .eq('status', 'failed');
      if (error) throw error;
      return count ?? 0;
    },
    onSuccess: (n) => {
      toast.success(`Cleared ${n} failed message${n === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: ['wa-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to clear'),
  });

  const refreshResponses = async () => {
    await refetch();
    toast.success(`Found ${responses.length} response${responses.length === 1 ? '' : 's'}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">WhatsApp Delivery Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              if (confirm('Clear all failed WhatsApp messages? This cannot be undone.')) clearFailed.mutate();
            }}
            disabled={clearFailed.isPending || stats.failed === 0}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Clear failed ({stats.failed})
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs flex items-center gap-1"><Filter className="w-3 h-3" /> Campaign</Label>
            <Select value={campaign} onValueChange={setCampaign}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {campaigns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Badge variant="secondary" className="w-full justify-center py-2">{total} messages</Badge>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPI label="Sent" value={stats.sent + stats.delivered + stats.read} icon={Send} color={STATUS_COLORS.sent} />
        <KPI label={`Delivered (${rate(stats.delivered + stats.read)}%)`} value={stats.delivered + stats.read} icon={CheckCheck} color={STATUS_COLORS.delivered} />
        <KPI label={`Read (${rate(stats.read)}%)`} value={stats.read} icon={Eye} color={STATUS_COLORS.read} />
        <KPI label="Failed" value={stats.failed} icon={XCircle} color={STATUS_COLORS.failed} />
        <KPI label="Pending" value={stats.pending} icon={Clock} color={STATUS_COLORS.pending} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Delivery by campaign</CardTitle></CardHeader>
          <CardContent className="h-72">
            {byCampaign.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCampaign}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sent" stackId="s" fill={STATUS_COLORS.sent} name="Sent" />
                  <Bar dataKey="delivered" stackId="s" fill={STATUS_COLORS.delivered} name="Delivered" />
                  <Bar dataKey="read" stackId="s" fill={STATUS_COLORS.read} name="Read" />
                  <Bar dataKey="failed" stackId="s" fill={STATUS_COLORS.failed} name="Failed" />
                  <Bar dataKey="pending" stackId="s" fill={STATUS_COLORS.pending} name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Status breakdown</CardTitle></CardHeader>
          <CardContent className="h-72">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45} paddingAngle={2}>
                    {pieData.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Click / responses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Reply className="w-4 h-4 text-primary" /> Recipient responses
            <Badge variant="secondary">{responses.length}</Badge>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={refreshResponses}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh responses
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" /></div>
          ) : responses.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No responses yet. Replies from recipients will appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.slice(0, 50).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="font-medium">{l.recipient_name || '—'}</div>
                      <div className="text-xs font-mono text-muted-foreground">{l.recipient_phone}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{l.campaign_name || l.template_name || 'Direct'}</Badge></TableCell>
                    <TableCell className="max-w-md whitespace-pre-wrap text-sm">{l.response_text}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.response_at ? new Date(l.response_at).toLocaleString('en-TZ') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent deliveries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent deliveries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Read</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((l) => {
                  const s = deriveStatus(l);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{l.recipient_name || '—'}</div>
                        <div className="text-xs font-mono text-muted-foreground">{l.recipient_phone}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{l.campaign_name || l.template_name || 'Direct'}</Badge></TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: STATUS_COLORS[s], color: '#fff' }} className="capitalize">{s}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('en-TZ')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.delivered_at ? new Date(l.delivered_at).toLocaleString('en-TZ') : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.read_at ? new Date(l.read_at).toLocaleString('en-TZ') : '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WhatsAppDashboard;