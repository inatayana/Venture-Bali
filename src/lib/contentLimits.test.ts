import { clampText, HIGHLIGHT_MAX, HOOK_MAX } from './contentLimits';

describe('clampText', () => {
  it('leaves short text untouched', () => {
    expect(clampText('Paddle the Ayung River', 200)).toBe('Paddle the Ayung River');
  });

  it('breaks on a word boundary and adds an ellipsis', () => {
    const text = 'Paddle the grade 2-3 rapids of the Ayung River with a safety crew';
    const result = clampText(text, 24);

    expect(result.length).toBeLessThanOrEqual(24);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });

  it('keeps every product hook within the 200 character limit', () => {
    expect(HOOK_MAX).toBe(200);
  });

  it('keeps highlights within the mobile-friendly limit', () => {
    expect(HIGHLIGHT_MAX).toBe(90);
  });
});
