import {
  ITINERARY_DESCRIPTION_MAX,
  ITINERARY_TITLE_MAX,
  itineraryStepDisplay,
} from './itineraryDisplay';

describe('itineraryStepDisplay', () => {
  it('keeps a short step as the title', () => {
    expect(itineraryStepDisplay('Registration and safety briefing')).toEqual({
      title: 'Registration and safety briefing',
      description: '',
    });
  });

  it('splits a long step on a word boundary', () => {
    const display = itineraryStepDisplay(
      'Registration, gear fitting and a full safety briefing with the river guides'
    );

    expect(display.title.length).toBeLessThanOrEqual(ITINERARY_TITLE_MAX);
    expect(display.title.endsWith(' ')).toBe(false);
    expect(display.description.length).toBeGreaterThan(0);
    expect(display.description.length).toBeLessThanOrEqual(ITINERARY_DESCRIPTION_MAX);
  });

  it('clips the description at the maximum length', () => {
    const long = `${'A'.repeat(60)} ${'b'.repeat(200)}`;
    const display = itineraryStepDisplay(long);

    expect(display.title.length).toBeLessThanOrEqual(ITINERARY_TITLE_MAX);
    expect(display.description.length).toBeLessThanOrEqual(ITINERARY_DESCRIPTION_MAX);
    expect(display.description.endsWith('…')).toBe(true);
  });

  it('trims surrounding whitespace', () => {
    expect(itineraryStepDisplay('   Sunrise walk   ')).toEqual({
      title: 'Sunrise walk',
      description: '',
    });
  });
});
