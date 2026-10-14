import { it, expect } from 'vitest';
import { oauthReturnPath } from './oauth-return-path';
it('preserves consent return parameters and rejects external redirects', () => {
  expect(oauthReturnPath('/.lovable/oauth/consent?authorization_id=123#review')).toBe('/.lovable/oauth/consent?authorization_id=123#review');
  expect(oauthReturnPath('/\\outside.invalid')).toBe('/dashboard');
  expect(oauthReturnPath('//outside.invalid')).toBe('/dashboard');
});
