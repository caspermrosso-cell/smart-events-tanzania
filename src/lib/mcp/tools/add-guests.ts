import { defineTool } from '@lovable.dev/mcp-js';
import { z } from 'zod';
import { guestInput } from '../../assistant/validation';
import { authorizedEvent } from '../actions';
export default defineTool({
  name: 'add_guests', title: 'Add event guests',
  description: 'Add up to 50 guests to an event you own; requires guest-management permission and +255 mobile numbers.',
  inputSchema: { event_id: z.string().uuid(), guests: z.array(guestInput).min(1).max(50) },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ event_id, guests }, ctx) => {
    try {
      const { db, userId } = await authorizedEvent(ctx, event_id, 'guests');
      const cards = guests.map(g => g.card_number).filter(Boolean);
      if (new Set(cards).size !== cards.length) throw new Error('Duplicate card numbers in this request');
      const { data, error } = await db.from('guests').insert(guests.map(g => ({ ...g, user_id: userId, event_id }))).select('id,full_name,phone,card_number');
      if (error) throw new Error(error.code === '23505' ? 'A guest card number already exists; no guests were added' : 'Unable to add guests');
      return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: { guests: data ?? [] } };
    } catch (error) { return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unable to add guests' }] }; }
  },
});
