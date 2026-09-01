import { cn } from './cn';

describe('cn utility', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', false, null, undefined, '', 'bar')).toBe('foo bar');
  });

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles object notation for conditional classes', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
  });

  it('handles mixed input types', () => {
    expect(
      cn('base', ['array-class'], { 'object-class': true, hidden: false })
    ).toBe('base array-class object-class');
  });

  it('returns empty string for empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles numbers', () => {
    expect(cn(1, 'foo', 0)).toBe('1 foo');
  });
});
