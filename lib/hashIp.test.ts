import { describe, it, expect } from 'vitest';
import { hashIp } from './hashIp';

describe('hashIp', () => {
  it('produces a 64-char hex sha256 digest', () => {
    const digest = hashIp('203.0.113.5');
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same digest for the same input', () => {
    expect(hashIp('203.0.113.5')).toBe(hashIp('203.0.113.5'));
  });

  it('produces different digests for different inputs', () => {
    expect(hashIp('203.0.113.5')).not.toBe(hashIp('198.51.100.7'));
  });
});
