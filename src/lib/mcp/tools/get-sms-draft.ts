import { defineTool } from '@lovable.dev/mcp-js';
import { z } from 'zod';
import { supabaseForUser } from '../supabase';
export default defineTool({
  name: 'get_sms_draft', title: 'Read SMS confirmation status', description: 'Read your saved SMS draft and its send result after human confirmation.',
  inputSchema: { draft_id: z.string().uuid() }, annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ draft_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { isError: true, content: [{ type: 'text', text: 'Sign in required' }] };
    const { data, error } = await supabaseForUser(ctx).from('assistant_sms_drafts').select('id,event_id,message,sms_units,status,result,expires_at').eq('id', draft_id).eq('user_id', ctx.getUserId()).maybeSingle();
    if (error || !data) return { isError: true, content: [{ type: 'text', text: 'Draft unavailable' }] };
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { draft: data } };
  },
});
