import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { VOTE_COUNT_KEY } from '@/lib/votesRepository';

const ADMIN_SECRET = '05c6ab84-e55f-4391-a0ea-7c8a68224898';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const value = Number(searchParams.get('value'));

  if (secret !== ADMIN_SECRET || !Number.isFinite(value)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const redis = getRedis();
  await redis.set(VOTE_COUNT_KEY, value);
  return NextResponse.json({ count: value });
}
