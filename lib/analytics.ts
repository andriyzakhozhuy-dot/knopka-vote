export function trackVoteEvent(): void {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  w.gtag?.('event', 'vote_click');
  w.fbq?.('track', 'Lead');
}
