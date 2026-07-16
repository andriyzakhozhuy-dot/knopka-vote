import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { getClientIp } from '@/lib/clientIp';
import { hashIp } from '@/lib/hashIp';
import {
  getVoteCount,
  incrementVoteCount,
  isRateLimited,
  setRateLimit,
} from '@/lib/votesRepository';

export const VOTE_COOKIE_NAME = 'knopka_voted';
export const VOTE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function GET(request: NextRequest) {
  const redis = getRedis();
  const count = await getVoteCount(redis);
  const voted = request.cookies.get(VOTE_COOKIE_NAME)?.value === '1';
  return NextResponse.json({ count, voted });
}

export async function POST(request: NextRequest) {
  const redis = getRedis();

  const alreadyVoted = request.cookies.get(VOTE_COOKIE_NAME)?.value === '1';
  if (alreadyVoted) {
    return NextResponse.json({ error: 'already_voted' }, { status: 403 });
  }

  const ipHash = hashIp(getClientIp(request.headers));

  if (await isRateLimited(redis, ipHash)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  await setRateLimit(redis, ipHash);
  const count = await incrementVoteCount(redis);

  const response = NextResponse.json({ count, voted: true });
  response.cookies.set(VOTE_COOKIE_NAME, '1', {
    httpOnly: true,
    maxAge: VOTE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
}
