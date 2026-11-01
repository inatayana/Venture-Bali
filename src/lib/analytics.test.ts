import { track } from './analytics';

type TestWindow = Window & { dataLayer?: Record<string, unknown>[] };

describe('analytics track', () => {
  beforeEach(() => {
    window.localStorage.setItem('baliwild_cookie_consent', 'all');
  });

  afterEach(() => {
    delete (window as TestWindow).dataLayer;
    window.localStorage.removeItem('baliwild_cookie_consent');
    jest.restoreAllMocks();
  });

  it('does not collect before consent', () => {
    window.localStorage.removeItem('baliwild_cookie_consent');
    (window as TestWindow).dataLayer = [];

    track('view_item', { item_id: 'vtr-1' });

    expect((window as TestWindow).dataLayer).toHaveLength(0);
  });

  it('pushes the event into window.dataLayer', () => {
    (window as TestWindow).dataLayer = [];

    track('view_item', { item_id: 'vtr-1', value: 450000 });

    expect((window as TestWindow).dataLayer).toHaveLength(1);
    expect((window as TestWindow).dataLayer?.[0]).toMatchObject({
      event: 'view_item',
      item_id: 'vtr-1',
      value: 450000,
    });
    expect(typeof (window as TestWindow).dataLayer?.[0].timestamp).toBe('number');
  });

  it('dispatches a baliwild:analytics event for other listeners', () => {
    const listener = jest.fn();
    window.addEventListener('baliwild:analytics', listener);

    track('select_package', { variant_id: 'var-1' });

    expect(listener).toHaveBeenCalledTimes(1);
    const detail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(detail).toMatchObject({ event: 'select_package', variant_id: 'var-1' });

    window.removeEventListener('baliwild:analytics', listener);
  });

  it('creates the dataLayer queue when GTM has not loaded yet', () => {
    expect(() => track('page_view', { path: '/' })).not.toThrow();
    expect((window as TestWindow).dataLayer).toEqual([
      expect.objectContaining({ event: 'page_view', path: '/' }),
    ]);
  });
});
