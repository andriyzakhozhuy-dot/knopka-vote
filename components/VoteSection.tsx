'use client';

import { useEffect, useRef, useState } from 'react';
import { showToast } from '@/lib/toast';
import { burstConfetti } from '@/lib/confetti';
import { trackVoteEvent } from '@/lib/analytics';

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
      try {
        const res = await fetch('/api/votes');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        countRef.current = data.count;
        animateCount(0, data.count);
        if (data.voted) setVoted(true);
      } catch {
        // Ignore network errors; the next poll tick will retry.
      }
    }
    init();

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/votes');
        if (!res.ok) return;
        const data = await res.json();
        if (data.count !== countRef.current) {
          animateCount(countRef.current, data.count);
          countRef.current = data.count;
        }
      } catch {
        // Ignore network errors; the next poll tick will retry.
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
    trackVoteEvent();
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
