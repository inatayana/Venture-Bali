import { resolveInitialTheme } from './theme';

describe('resolveInitialTheme', () => {
  it('prefers an explicit stored choice', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
    expect(resolveInitialTheme('light', true)).toBe('light');
  });

  it('follows the system preference when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
    expect(resolveInitialTheme('system', true)).toBe('dark');
  });
});
