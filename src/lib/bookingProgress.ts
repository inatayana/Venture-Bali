/**
 * Booking progress for the checkout sheet.
 *
 * Pure so the UI can stay dumb: given the current config it returns the four
 * steps, whether each one is complete, and which step the guest is on.
 */

export interface BookingProgressInput {
  date: Date | null;
  slot: unknown | null;
  zoneId: string | null;
  hotelAddress: string;
  isTba: boolean;
  customerName: string;
  customerEmail: string;
  customerWhatsApp: string;
  termsAccepted: boolean;
  waiverAccepted: boolean;
}

export interface BookingProgressStep {
  key: 'guests' | 'datetime' | 'pickup' | 'confirm';
  label: string;
  done: boolean;
}

export interface BookingProgress {
  steps: BookingProgressStep[];
  /** Index of the first incomplete step (last index when everything is done). */
  activeIndex: number;
  complete: boolean;
}

export function getBookingProgress(
  input: BookingProgressInput,
  needsPickup: boolean
): BookingProgress {
  const dateTimeReady = Boolean(input.date && input.slot);
  const pickupReady =
    !needsPickup || Boolean(input.zoneId && (input.hotelAddress.trim() || input.isTba));
  const confirmReady = Boolean(
    input.customerName.trim() &&
      input.customerEmail.trim() &&
      input.customerWhatsApp.trim() &&
      input.termsAccepted &&
      input.waiverAccepted
  );

  const steps: BookingProgressStep[] = [
    { key: 'guests', label: 'Guests', done: true },
    { key: 'datetime', label: 'Date & time', done: dateTimeReady },
    { key: 'pickup', label: needsPickup ? 'Pickup' : 'Meeting point', done: pickupReady },
    { key: 'confirm', label: 'Confirm', done: confirmReady },
  ];

  const firstIncomplete = steps.findIndex((step) => !step.done);

  return {
    steps,
    activeIndex: firstIncomplete === -1 ? steps.length - 1 : firstIncomplete,
    complete: firstIncomplete === -1,
  };
}
