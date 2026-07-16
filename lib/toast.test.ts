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
