# Knopka Vote Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static HTML prototype (`knopka-vote-landing.html`) into a production Next.js site with a real shared vote counter backed by Upstash Redis, ready to push to GitHub and deploy on Vercel.

**Architecture:** Next.js 14+ App Router (TypeScript) with a single page (`app/page.tsx`) composed of server-rendered static sections plus small focused client components for the interactive parts (vote button, share buttons, confetti, scroll-reveal). A `/api/votes` route handler backed by `@upstash/redis` provides the shared counter, protected by an `httpOnly` cookie and an IP-hash rate limit.

**Tech Stack:** Next.js, React, TypeScript, `@upstash/redis`, Vitest (unit tests for server-side logic and pure client utilities).

## Global Constraints

- Design, copywriting, and section structure of `knopka-vote-landing.html` are approved and must be preserved 1:1 — no visual or copy changes.
- Vote counter must live in Upstash Redis (`@upstash/redis` package), not `window.storage`.
- Counter starts at 218 (the prototype's seed value) via atomic init, increments via atomic `INCR`.
- Double-voting protection: `httpOnly` cookie `knopka_voted` (long-lived) AND IP-hash rate limit (24h TTL) in the same Redis instance. Raw IP is never stored — only its SHA-256 hash.
- Vote button disables immediately client-side on a successful vote, same as the prototype.
- Logo stays as the CSS/SVG imitation from the prototype — swapping to a real `<img>` file is explicitly out of scope for this plan.
- `og:image` is out of scope (no image file available yet).
- GA4 / Meta Pixel integrate via `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` env vars, both scripts render conditionally and are empty for now.
- No custom domain configuration in this plan — deploy targets the default `*.vercel.app` URL.
- Project root is `C:\Claude Projects\Vote Knopka` (already a git repo with one commit: the design spec).

---

### Task 1: Project scaffolding & Vitest setup

**Files:**
- Create: `package.json` (via `npm init` + `npm install`, then hand-edited scripts)
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `.gitignore`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx` (placeholder, replaced in Task 7)
- Create: `app/page.tsx` (placeholder, replaced in Task 7)
- Create: `tests/smoke.test.ts`

**Interfaces:**
- Produces: `@/*` path alias resolving to the project root (used by every later task's imports and by Vitest's own module resolution).
- Produces: `npm run dev`, `npm run build`, `npm run start`, `npm run test` scripts.

- [ ] **Step 1: Initialize package.json**

Run: `npm init -y`
Expected: `package.json` created with default fields.

- [ ] **Step 2: Install runtime dependencies**

Run: `npm install next react react-dom @upstash/redis`
Expected: installs succeed, `dependencies` populated in `package.json`.

- [ ] **Step 3: Install dev dependencies**

Run: `npm install -D typescript @types/node @types/react @types/react-dom vitest`
Expected: installs succeed, `devDependencies` populated in `package.json`.

- [ ] **Step 4: Add scripts to package.json**

Edit `package.json`, set the `"scripts"` field to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest run"
}
```

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Create next.config.mjs**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

- [ ] **Step 7: Create .gitignore**

```
node_modules
.next
.env*.local
.vercel
```

- [ ] **Step 8: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 9: Create placeholder app/layout.tsx**

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Create placeholder app/page.tsx**

```tsx
export default function Home() {
  return <main>Coming soon</main>;
}
```

- [ ] **Step 11: Write the smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 12: Run the test suite**

Run: `npm run test`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 13: Verify the build**

Run: `npm run build`
Expected: build completes with no errors (placeholder page compiles).

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs .gitignore vitest.config.ts app tests
git commit -m "Scaffold Next.js project with Vitest"
```

---

### Task 2: Request utilities — hashIp + getClientIp

**Files:**
- Create: `lib/hashIp.ts`
- Create: `lib/hashIp.test.ts`
- Create: `lib/clientIp.ts`
- Create: `lib/clientIp.test.ts`

**Interfaces:**
- Produces: `hashIp(ip: string): string` — SHA-256 hex digest.
- Produces: `getClientIp(headers: Headers): string` — first IP from `x-forwarded-for`, or `'unknown'`.

- [ ] **Step 1: Write the failing tests for hashIp**

Create `lib/hashIp.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/hashIp.test.ts`
Expected: FAIL with "Cannot find module './hashIp'".

- [ ] **Step 3: Implement hashIp**

Create `lib/hashIp.ts`:

```ts
import { createHash } from 'crypto';

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/hashIp.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing tests for getClientIp**

Create `lib/clientIp.test.ts`:

```ts
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
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run lib/clientIp.test.ts`
Expected: FAIL with "Cannot find module './clientIp'".

- [ ] **Step 7: Implement getClientIp**

Create `lib/clientIp.ts`:

```ts
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (!forwarded) return 'unknown';
  return forwarded.split(',')[0].trim();
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run lib/clientIp.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add lib/hashIp.ts lib/hashIp.test.ts lib/clientIp.ts lib/clientIp.test.ts
git commit -m "Add hashIp and getClientIp request utilities"
```

---

### Task 3: Vote counter repository logic

**Files:**
- Create: `lib/votesRepository.ts`
- Create: `lib/votesRepository.test.ts`

**Interfaces:**
- Consumes: nothing project-specific — takes a duck-typed Redis-like object with `setnx`, `get`, `incr`, `exists`, `set` methods (matches `@upstash/redis`'s `Redis` client shape).
- Produces: `VOTE_COUNT_KEY`, `INITIAL_VOTE_COUNT`, `RATE_LIMIT_TTL_SECONDS` constants; `getVoteCount(redis)`, `incrementVoteCount(redis)`, `rateLimitKey(ipHash)`, `isRateLimited(redis, ipHash)`, `setRateLimit(redis, ipHash)` functions — all consumed by Task 4's API route.

- [ ] **Step 1: Write the failing tests**

Create `lib/votesRepository.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/votesRepository.test.ts`
Expected: FAIL with "Cannot find module './votesRepository'".

- [ ] **Step 3: Implement votesRepository**

Create `lib/votesRepository.ts`:

```ts
import type { Redis } from '@upstash/redis';

export const VOTE_COUNT_KEY = 'votes:count';
export const INITIAL_VOTE_COUNT = 218;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/votesRepository.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/votesRepository.ts lib/votesRepository.test.ts
git commit -m "Add vote counter repository logic"
```

---

### Task 4: Votes API route (GET/POST)

**Files:**
- Create: `lib/redis.ts`
- Create: `app/api/votes/route.ts`
- Create: `app/api/votes/route.test.ts`

**Interfaces:**
- Consumes: `getVoteCount`, `incrementVoteCount`, `isRateLimited`, `setRateLimit` from `@/lib/votesRepository` (Task 3); `hashIp` from `@/lib/hashIp`, `getClientIp` from `@/lib/clientIp` (Task 2).
- Produces: `getRedis(): Redis` from `@/lib/redis` (lazy singleton, so importing it doesn't require env vars to be set at build time). Produces the `GET`/`POST` route handlers and `VOTE_COOKIE_NAME` / `VOTE_COOKIE_MAX_AGE` constants, consumed by Task 6's `VoteSection` component (via `fetch('/api/votes')`).

- [ ] **Step 1: Implement the lazy Redis client**

Create `lib/redis.ts`:

```ts
import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = Redis.fromEnv();
  }
  return client;
}
```

- [ ] **Step 2: Write the failing tests for the route**

Create `app/api/votes/route.test.ts`:

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run app/api/votes/route.test.ts`
Expected: FAIL with "Cannot find module './route'".

- [ ] **Step 4: Implement the route handlers**

Create `app/api/votes/route.ts`:

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run app/api/votes/route.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Verify the full suite and build still pass**

Run: `npm run test`
Expected: all test files PASS.

Run: `npm run build`
Expected: build succeeds (no Upstash env vars needed — `Redis.fromEnv()` is only called lazily inside the request handlers, not at import time).

- [ ] **Step 7: Commit**

```bash
git add lib/redis.ts app/api/votes/route.ts app/api/votes/route.test.ts
git commit -m "Add /api/votes route with cookie and IP rate-limit protection"
```

---

### Task 5: Client DOM utilities — toast, confetti, canvas, reveal-on-scroll

**Files:**
- Create: `lib/toast.ts`
- Create: `lib/toast.test.ts`
- Create: `lib/confetti.ts`
- Create: `components/ConfettiCanvas.tsx`
- Create: `components/RevealOnScroll.tsx`

**Interfaces:**
- Produces: `showToast(message: string): void` from `@/lib/toast` — looks up `#toast` in the DOM. Consumed by Task 6's `VoteSection` and `ShareButtons`.
- Produces: `burstConfetti(): void` from `@/lib/confetti` — looks up `#confetti-canvas` in the DOM. Consumed by Task 6's `VoteSection`.
- Produces: `<ConfettiCanvas />` and `<RevealOnScroll />` components, consumed by Task 7's `app/page.tsx`.

- [ ] **Step 1: Write the failing tests for showToast**

Create `lib/toast.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { showToast } from './toast';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('showToast', () => {
  it('sets the toast text and shows it, then hides it after 2.6s', () => {
    vi.useFakeTimers();
    const classList = { add: vi.fn(), remove: vi.fn() };
    const el = { textContent: '', classList };
    vi.stubGlobal('document', { getElementById: vi.fn().mockReturnValue(el) });

    showToast('Дякуємо!');

    expect(el.textContent).toBe('Дякуємо!');
    expect(classList.add).toHaveBeenCalledWith('show');

    vi.advanceTimersByTime(2600);
    expect(classList.remove).toHaveBeenCalledWith('show');
  });

  it('does nothing when the toast element is missing', () => {
    vi.stubGlobal('document', { getElementById: vi.fn().mockReturnValue(null) });
    expect(() => showToast('x')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/toast.test.ts`
Expected: FAIL with "Cannot find module './toast'".

- [ ] **Step 3: Implement showToast**

Create `lib/toast.ts`:

```ts
export function showToast(message: string): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/toast.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement burstConfetti (ported from the prototype, no dedicated unit test — canvas animation is verified manually in Task 7)**

Create `lib/confetti.ts`:

```ts
const COLORS = ['#F5C518', '#E4572E', '#2E6FD9', '#63B05C', '#1FADA3'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  life: number;
}

export function burstConfetti(): void {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight / 2;
  const particles: Particle[] = [];

  for (let i = 0; i < 90; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 7;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
    });
  }

  function animate() {
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    let alive = false;
    particles.forEach((p) => {
      if (p.life > 90) return;
      alive = true;
      p.vy += 0.14;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;
      ctx!.save();
      ctx!.globalAlpha = Math.max(0, 1 - p.life / 90);
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    });
    if (alive) requestAnimationFrame(animate);
    else ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
  }

  requestAnimationFrame(animate);
}
```

- [ ] **Step 6: Implement the confetti canvas component (owns sizing, no dedicated unit test — verified manually in Task 7)**

Create `components/ConfettiCanvas.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

export default function ConfettiCanvas() {
  useEffect(() => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas id="confetti-canvas" />;
}
```

- [ ] **Step 7: Implement the reveal-on-scroll component (no dedicated unit test — verified manually in Task 7)**

Create `components/RevealOnScroll.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

export default function RevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
```

- [ ] **Step 8: Run the full test suite**

Run: `npm run test`
Expected: all test files PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/toast.ts lib/toast.test.ts lib/confetti.ts components/ConfettiCanvas.tsx components/RevealOnScroll.tsx
git commit -m "Add toast, confetti, and reveal-on-scroll client utilities"
```

---

### Task 6: Interactive components — VoteSection + ShareButtons

**Files:**
- Create: `components/VoteSection.tsx`
- Create: `components/ShareButtons.tsx`

**Interfaces:**
- Consumes: `showToast` from `@/lib/toast`, `burstConfetti` from `@/lib/confetti` (Task 5); `GET`/`POST /api/votes` contract from Task 4 (`{ count, voted }` on GET, `{ count, voted }` on successful POST, `{ error: 'already_voted' | 'rate_limited' }` with 403/429 on rejected POST).
- Produces: `<VoteSection />` and `<ShareButtons />` default exports, consumed by Task 7's `app/page.tsx`. `trackVoteEvent` is NOT wired in yet — Task 8 adds that call once `@/lib/analytics` exists.

- [ ] **Step 1: Implement VoteSection**

Create `components/VoteSection.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { showToast } from '@/lib/toast';
import { burstConfetti } from '@/lib/confetti';

const GOAL = 1000;
const CIRC = 2 * Math.PI * 95;

export default function VoteSection() {
  const [count, setCount] = useState(0);
  const [voted, setVoted] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);
  const countRef = useRef(0);

  function animateCount(from: number, to: number) {
    const dur = 700;
    const start = performance.now();
    function step(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (to - from) * eased);
      setCount(val);
      const pct = Math.min(1, val / GOAL);
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(CIRC * (1 - pct));
      }
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const res = await fetch('/api/votes');
      const data = await res.json();
      if (cancelled) return;
      countRef.current = data.count;
      animateCount(0, data.count);
      if (data.voted) setVoted(true);
    }
    init();

    const interval = setInterval(async () => {
      const res = await fetch('/api/votes');
      const data = await res.json();
      if (data.count !== countRef.current) {
        animateCount(countRef.current, data.count);
        countRef.current = data.count;
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleVote() {
    if (voted) return;
    setVoted(true);

    const res = await fetch('/api/votes', { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 403 || res.status === 429) {
        showToast(
          body.error === 'rate_limited'
            ? 'З цієї мережі вже голосували'
            : 'Ви вже голосували раніше',
        );
      } else {
        setVoted(false);
        showToast('Не вдалося проголосувати, спробуйте ще раз');
      }
      return;
    }

    const data = await res.json();
    animateCount(countRef.current, data.count);
    countRef.current = data.count;
    burstConfetti();
    showToast('Дякуємо за ваш голос! 🎉');
  }

  return (
    <section className="vote-card reveal">
      <div className="ring-wrap">
        <svg viewBox="0 0 220 220">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4FC1EA" />
              <stop offset="100%" stopColor="#0C7BA8" />
            </linearGradient>
          </defs>
          <circle className="ring-bg" cx="110" cy="110" r="95" />
          <circle
            ref={ringRef}
            className="ring-fg"
            cx="110"
            cy="110"
            r="95"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC}
          />
        </svg>
        <div className="dot dot-y" />
        <div className="dot dot-r" />
        <div className="dot dot-b" />
        <div className="dot dot-g" />
        <div className="ring-center">
          <div className="bag">🎒</div>
          <div className="ring-count">{count}</div>
          <div className="ring-goal">з 1000 голосів</div>
        </div>
      </div>

      <button className="vote-btn" disabled={voted} onClick={handleVote}>
        {voted ? 'Дякуємо! Ваш голос враховано ✓' : 'ПРОГОЛОСУВАТИ ЗА ПРОДОВЖЕННЯ'}
      </button>
      <div className="deadline">
        Голосування триває до <b>19 липня</b> — тоді ми оголосимо рішення
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement ShareButtons**

Create `components/ShareButtons.tsx`:

```tsx
'use client';

import { showToast } from '@/lib/toast';

const VOTE_URL = 'https://knopka.shop/vote';
const SHARE_TEXT = 'Проголосуй за продовження акції «Рюкзак + в рюкзак» у Кнопці!';

function shareTo(type: 'telegram' | 'viber' | 'copy') {
  if (type === 'telegram') {
    window.open(
      'https://t.me/share/url?url=' + encodeURIComponent(VOTE_URL) + '&text=' + encodeURIComponent(SHARE_TEXT),
      '_blank',
    );
  } else if (type === 'viber') {
    window.open('viber://forward?text=' + encodeURIComponent(SHARE_TEXT + ' ' + VOTE_URL), '_blank');
  } else {
    navigator.clipboard.writeText(VOTE_URL).then(() => showToast('Посилання скопійовано'));
  }
}

export default function ShareButtons() {
  return (
    <section className="share reveal">
      <p>Розкажіть друзям — разом швидше наберемо 1000 голосів</p>
      <div className="share-row">
        <button className="share-btn" onClick={() => shareTo('telegram')}>Telegram</button>
        <button className="share-btn" onClick={() => shareTo('viber')}>Viber</button>
        <button className="share-btn" onClick={() => shareTo('copy')}>Скопіювати посилання</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: build succeeds (components compile; they aren't wired into a page yet, so no visual check here).

- [ ] **Step 4: Commit**

```bash
git add components/VoteSection.tsx components/ShareButtons.tsx
git commit -m "Add VoteSection and ShareButtons interactive components"
```

---

### Task 7: Page assembly — globals.css, layout.tsx, page.tsx

**Files:**
- Create: `app/globals.css`
- Modify: `app/layout.tsx` (replace placeholder with full metadata + CSS import)
- Modify: `app/page.tsx` (replace placeholder with the full ported markup)

**Interfaces:**
- Consumes: `VoteSection` and `ShareButtons` from `@/components/*` (Task 6); `ConfettiCanvas` and `RevealOnScroll` from `@/components/*` (Task 5).

- [ ] **Step 1: Create app/globals.css**

Create `app/globals.css` with the full stylesheet ported verbatim from `knopka-vote-landing.html` (the entire content of its `<style>` block, lines 10–467 of that file — the `@import`, `:root` custom properties, and every selector from `*{...}` through `.toast.show{...}`). Copy it exactly as-is; do not alter selectors, values, or animations.

- [ ] **Step 2: Replace app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Кнопка — Голосуй за продовження акції «Рюкзак + в рюкзак»',
  description:
    'Проголосуйте, і якщо набереться 1000 голосів, ми продовжимо акцію «Рюкзак + в рюкзак» — купуєш рюкзак і отримуєш -50% на все, що покладеш в нього.',
  openGraph: {
    title: 'Кнопка — Хочеш, щоб акція тривала довше?',
    description:
      'Проголосуйте за продовження акції «Рюкзак + в рюкзак» — купуєш рюкзак і отримуєш -50% на все, що покладеш в нього.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Replace app/page.tsx**

```tsx
import VoteSection from '@/components/VoteSection';
import ShareButtons from '@/components/ShareButtons';
import ConfettiCanvas from '@/components/ConfettiCanvas';
import RevealOnScroll from '@/components/RevealOnScroll';

export default function Home() {
  return (
    <>
      <RevealOnScroll />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <ConfettiCanvas />
      <div className="toast" id="toast" />

      <div className="wrap">
        <header className="reveal">
          <svg className="logo-arc" viewBox="0 0 320 90" width="240" height="64">
            <path id="arcPath" d="M 8 82 A 152 152 0 0 1 312 82" fill="none" />
            <text textAnchor="middle">
              <textPath href="#arcPath" startOffset="50%">ART GIFTS TREND SHOP</textPath>
            </text>
          </svg>
          <div className="logo">KN<span className="o-dot" />PKA</div>
          <div className="logo-sub">офіс <span className="dot" />творчість<span className="dot" />школа</div>
          <div className="logo-sub2">іграшка <span className="dot" />horeca<span className="dot" />подарунки</div>
        </header>

        <section className="hero reveal">
          <h1>
            Хочете, щоб акція
            <br />
            тривала довше?
          </h1>
          <p>Проголосуйте, і якщо набереться 1000 голосів, ми продовжимо акцію</p>
        </section>

        <VoteSection />

        <section className="conditions">
          <div className="cond-card reveal">
            <div className="cond-icon i1">🎒</div>
            <h3>Умови акції</h3>
            <p>Купуєте будь-який рюкзак у «Кнопці» — отримуєте знижку 50% на шкільне приладдя, яке покладете в нього.</p>
          </div>
          <div className="cond-card reveal">
            <div className="cond-icon i2">📍</div>
            <h3>Де діє</h3>
            <p>Офлайн-магазини «Кнопка» у Рівному та Луцьку. Акція діє під час покупки в торговій точці.</p>
          </div>
          <div className="cond-card reveal">
            <div className="cond-icon i3">🔗</div>
            <h3>Дізнатись більше</h3>
            <p>Весь асортимент і адреси магазинів</p>
            <a className="cond-btn" href="https://knopka.shop/" target="_blank" rel="noopener">
              Перейти на knopka.shop
            </a>
          </div>
        </section>

        <ShareButtons />

        <footer className="reveal">
          <div className="footer-grid">
            <div className="store-card">
              <h4>Магазин у Рівному</h4>
              <div className="store-line">
                <span className="ic">📍</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=%D0%A0%D1%96%D0%B2%D0%BD%D0%B5%2C%20%D0%B2%D1%83%D0%BB.%20%D0%9A%D0%BD%D1%8F%D0%B3%D0%B8%D0%BD%D0%B8%D1%86%D1%8C%D0%BA%D0%BE%D0%B3%D0%BE%2C%201"
                  target="_blank"
                  rel="noopener"
                >
                  33013, Україна, Рівненська обл., м. Рівне, вул. Княгиницького, 1
                </a>
              </div>
              <div className="store-line">
                <span className="ic">🕘</span>
                <div className="store-hours">
                  <span>Пн–Пт: 08:30–19:00</span>
                  <span>Сб–Нд: 09:00–18:00</span>
                </div>
              </div>
              <div className="store-line">
                <span className="ic">📞</span>
                <a className="phone-link" href="tel:+380675490031">(067) 549-00-31</a>
              </div>
            </div>

            <div className="store-card">
              <h4>Магазин у Луцьку</h4>
              <div className="store-line">
                <span className="ic">📍</span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=%D0%9B%D1%83%D1%86%D1%8C%D0%BA%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%92%D0%BE%D0%BB%D1%96%2C%2027"
                  target="_blank"
                  rel="noopener"
                >
                  проспект Волі, 27, Луцьк, Волинська область, 43000
                </a>
              </div>
              <div className="store-line">
                <span className="ic">🕘</span>
                <div className="store-hours">
                  <span>Пн–Пт: 09:00–19:00</span>
                  <span>Сб–Нд: 10:00–17:00</span>
                </div>
              </div>
              <div className="store-line">
                <span className="ic">📞</span>
                <a className="phone-link" href="tel:+380671749221">(067) 174-92-21</a>
              </div>
            </div>
          </div>

          <div className="social-row">
            <a className="social-icon" href="https://www.facebook.com/knopka.shop.official" target="_blank" rel="noopener" aria-label="Facebook">
              <svg viewBox="0 0 24 24"><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.35 4.24 14.3 4.24c-2.17 0-3.66 1.32-3.66 3.76v2.5H8.1v3h2.54V21h2.86z" /></svg>
            </a>
            <a className="social-icon" href="https://www.instagram.com/knopka.shop.official" target="_blank" rel="noopener" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zm0 5.6a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zm4.3-6.9a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0zM20 8c-.06-1.2-.33-2.27-1.2-3.14C17.93 4 16.86 3.73 15.67 3.67 14.44 3.6 9.56 3.6 8.33 3.67 7.14 3.73 6.07 4 5.2 4.86 4.33 5.73 4.06 6.8 4 8 3.93 9.23 3.93 14.77 4 16c.06 1.2.33 2.27 1.2 3.14.87.87 1.94 1.14 3.13 1.2 1.23.07 6.11.07 7.34 0 1.19-.06 2.26-.33 3.13-1.2.87-.87 1.14-1.94 1.2-3.14.07-1.23.07-6.77 0-8zm-2.15 9.65c-.26.66-.77 1.17-1.43 1.44-.99.39-3.34.3-4.42.3s-3.44.09-4.42-.3a2.5 2.5 0 0 1-1.43-1.44c-.39-.99-.3-3.34-.3-4.42s-.09-3.44.3-4.42c.26-.66.77-1.17 1.43-1.44.99-.39 3.34-.3 4.42-.3s3.44-.09 4.42.3c.66.27 1.17.78 1.43 1.44.39.99.3 3.34.3 4.42s.09 3.44-.3 4.42z" /></svg>
            </a>
            <a className="social-icon" href="https://www.tiktok.com/@knopka.shop" target="_blank" rel="noopener" aria-label="TikTok">
              <svg viewBox="0 0 24 24"><path d="M16.5 3c.4 2.2 1.9 3.8 4.1 4v2.7c-1.5.1-2.9-.4-4.1-1.2v6.6c0 3.4-2.8 5.9-6 5.9-3.3 0-6-2.6-6-5.9s2.8-5.9 6-5.9c.4 0 .8 0 1.2.1v2.8c-.4-.1-.8-.2-1.2-.2-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2 3.3-1.4 3.3-3.2V3h2.7z" /></svg>
            </a>
          </div>

          <div className="footer-bottom">
            Кнопка · офіс · творчість · школа
            <br />
            <a href="https://knopka.shop/" target="_blank" rel="noopener">knopka.shop</a>
          </div>
        </footer>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev`, open `http://localhost:3000`.

Check:
- Page matches the prototype visually (colors, fonts, blobs, logo imitation, ring, cards, footer).
- Ring count animates in from 0 to the seeded value (218) on load.
- Sections fade/slide in on scroll (reveal effect).
- Click the vote button: count increments by 1, confetti bursts, toast "Дякуємо за ваш голос! 🎉" appears, button switches to the disabled "Дякуємо! Ваш голос враховано ✓" state.
- Refresh the page: button is still disabled (cookie persisted) and the count reflects the vote.
- Open DevTools → Application → Cookies: confirm `knopka_voted` is present and marked `HttpOnly`.
- Click each share button: Telegram/Viber open share intents, "Скопіювати посилання" copies the URL and shows a toast.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx
git commit -m "Assemble the full landing page from ported markup and styles"
```

---

### Task 8: Analytics — GA4 + Meta Pixel

**Files:**
- Create: `lib/analytics.ts`
- Create: `lib/analytics.test.ts`
- Modify: `app/layout.tsx` (add conditional GA4/Meta Pixel scripts)
- Modify: `components/VoteSection.tsx` (call `trackVoteEvent()` on a successful vote)
- Create: `.env.example`

**Interfaces:**
- Produces: `trackVoteEvent(): void` from `@/lib/analytics` — calls `window.gtag('event', 'vote_click')` and `window.fbq('track', 'Lead')` if those globals exist, no-ops otherwise (including during SSR where `window` is undefined).

- [ ] **Step 1: Write the failing tests**

Create `lib/analytics.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { trackVoteEvent } from './analytics';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('trackVoteEvent', () => {
  it('does nothing when window is undefined (SSR)', () => {
    expect(() => trackVoteEvent()).not.toThrow();
  });

  it('calls gtag and fbq when present on window', () => {
    const gtag = vi.fn();
    const fbq = vi.fn();
    vi.stubGlobal('window', { gtag, fbq });

    trackVoteEvent();

    expect(gtag).toHaveBeenCalledWith('event', 'vote_click');
    expect(fbq).toHaveBeenCalledWith('track', 'Lead');
  });

  it('does not throw when gtag/fbq are not defined', () => {
    vi.stubGlobal('window', {});
    expect(() => trackVoteEvent()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/analytics.test.ts`
Expected: FAIL with "Cannot find module './analytics'".

- [ ] **Step 3: Implement trackVoteEvent**

Create `lib/analytics.ts`:

```ts
export function trackVoteEvent(): void {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  w.gtag?.('event', 'vote_click');
  w.fbq?.('track', 'Lead');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/analytics.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire trackVoteEvent into VoteSection**

Modify `components/VoteSection.tsx`: add the import next to the existing ones —

```tsx
import { showToast } from '@/lib/toast';
import { burstConfetti } from '@/lib/confetti';
import { trackVoteEvent } from '@/lib/analytics';
```

and inside `handleVote`, after `showToast('Дякуємо за ваш голос! 🎉');` add:

```tsx
    showToast('Дякуємо за ваш голос! 🎉');
    trackVoteEvent();
```

- [ ] **Step 6: Add conditional analytics scripts to layout.tsx**

Modify `app/layout.tsx` to:

```tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Кнопка — Голосуй за продовження акції «Рюкзак + в рюкзак»',
  description:
    'Проголосуйте, і якщо набереться 1000 голосів, ми продовжимо акцію «Рюкзак + в рюкзак» — купуєш рюкзак і отримуєш -50% на все, що покладеш в нього.',
  openGraph: {
    title: 'Кнопка — Хочеш, щоб акція тривала довше?',
    description:
      'Проголосуйте за продовження акції «Рюкзак + в рюкзак» — купуєш рюкзак і отримуєш -50% на все, що покладеш в нього.',
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        {children}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
                window.gtag = gtag;
              `}
            </Script>
          </>
        )}
        {META_PIXEL_ID && (
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create .env.example**

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_META_PIXEL_ID=
```

- [ ] **Step 8: Verify the build**

Run: `npm run build`
Expected: build succeeds with `GA_ID`/`META_PIXEL_ID` both undefined (no scripts render — confirmed by no errors and no script tags in the rendered HTML).

- [ ] **Step 9: Run the full test suite**

Run: `npm run test`
Expected: all test files PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/analytics.ts lib/analytics.test.ts components/VoteSection.tsx app/layout.tsx .env.example
git commit -m "Add conditional GA4/Meta Pixel analytics with vote_click tracking"
```

---

### Task 9: Finalize and prepare for deploy

**Files:**
- No new files — this task pushes the already-committed history to GitHub.

- [ ] **Step 1: Confirm working tree is clean**

Run: `git status`
Expected: "nothing to commit, working tree clean".

- [ ] **Step 2: Rename the default branch to main**

Run: `git branch -M main`

- [ ] **Step 3: Add the GitHub remote**

Ask the user for the empty GitHub repository URL they created (e.g. `https://github.com/<user>/knopka-vote.git`), then run:

Run: `git remote add origin <URL>`

- [ ] **Step 4: Push**

Run: `git push -u origin main`
Expected: push succeeds, all commits (design spec + Task 1–8 commits) appear on GitHub.

- [ ] **Step 5: Hand off remaining manual steps to the user**

Tell the user the code is on GitHub and remind them of the steps that are theirs to do (already listed in `zavdannya_deploy_claude_code.md`):
- Import the repo on vercel.com.
- Connect Upstash Redis via Vercel Dashboard → Storage → Marketplace Database Integrations (this sets `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` automatically).
- Deploy.
- Optionally set `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` in Vercel → Settings → Environment Variables once they have those IDs, then redeploy.
- Provide the logo file when ready so the CSS imitation can be swapped for a real `<img src="/logo.png">`.

---

## Self-Review Notes

- **Spec coverage:** Next.js scaffold (Task 1), Upstash-backed atomic counter seeded at 218 (Task 3), cookie + IP-hash rate limit (Task 4), frontend immediate button lock (Task 6), 1:1 visual/copy port (Task 7), conditional GA4/Meta Pixel (Task 8), git init/commit/push to GitHub (Task 9, already git-initialized). Logo, `og:image`, analytics IDs, and custom domain are explicitly deferred per the approved spec's "out of scope" section.
- **Type consistency:** `VOTE_COOKIE_NAME`/`VOTE_COOKIE_MAX_AGE` (route.ts) and `VOTE_COUNT_KEY`/`INITIAL_VOTE_COUNT`/`RATE_LIMIT_TTL_SECONDS` (votesRepository.ts) are defined once and imported everywhere they're used, with matching names across tasks.
- **No placeholders:** every step has concrete file contents or exact commands; no "TBD" remains outside of the intentionally-empty `.env.example` values (which are env var placeholders by design, filled in by the user in Vercel).
