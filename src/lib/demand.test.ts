import { demandBadgeIsHot, demandBadgeLabel, DEMAND_BADGE_MIN } from './demand';

describe('demand badges', () => {
  it('hides the badge when there is nothing real to show', () => {
    expect(demandBadgeLabel(undefined)).toBeNull();
    expect(demandBadgeLabel(0)).toBeNull();
    expect(demandBadgeLabel(1)).toBeNull();
    expect(demandBadgeLabel(DEMAND_BADGE_MIN - 1)).toBeNull();
  });

  it('shows a plain label for real but modest demand', () => {
    expect(demandBadgeLabel(3)).toBe('3× booked in the last 48 hours');
    expect(demandBadgeLabel(11)).toBe('11× booked in the last 48 hours');
    expect(demandBadgeIsHot(11)).toBe(false);
  });

  it('escalates to the hot label for high demand', () => {
    expect(demandBadgeLabel(15)).toBe('🔥 15× booked in the last 48 hours');
    expect(demandBadgeIsHot(15)).toBe(true);
  });
});
