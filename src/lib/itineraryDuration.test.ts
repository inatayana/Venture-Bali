import { formatDuration, totalDurationMinutes } from './itineraryDuration';

describe('formatDuration', () => {
  it('formats minutes under an hour', () => {
    expect(formatDuration(20)).toBe('~20 mins');
    expect(formatDuration(45)).toBe('~45 mins');
  });

  it('formats whole hours', () => {
    expect(formatDuration(120)).toBe('~2 h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(75)).toBe('~1 h 15 m');
    expect(formatDuration(390)).toBe('~6 h 30 m');
  });
});

describe('totalDurationMinutes', () => {
  it('sums declared steps', () => {
    expect(totalDurationMinutes([{ durationMinutes: 40 }, { durationMinutes: 75 }])).toBe(115);
  });

  it('ignores steps without minutes', () => {
    expect(totalDurationMinutes([{ durationMinutes: 60 }, {}, { durationMinutes: 30 }])).toBe(90);
  });

  it('returns null when nothing is declared', () => {
    expect(totalDurationMinutes([{}, {}])).toBeNull();
  });
});
