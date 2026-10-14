import { z } from 'zod';
export const tanzaniaPhone = z.string().regex(/^\+255[67]\d{8}$/, 'Use a Tanzania mobile number in +255 format');
export const guestInput = z.object({
  full_name: z.string().trim().min(1).max(255), phone: tanzaniaPhone,
  card_number: z.string().trim().min(1).max(100).optional(), email: z.string().email().optional(),
});
export const smsInput = z.object({
  message: z.string().min(1).max(1000).refine(v => v.trim().length > 0, 'Message is required').refine(v => !/\{[a-zA-Z0-9_]+\}/.test(v), 'Resolve all variables before preparing a draft'),
  guest_ids: z.array(z.string().uuid()).min(1).max(50).refine(v => new Set(v).size === v.length, 'Duplicate guests are not allowed'),
});
export function smsUnits(message: string, recipients: number) { const length = Array.from(message).length; return (length <= 160 ? 1 : Math.ceil(length / 153)) * recipients; }
export function requireOwnedEvent(event: { user_id: string; deleted_at: string | null } | null, userId: string) {
  if (!event || event.user_id !== userId || event.deleted_at) throw new Error('Event is unavailable or not owned by you');
}
export function requirePendingDraft(draft: { status: string; expires_at: string }, now = Date.now()) {
  if (draft.status !== 'pending' || Date.parse(draft.expires_at) <= now) throw new Error('Draft expired or already processed');
}
