import { describe, expect, it } from 'vitest';
import { isAllowedPushEndpoint } from '@/lib/push';

describe('isAllowedPushEndpoint', () => {
  it('accepte les services de push des navigateurs', () => {
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/abc:def')).toBe(true);
    expect(isAllowedPushEndpoint('https://web.push.apple.com/QGh2...')).toBe(true);
    expect(
      isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/gAAA')
    ).toBe(true);
    expect(isAllowedPushEndpoint('https://wns2-par02p.notify.windows.com/w/?token=x')).toBe(true);
  });

  it('refuse toute autre destination (pas de requête serveur arbitraire)', () => {
    expect(isAllowedPushEndpoint('http://fcm.googleapis.com/fcm/send/abc')).toBe(false);
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com.evil.com/x')).toBe(false);
    expect(isAllowedPushEndpoint('https://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isAllowedPushEndpoint('https://localhost:3000/api')).toBe(false);
    expect(isAllowedPushEndpoint('pas une url')).toBe(false);
  });
});
