/**
 * Booking progress for the two-step checkout sheet.
 *
 * Pure so the UI can stay dumb: given the current config it returns the two
 * steps (plan the trip → guest details) and which one is still incomplete.
 */

export type CheckoutStepKey = 'plan' | 'details';

export interface BookingProgressInput {
  date: Date | null;
  slot: unknown | null;
  vehicleClassType?: string | null;
  zoneId: string | null;
  hotelAddress: string;
  isTba: boolean;
  customerName: string;
  customerEmail: string;
  customerWhatsApp: string;
  termsAccepted: boolean;
  waiverAccepted: boolean;
  /** Outer pickup areas are quoted manually and cannot be paid online. */
  customQuote?: boolean;
}

export interface BookingProgressStep {
  key: CheckoutStepKey;
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
  needsPickup: boolean,
  needsVehicle = false
): BookingProgress {
  const pickupReady =
    !needsPickup ||
    Boolean(
      input.zoneId &&
        !input.customQuote &&
        (input.hotelAddress.trim() || input.isTba)
    );

  const planReady = Boolean(
    input.date &&
      input.slot &&
      pickupReady &&
      (!needsVehicle || input.vehicleClassType)
  );

  const detailsReady = Boolean(
    input.customerName.trim() &&
      input.customerEmail.trim() &&
      input.customerWhatsApp.trim() &&
      input.termsAccepted &&
      input.waiverAccepted
  );

  const steps: BookingProgressStep[] = [
    { key: 'plan', label: 'Plan', done: planReady },
    { key: 'details', label: 'Guest details', done: detailsReady },
  ];

  const firstIncomplete = steps.findIndex((step) => !step.done);

  return {
    steps,
    activeIndex: firstIncomplete === -1 ? steps.length - 1 : firstIncomplete,
    complete: firstIncomplete === -1,
  };
}
