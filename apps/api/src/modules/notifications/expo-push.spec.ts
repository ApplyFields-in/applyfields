import { describe, expect, it } from 'vitest';
import { isExpoPushToken } from './expo-push.js';
import { deviceTokenSchema } from './notifications.schemas.js';

describe('isExpoPushToken', () => {
  it('recognises the tokens apps/mobile sends', () => {
    expect(isExpoPushToken('ExponentPushToken[AbC-123_xyz]')).toBe(true);
    expect(isExpoPushToken('ExpoPushToken[AbC-123_xyz]')).toBe(true);
  });

  it('leaves browser subscriptions to the web-push engine', () => {
    // If this ever returned true, every browser push would be sent to Expo instead.
    expect(isExpoPushToken('https://fcm.googleapis.com/fcm/send/abc123')).toBe(false);
    expect(isExpoPushToken('https://web.push.apple.com/QWxhZGRpbjpvcGVu')).toBe(false);
    expect(isExpoPushToken('https://updates.push.services.mozilla.com/wpush/v2/gAAA')).toBe(false);
  });
});

describe('deviceTokenSchema', () => {
  it('accepts a real registration', () => {
    const parsed = deviceTokenSchema.parse({
      token: 'ExponentPushToken[AbC-123_xyz]',
      platform: 'android',
      device_name: 'Pixel 8a',
    });
    expect(parsed.platform).toBe('android');
    // Whatever the schema lets through must be routable to Expo.
    expect(isExpoPushToken(parsed.token)).toBe(true);
  });

  it('rejects anything that is not an Expo token or a known platform', () => {
    expect(() =>
      deviceTokenSchema.parse({ token: 'https://fcm.googleapis.com/x', platform: 'android' }),
    ).toThrow();
    expect(() =>
      deviceTokenSchema.parse({ token: 'ExponentPushToken[abc]', platform: 'windows' }),
    ).toThrow();
    expect(() => deviceTokenSchema.parse({ token: 'ExponentPushToken[]', platform: 'ios' })).toThrow();
  });
});
