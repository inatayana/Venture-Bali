import { act, render, screen } from '@testing-library/react';
import { RotatingKeyword } from './RotatingKeyword';

const KEYWORDS = ['ATV Ride', 'Rafting'];

/** Fake timers advance once per call, so chained updates need a loop. */
function tick(times: number, ms: number) {
  for (let index = 0; index < times; index += 1) {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  }
}

describe('RotatingKeyword', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('types the first keyword one character at a time', () => {
    render(<RotatingKeyword keywords={KEYWORDS} />);

    tick(1, 65);
    expect(screen.getByText('A')).toBeInTheDocument();

    tick(7, 65);
    expect(screen.getByText('ATV Ride')).toBeInTheDocument();
  });

  it('holds, deletes and types the next keyword', () => {
    render(<RotatingKeyword keywords={KEYWORDS} />);

    tick(8, 65); // type "ATV Ride"
    tick(1, 1400); // hold
    tick(1, 220); // start deleting
    tick(8, 32); // delete all characters
    tick(1, 220); // move to the next word
    tick(1, 65); // type its first letter

    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('marks the cursor as decorative', () => {
    render(<RotatingKeyword keywords={KEYWORDS} />);

    const cursor = document.querySelector('.animate-blink');
    expect(cursor).toHaveAttribute('aria-hidden', 'true');
  });
});
