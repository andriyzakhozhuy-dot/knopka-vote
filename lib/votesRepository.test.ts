import { describe, it, expect, vi } from 'vitest';
import {
  VOTE_COUNT_KEY,
  INITIAL_VOTE_COUNT,
  RATE_LIMIT_TTL_SECONDS,
  getVoteCount,
  incrementVoteCount,
  rateLimitKey,
  isRateLimited,
  setRateLimit,
} from './votesRepository';

function createFakeRedis() {
  return {
    setnx: vi.fn().mockResolvedValue(1),
    get: vi.fn().mockResolvedValue(null),
    incr: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    set: vi.fn().mockResolvedValue('OK'),
  };
}

describe('getVoteCount', () => {
  it('initializes the counter to 218 on first read', async () => {
    const redis = createFakeRedis();
    redis.get.mockResolvedValue(null);
    const count = await getVoteCount(redis as any);
    expect(redis.setnx).toHaveBeenCalledWith(VOTE_COUNT_KEY, INITIAL_VOTE_COUNT);
    expect(count).toBe(INITIAL_VOTE_COUNT);
  });

  it('returns the existing counter value', async () => {
    const redis = createFakeRedis();
    redis.get.mockResolvedValue(305);
    const count = await getVoteCount(redis as any);
    expect(count).toBe(305);
  });
});

describe('incrementVoteCount', () => {
  it('calls INCR on the vote count key', async () => {
    const redis = createFakeRedis();
    redis.incr.mockResolvedValue(219);
    const count = await incrementVoteCount(redis as any);
    expect(redis.incr).toHaveBeenCalledWith(VOTE_COUNT_KEY);
    expect(count).toBe(219);
  });
});

describe('rateLimitKey', () => {
  it('namespaces the ip hash', () => {
    expect(rateLimitKey('abc123')).toBe('ratelimit:abc123');
  });
});

describe('isRateLimited', () => {
  it('returns true when the key exists', async () => {
    const redis = createFakeRedis();
    redis.exists.mockResolvedValue(1);
    expect(await isRateLimited(redis as any, 'abc123')).toBe(true);
  });

  it('returns false when the key does not exist', async () => {
    const redis = createFakeRedis();
    redis.exists.mockResolvedValue(0);
    expect(await isRateLimited(redis as any, 'abc123')).toBe(false);
  });
});

describe('setRateLimit', () => {
  it('sets the rate limit key with a 24h TTL', async () => {
    const redis = createFakeRedis();
    await setRateLimit(redis as any, 'abc123');
    expect(redis.set).toHaveBeenCalledWith('ratelimit:abc123', 1, { ex: RATE_LIMIT_TTL_SECONDS });
  });
});
