import { describe, expect, it } from 'vitest';
import { guestInput, smsInput, smsUnits, requireOwnedEvent, requirePendingDraft } from './validation';
describe('ChatGPT action rules', () => {
  it('requires +255 mobile phone numbers for added guests', () => {
    expect(guestInput.safeParse({ full_name: 'Guest', phone: '+255784670202' }).success).toBe(true);
    expect(guestInput.safeParse({ full_name: 'Guest', phone: '0784670202' }).success).toBe(false);
  });
  it('only accepts an owned active event', () => {
    expect(() => requireOwnedEvent({ user_id: 'other', deleted_at: null }, 'me')).toThrow();
    expect(() => requireOwnedEvent({ user_id: 'me', deleted_at: null }, 'me')).not.toThrow();
  });
  it('requires confirmation against a pending unexpired draft', () => {
    expect(() => requirePendingDraft({ status: 'sent', expires_at: '2030-01-01' }, 0)).toThrow();
    expect(() => requirePendingDraft({ status: 'pending', expires_at: '2020-01-01' }, Date.parse('2026-10-14'))).toThrow();
    expect(() => requirePendingDraft({ status: 'pending', expires_at: '2030-01-01' }, Date.parse('2026-10-14'))).not.toThrow();
  });
  it('charges 160 chars as one unit and longer messages at 153 per segment', () => {
    expect(smsUnits('a'.repeat(160), 2)).toBe(2);
    expect(smsUnits('a'.repeat(161), 2)).toBe(4);
  });
  it('requires resolved message variables for the immutable preview', () => {
    expect(smsInput.shape.message.safeParse('Hello {name}').success).toBe(false);
    expect(smsInput.shape.message.safeParse('Hello Gasper').success).toBe(true);
  });
});
