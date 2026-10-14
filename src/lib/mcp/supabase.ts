import { createClient } from '@supabase/supabase-js';
import type { ToolContext } from '@lovable.dev/mcp-js';
type RuntimeGlobals = typeof globalThis & { Deno?: { env?: { get?: (name: string) => string | undefined } }; process?: { env?: Record<string, string | undefined> } };
function env(name: string) { const g = globalThis as RuntimeGlobals; return g.Deno?.env?.get?.(name) ?? g.process?.env?.[name]; }
function configured(names: string[]) { return names.map(env).find(v => v?.trim())?.trim(); }
function key() {
  const direct = configured(['SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY']);
  if (direct) return direct;
  try { const keys: unknown = JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS') ?? '{}'); if (keys && typeof keys === 'object') { const found = Object.values(keys).find((v): v is string => typeof v === 'string' && v.startsWith('sb_publishable_')); if (found) return found; } } catch { /* legacy fallback */ }
  const legacy = configured(['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY']);
  if (!legacy) throw new Error('Publishable key is not configured');
  return legacy;
}
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!ctx.isAuthenticated() || !token) throw new Error('Sign in required');
  const url = configured(['SUPABASE_URL', 'VITE_SUPABASE_URL']);
  if (!url) throw new Error('Backend URL is not configured');
  return createClient(url, key(), { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
}
