import type { Redis } from '@upstash/redis';

export const VOTE_COUNT_KEY = 'votes:count';
export const INITIAL_VOTE_COUNT = 44;
export const RATE_LIMIT_TTL_SECONDS = 60 * 60 * 24;

export async function getVoteCount(redis: Redis): Promise<number> {
  await redis.setnx(VOTE_COUNT_KEY, INITIAL_VOTE_COUNT);
  const count = await redis.get<number>(VOTE_COUNT_KEY);
  return count ?? INITIAL_VOTE_COUNT;
}

export async function incrementVoteCount(redis: Redis): Promise<number> {
  return redis.incr(VOTE_COUNT_KEY);
}

export function rateLimitKey(ipHash: string): string {
  return `ratelimit:${ipHash}`;
}

export async function isRateLimited(redis: Redis, ipHash: string): Promise<boolean> {
  const exists = await redis.exists(rateLimitKey(ipHash));
  return exists === 1;
}

export async function setRateLimit(redis: Redis, ipHash: string): Promise<void> {
  await redis.set(rateLimitKey(ipHash), 1, { ex: RATE_LIMIT_TTL_SECONDS });
}
