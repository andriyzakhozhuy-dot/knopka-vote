import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const fakeRedis = {
  setnx: vi.fn(),
  get: vi.fn(),
  incr: vi.fn(),
  exists: vi.fn(),
  set: vi.fn(),
};

vi.mock('@/lib/redis', () => ({
  getRedis: () => fakeRedis,
}));

import { GET, POST } from './route';
import { INITIAL_VOTE_COUNT } from '@/lib/votesRepository';

beforeEach(() => {
  vi.clearAllMocks();
  fakeRedis.setnx.mockResolvedValue(1);
  fakeRedis.get.mockResolvedValue(null);
  fakeRedis.exists.mockResolvedValue(0);
});

describe('GET /api/votes', () => {
  it('returns the current count and voted=false when no cookie is set', async () => {
    const request = new NextRequest('http://localhost/api/votes');
    const response = await GET(request);
    const body = await response.json();

    expect(body).toEqual({ count: INITIAL_VOTE_COUNT, voted: false });
  });

  it('returns voted=true when the knopka_voted cookie is present', async () => {
    fakeRedis.get.mockResolvedValue(250);

    const request = new NextRequest('http://localhost/api/votes', {
      headers: { cookie: 'knopka_voted=1' },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(body).toEqual({ count: 250, voted: true });
  });
});

describe('POST /api/votes', () => {
  it('rejects a vote when knopka_voted cookie is already set', async () => {
    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      headers: { cookie: 'knopka_voted=1' },
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(fakeRedis.incr).not.toHaveBeenCalled();
  });

  it('rejects a vote when the IP is already rate limited', async () => {
    fakeRedis.exists.mockResolvedValue(1);

    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.5' },
    });
    const response = await POST(request);

    expect(response.status).toBe(429);
    expect(fakeRedis.incr).not.toHaveBeenCalled();
  });

  it('increments the count and sets the voted cookie on a fresh vote', async () => {
    fakeRedis.incr.mockResolvedValue(219);

    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.5' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ count: 219, voted: true });
    expect(fakeRedis.set).toHaveBeenCalledWith(expect.stringMatching(/^ratelimit:/), 1, { ex: 86400 });
    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toContain('knopka_voted=1');
    expect(setCookieHeader).toContain('HttpOnly');
  });
});
