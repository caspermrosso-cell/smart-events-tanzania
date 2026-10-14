import { defineTool } from '@lovable.dev/mcp-js';
import { z } from 'zod';
import { smsInput, smsUnits, tanzaniaPhone } from '../../assistant/validation';
import { authorizedEvent } from '../actions';
export default defineTool({
  name: 'prepare_event_sms', title: 'Prepare SMS for confirmation',
  description: 'Save an SMS draft for selected guests of your event. Sends nothing. The user must open the returned Smart Events review link and confirm sending.',
  inputSchema: { event_id: z.string().uuid(), message: smsInput.shape.message, guest_ids: smsInput.shape.guest_ids },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ event_id, message, guest_ids }, ctx) => {
    try {
      const { db, userId, event } = await authorizedEvent(ctx, event_id, 'sms');
      const { data: guests, error } = await db.from('guests').select('id,full_name,phone').eq('event_id', event_id).eq('user_id', userId).is('deleted_at', null).in('id', guest_ids);
      if (error || guests?.length !== guest_ids.length) throw new Error('Some selected guests are unavailable in this event');
      const recipients = guests.map(g => ({ name: g.full_name, phone: tanzaniaPhone.parse(g.phone) }));
      if (new Set(recipients.map(r => r.phone)).size !== recipients.length) throw new Error('Selected guests have duplicate phone numbers');
      const units = smsUnits(message, recipients.length);
      if (!event || units > event.sms_allocation) throw new Error('Event SMS allocation is insufficient');
      const { data: draft, error: saveError } = await db.from('assistant_sms_drafts').insert({ user_id: userId, event_id, message, recipients, sms_units: units }).select('id,expires_at').single();
      if (saveError || !draft) throw new Error('Unable to save SMS draft');
      const review_url = `https://smart-events-tanzania.lovable.app/sms/review/${draft.id}`;
      return { content: [{ type: 'text', text: `Nothing sent. Review ${recipients.length} recipients and ${units} SMS units, then confirm here: ${review_url}` }], structuredContent: { draft_id: draft.id, review_url, message, recipients, sms_units: units, expires_at: draft.expires_at, status: 'awaiting_confirmation' } };
    } catch (error) { return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unable to prepare SMS' }] }; }
  },
});
