import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Trash2, KeyRound, Shield, ShieldCheck } from 'lucide-react';
import { AppModule } from '@/hooks/usePermissions';

const ALL_MODULES: { key: AppModule; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'events', label: 'Matukio' },
  { key: 'guests', label: 'Wageni' },
  { key: 'pledges', label: 'Michango' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'ecards', label: 'E-Cards' },
  { key: 'checkin', label: 'Check-In' },
  { key: 'payments', label: 'Malipo' },
  { key: 'quotations', label: 'Nyaraka' },
  { key: 'packages', label: 'Packages' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'reports', label: 'Reports' },
  { key: 'recycle_bin', label: 'Recycle Bin' },
  { key: 'users', label: 'Watumiaji' },
];

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  modules: AppModule[];
}

async function call(action: string, payload: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

const UsersPage = () => {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await call('list')) as { users: AdminUser[] },
  });

  const del = useMutation({
    mutationFn: (user_id: string) => call('delete', { user_id }),
    onSuccess: () => { toast.success('User amefutwa'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Watumiaji & Roles</h2>
          <p className="text-sm text-muted-foreground">Tengeneza watumiaji na chagua modules wanazoruhusiwa kutumia.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2"><UserPlus className="w-4 h-4" /> Ongeza User</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid gap-3">
          {(data?.users ?? []).map((u) => {
            const isAdmin = u.roles.includes('admin');
            return (
              <div key={u.id} className="glass-card rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                    {isAdmin ? (
                      <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/10"><ShieldCheck className="w-3 h-3" /> Admin</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> User</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {isAdmin ? (
                      <Badge variant="secondary" className="text-[10px]">Modules zote</Badge>
                    ) : u.modules.length === 0 ? (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">Hakuna module</Badge>
                    ) : (
                      u.modules.map((m) => (
                        <Badge key={m} variant="secondary" className="text-[10px]">
                          {ALL_MODULES.find((a) => a.key === m)?.label ?? m}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(u)}>Roles</Button>
                  <Button size="sm" variant="outline" onClick={() => setResetting(u)} className="gap-1"><KeyRound className="w-3.5 h-3.5" /> Password</Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Futa ${u.email}?`)) del.mutate(u.id); }} className="text-destructive gap-1"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && <CreateUserDialog open onClose={() => setCreating(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setCreating(false); }} />}
      {editing && <EditPermissionsDialog user={editing} onClose={() => setEditing(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditing(null); }} />}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
    </DashboardLayout>
  );
};

const CreateUserDialog = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [modules, setModules] = useState<Set<AppModule>>(new Set(['dashboard']));
  const [saving, setSaving] = useState(false);

  const toggle = (m: AppModule) => {
    const n = new Set(modules);
    n.has(m) ? n.delete(m) : n.add(m);
    setModules(n);
  };

  const submit = async () => {
    if (!email || !password) { toast.error('Weka email na password'); return; }
    setSaving(true);
    try {
      await call('create', { email, password, full_name: fullName, is_admin: isAdmin, modules: Array.from(modules) });
      toast.success('User ameongezwa');
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Ongeza User Mpya</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Jina Kamili</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={isAdmin} onCheckedChange={setIsAdmin} id="admin" />
            <Label htmlFor="admin">Ni Admin (access modules zote)</Label>
          </div>
          {!isAdmin && (
            <div>
              <Label className="mb-2 block">Modules zinazoruhusiwa</Label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                {ALL_MODULES.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={modules.has(m.key)} onCheckedChange={() => toggle(m.key)} />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Inahifadhi...' : 'Hifadhi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditPermissionsDialog = ({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) => {
  const [isAdmin, setIsAdmin] = useState(user.roles.includes('admin'));
  const [modules, setModules] = useState<Set<AppModule>>(new Set(user.modules));
  const [saving, setSaving] = useState(false);

  const toggle = (m: AppModule) => {
    const n = new Set(modules);
    n.has(m) ? n.delete(m) : n.add(m);
    setModules(n);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await call('update_permissions', { user_id: user.id, is_admin: isAdmin, modules: Array.from(modules) });
      toast.success('Permissions zimehifadhiwa');
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Roles za {user.full_name || user.email}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch checked={isAdmin} onCheckedChange={setIsAdmin} id="ad2" />
            <Label htmlFor="ad2">Ni Admin (access modules zote)</Label>
          </div>
          {!isAdmin && (
            <div>
              <Label className="mb-2 block">Modules zinazoruhusiwa</Label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                {ALL_MODULES.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={modules.has(m.key)} onCheckedChange={() => toggle(m.key)} />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Inahifadhi...' : 'Hifadhi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ResetPasswordDialog = ({ user, onClose }: { user: AdminUser; onClose: () => void }) => {
  const [pw, setPw] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (pw.length < 6) { toast.error('Password fupi mno'); return; }
    setSaving(true);
    try {
      await call('reset_password', { user_id: user.id, password: pw });
      toast.success('Password imebadilishwa');
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Reset password ya {user.email}</DialogTitle></DialogHeader>
        <Input type="password" placeholder="Password mpya" value={pw} onChange={e => setPw(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Ghairi</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Inahifadhi...' : 'Badilisha'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsersPage;