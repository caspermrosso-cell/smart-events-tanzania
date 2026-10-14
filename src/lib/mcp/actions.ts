import type { ToolContext } from '@lovable.dev/mcp-js';
import { supabaseForUser } from './supabase';
import { requireOwnedEvent } from '../assistant/validation';
export async function authorizedEvent(ctx: ToolContext, eventId: string, module: 'guests' | 'sms') {
  const db = supabaseForUser(ctx);
  const userId = ctx.getUserId();
  if (!userId) throw new Error('Sign in required');
  const [admin, permission, event] = await Promise.all([
    db.rpc('has_role', { _user_id: userId, _role: 'admin' }),
    db.rpc('has_module_permission', { _user_id: userId, _module: module }),
    db.from('events').select('id,title,user_id,deleted_at,sms_allocation').eq('id', eventId).eq('user_id', userId).is('deleted_at', null).maybeSingle(),
  ]);
  if (admin.error || permission.error || event.error) throw new Error('Unable to verify access');
  if (!admin.data && !permission.data) throw new Error(`You do not have ${module} permission`);
  requireOwnedEvent(event.data, userId);
  return { db, userId, event: event.data };
}
