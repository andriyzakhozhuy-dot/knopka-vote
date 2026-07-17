import { describe, it, expect, vi, afterEach } from 'vitest';
import { trackVoteEvent } from './analytics';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('trackVoteEvent', () => {
  it('does nothing when window is undefined (SSR)', () => {
    expect(() => trackVoteEvent()).not.toThrow();
  });

  it('calls gtag, fbq, and ttq when present on window', () => {
    const gtag = vi.fn();
    const fbq = vi.fn();
    const ttq = { track: vi.fn() };
    vi.stubGlobal('window', { gtag, fbq, ttq });

    trackVoteEvent();

    expect(gtag).toHaveBeenCalledWith('event', 'vote_click');
    expect(fbq).toHaveBeenCalledWith('track', 'Lead');
    expect(ttq.track).toHaveBeenCalledWith('ClickButton');
  });

  it('does not throw when gtag/fbq/ttq are not defined', () => {
    vi.stubGlobal('window', {});
    expect(() => trackVoteEvent()).not.toThrow();
  });
});
