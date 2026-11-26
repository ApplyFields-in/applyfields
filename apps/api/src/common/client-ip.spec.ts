import { describe, expect, it } from 'vitest';
import { clientIp, isOurServerRender } from './client-ip.js';

const S = 'shared-secret';

describe('clientIp', () => {
  it('uses the forwarded IP only when our proxy key matches', () => {
    expect(clientIp({ ip: '76.76.21.1', headers: { 'x-af-proxy-key': S, 'x-af-client-ip': '49.37.1.2' } }, S)).toBe('49.37.1.2');
  });

  it('ignores a forged or missing key and falls back to req.ip', () => {
    const forged = { ip: '1.2.3.4', headers: { 'x-af-proxy-key': 'guess', 'x-af-client-ip': '9.9.9.9' } };
    expect(clientIp(forged, S)).toBe('1.2.3.4');
    expect(clientIp({ ip: '1.2.3.4', headers: { 'x-af-client-ip': '9.9.9.9' } }, S)).toBe('1.2.3.4');
  });

  it('never trusts the raw x-forwarded-for header', () => {
    expect(clientIp({ ip: '1.2.3.4', headers: { 'x-forwarded-for': '9.9.9.9' } }, S)).toBe('1.2.3.4');
  });

  it('trusts nothing when the secret is not configured', () => {
    expect(clientIp({ ip: '1.2.3.4', headers: { 'x-af-proxy-key': '', 'x-af-client-ip': '9.9.9.9' } }, undefined)).toBe('1.2.3.4');
  });
});

describe('isOurServerRender', () => {
  it('is true only for our key without a user IP', () => {
    expect(isOurServerRender({ headers: { 'x-af-proxy-key': S } }, S)).toBe(true);
    expect(isOurServerRender({ headers: { 'x-af-proxy-key': S, 'x-af-client-ip': '49.37.1.2' } }, S)).toBe(false);
    expect(isOurServerRender({ headers: { 'x-af-proxy-key': 'guess' } }, S)).toBe(false);
    expect(isOurServerRender({ headers: {} }, undefined)).toBe(false);
  });
});
