/**
 * Phone helpers for the guest contact form.
 *
 * Guests type the local number next to a dial-code prefix (e.g. +62). We store
 * a full international number on the booking so the WhatsApp Cloud API and the
 * field team get a number they can dial without guessing the country.
 */

export function toInternationalPhone(dial: string, local: string): string {
  const digits = local.replace(/\D/g, '');
  if (!digits) return '';

  // The guest pasted a full international number: don't double-prefix it.
  if (digits.startsWith(dial) && digits.length > dial.length + 5) {
    return `+${digits}`;
  }

  return `+${dial}${digits.replace(/^0+/, '')}`;
}

export function localDigits(local: string): string {
  return local.replace(/\D/g, '').replace(/^0+/, '');
}
