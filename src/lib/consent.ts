export type ConsentValue = 'all' | 'essential';

const STORAGE_KEY = 'baliwild_cookie_consent';
export const CONSENT_EVENT = 'baliwild:consent';

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'all' || value === 'essential' ? value : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(value: ConsentValue): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage can be blocked; the banner will show again */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { value } }));
}

/** Analytics (and any marketing tag) may only run after explicit consent. */
export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === 'all';
}
