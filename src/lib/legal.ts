/**
 * BaliWild — legal copy
 * --------------------------
 * DRAFT v1 (2026-11-01). These texts are rendered on /terms and /waiver and the
 * accepted version is stored on every booking (`waiverVersion`).
 *
 * ⚠️ BEFORE LAUNCH: this must be reviewed and approved by Indonesian counsel.
 * The wording reflects the policies this codebase actually enforces
 * (docs/REFUND_POLICY.md v2, docs/NO_SHOW_POLICY.md) — keep them in sync.
 */

import { BRAND_EMAIL_HELLO, BRAND_EMAIL_SUPPORT } from './brand';

export const TERMS_VERSION = '2026-11-01';
export const WAIVER_VERSION = '2026-11-01';

export interface LegalSection {
  title: string;
  body: string[];
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. About these terms',
    body: [
      'BaliWild is a booking platform for adventure activities in Bali, Indonesia. We arrange the reservation, payment and customer support; the activity itself is delivered by a licensed local activity partner.',
      'By confirming a booking you agree to these terms, the cancellation policy and the activity safety waiver.',
    ],
  },
  {
    title: '2. Bookings and confirmation',
    body: [
      'Bookings are confirmed when the payment is settled and a booking reference with an e-voucher is issued. The lead guest is responsible for the accuracy of names, contact details, participant count and pickup information.',
      'A temporary hold of 10 minutes protects your slot while you pay. If the payment session expires, the slot is released and you will need to select the date and time again.',
    ],
  },
  {
    title: '3. Prices and payment',
    body: [
      'All prices are in Indonesian Rupiah (IDR) and include the services listed on the package. Payments are processed by Midtrans (QRIS, virtual accounts, e-wallets and cards). BaliWild never stores card numbers.',
      'A promotional price and a coupon code can never be combined. The amount shown at checkout is the amount charged.',
    ],
  },
  {
    title: '4. Cancellation, reschedule and no-show',
    body: [
      'Cancellation at least 24 hours before the activity start: 20% cancellation fee, 80% refund.',
      'Cancellation less than 24 hours before the activity: cancellation is not possible.',
      'Reschedule is free of charge when requested at least 24 hours before the activity.',
      'No-show (not arriving without confirming at least one day before): 100% cancellation fee, no refund.',
      'Approved refunds are returned to the original payment method within 3 business days after confirmation.',
    ],
  },
  {
    title: '5. Changes by the operator or by weather',
    body: [
      'Adventure activities depend on weather, river conditions and safety assessments. If an activity cannot run safely, you will be offered another date or a full refund.',
      'We may adjust departure times or routes for safety reasons without reducing the value of the experience.',
    ],
  },
  {
    title: '6. Guest responsibilities',
    body: [
      'You must meet the age, weight and health requirements published on the package page.',
      'Arrive at the meeting point or pickup location at least 15 minutes before departure. Bring valid identification and the items listed under "What to bring".',
      'Guests must follow the safety briefing and the instructions of the guide. Alcohol and drugs before or during the activity are not permitted.',
    ],
  },
  {
    title: '7. Pickup and meeting point',
    body: [
      'Self-drive packages start at the meeting point stated on the product page. Transfer packages include hotel pickup; the pickup area may carry a surcharge shown at checkout.',
      'If the pickup address is marked "TBA", it must be confirmed no later than one day before the activity. Some outer areas require a custom quote and cannot be booked instantly.',
    ],
  },
  {
    title: '8. Liability and insurance',
    body: [
      'Adventure activities carry inherent risk. Participation is subject to the activity safety waiver, which must be accepted before payment.',
      'Basic activity insurance is included as listed on the package. We recommend personal travel insurance for medical care, evacuation and personal belongings.',
    ],
  },
  {
    title: '9. Your data',
    body: [
      'We use your name, email, WhatsApp number, billing details and booking information to process the booking, issue the e-voucher, coordinate pickup and maintain the activity manifest.',
      'We share only the information required to deliver the activity with the activity partner, and we never publish partner names or partnership structures.',
    ],
  },
  {
    title: '10. Governing law and contact',
    body: [
      'These terms are governed by Indonesian law. Disputes are settled in the courts of Bali, Indonesia.',
      `Questions: email ${BRAND_EMAIL_HELLO} for general enquiries or ${BRAND_EMAIL_SUPPORT} for an existing booking, reschedule, refund or on-trip emergency.`,
    ],
  },
];

export const WAIVER_SECTIONS: LegalSection[] = [
  {
    title: '1. Acknowledgment of risk',
    body: [
      'I understand that adventure activities in Bali — including ATV riding, rafting, tubing, cycling, trekking, canyoning and water sports — involve inherent risks. These include injury, illness, equipment failure, changing weather, river conditions and incidents during transport.',
      'I participate voluntarily and accept those risks for myself and, where applicable, for the minors I am responsible for.',
    ],
  },
  {
    title: '2. Medical declaration',
    body: [
      'I confirm that I am physically able to take part and that I have disclosed any condition that could affect my safety, including pregnancy, heart conditions, epilepsy, recent surgery, back or neck problems, and asthma.',
      'I understand that the guide may exclude me from the activity if my participation would be unsafe. In that case the cancellation policy applies.',
    ],
  },
  {
    title: '3. Safety rules and equipment',
    body: [
      'I will wear the safety equipment provided, follow the safety briefing and follow the instructions of guides and safety staff at all times.',
      'I will not be under the influence of alcohol or drugs, and I will not operate equipment in a way that endangers others.',
    ],
  },
  {
    title: '4. Release of liability',
    body: [
      'To the fullest extent permitted by Indonesian law, I release the activity operator, its guides and staff, and BaliWild from liability for loss, injury or damage arising from the ordinary risks of the activity.',
      'This release does not cover gross negligence or wilful misconduct, and it does not remove rights that Indonesian law does not allow to be excluded.',
    ],
  },
  {
    title: '5. Minors',
    body: [
      'Participants under 18 must be accompanied by a parent or legal guardian, who accepts this waiver on their behalf and supervises them during the activity.',
    ],
  },
  {
    title: '6. Medical assistance and images',
    body: [
      'I authorise the operator to arrange emergency medical assistance if needed, at my cost where the expense is not covered by the included insurance.',
      'I understand that the operator may photograph or film the activity for documentation and safety purposes.',
    ],
  },
  {
    title: '7. Acknowledgment',
    body: [
      'I have read and understood this waiver, I have had the opportunity to ask questions, and I accept it voluntarily. I understand that my acceptance is recorded with a timestamp and the waiver version.',
    ],
  },
];
