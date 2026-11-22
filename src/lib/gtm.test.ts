import { getGoogleTagManagerId, googleTagManagerScript, GOOGLE_TAG_MANAGER_SRC } from './gtm';

describe('gtm configuration', () => {
  const originalId = process.env.NEXT_PUBLIC_GTM_ID;

  afterEach(() => {
    if (originalId === undefined) {
      delete process.env.NEXT_PUBLIC_GTM_ID;
    } else {
      process.env.NEXT_PUBLIC_GTM_ID = originalId;
    }
  });

  it('returns null when the container id is not configured', () => {
    delete process.env.NEXT_PUBLIC_GTM_ID;

    expect(getGoogleTagManagerId()).toBeNull();
  });

  it('returns the trimmed container id when configured', () => {
    process.env.NEXT_PUBLIC_GTM_ID = ' GTM-TEST123 ';

    expect(getGoogleTagManagerId()).toBe('GTM-TEST123');
  });

  it('builds the standard GTM script url for the container id', () => {
    process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

    const script = googleTagManagerScript('GTM-TEST123');

    expect(script.src).toBe(`${GOOGLE_TAG_MANAGER_SRC}?id=GTM-TEST123`);
    expect(script.async).toBe(true);
  });
});
