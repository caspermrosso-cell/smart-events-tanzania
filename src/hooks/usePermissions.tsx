import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppModule =
  | 'dashboard' | 'events' | 'guests' | 'pledges' | 'sms' | 'whatsapp'
  | 'ecards' | 'checkin' | 'payments' | 'quotations' | 'packages'
  | 'testimonials' | 'reports' | 'recycle_bin' | 'users';

export function usePermissions() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['my-permissions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [rolesRes, permsRes] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', user!.id),
        (supabase as any).from('user_module_permissions').select('module').eq('user_id', user!.id),
      ]);
      const isAdmin = (rolesRes.data || []).some((r: any) => r.role === 'admin');
      const modules = new Set<AppModule>(((permsRes.data as any[]) || []).map((p) => p.module));
      return { isAdmin, modules };
    },
  });

  const isAdmin = query.data?.isAdmin ?? false;
  const modules = query.data?.modules ?? new Set<AppModule>();

  const can = (m: AppModule) => isAdmin || modules.has(m);

  return { ...query, isAdmin, modules, can };
}