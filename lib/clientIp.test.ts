import { describe, it, expect } from 'vitest';
import { getClientIp } from './clientIp';

describe('getClientIp', () => {
  it('returns the first IP from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
    expect(getClientIp(headers)).toBe('203.0.113.5');
  });

  it('falls back to "unknown" when the header is missing', () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe('unknown');
  });
});
