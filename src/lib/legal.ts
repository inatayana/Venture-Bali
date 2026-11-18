/**
 * BaliWild — legal copy
 * --------------------------
 * v2026-11-18. These texts are rendered on /terms and /waiver and the
 * accepted version is stored on every booking (`waiverVersion`).
 *
 * The waiver wording reflects the policies this codebase enforces
 * (docs/REFUND_POLICY.md v2, docs/NO_SHOW_POLICY.md) — keep them in sync.
 *
 * Operating model: BaliWild (PT Natayana Bali Tours) manages the booking,
 * payment and customer coordination end to end. The adventure itself is
 * performed by licensed local experience providers appointed by BaliWild,
 * who cover the facilities, equipment, guides, insurance and on-site
 * services of the activity.
 */

import { BRAND_EMAIL_HELLO, BRAND_EMAIL_SUPPORT } from './brand';

export const TERMS_VERSION = '2026-11-18';
export const WAIVER_VERSION = '2026-11-18';

export interface LegalSection {
  title: string;
  body: string[];
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. About these terms',
    body: [
      'BaliWild ("BaliWild", "we", "us"), operated by PT Natayana Bali Tours, is a single-brand operator for adventure activities in Bali, Indonesia. We manage the complete booking journey: the booking, payment, voucher, pickup coordination and customer support.',
      'The adventure activity itself is performed by licensed local experience providers appointed by BaliWild. Those providers deliver the facilities, equipment, guides and activity insurance described on the package page.',
      'By confirming a booking you agree to these terms, the cancellation policy and the activity safety waiver.',
    ],
  },
  {
    title: '2. Our role and the provider’s role',
    body: [
      'BaliWild is responsible for: (a) the reservation and hold of your slot; (b) processing your payment; (c) issuing your booking reference and e-voucher; (d) coordinating pickup and the meeting point; (e) handling reschedule, cancellation and refund requests; (f) first-line customer support before, during and after the trip; and (g) relaying your booking details to the appointed provider.',
      'The appointed provider is responsible for: (a) performing the activity itself; (b) safety equipment, guides and on-site safety management; (c) the activity insurance and facilities described on the package page; (d) the accuracy of activity-specific safety rules communicated at check-in; and (e) the services explicitly listed as included in the package (for example, entrance fees, lunch, lockers or showers where specified).',
      'You do not need to contact the provider. BaliWild is your single point of contact. If anything goes wrong at any stage, contact BaliWild — we coordinate directly with the provider on your behalf.',
      'BaliWild selects and appoints its partner providers. Provider identities and cooperation arrangements are confidential commercial information and are not disclosed to guests.',
    ],
  },
  {
    title: '3. Bookings, holds and confirmation',
    body: [
      'Bookings are confirmed when the payment is settled and a booking reference with an e-voucher is issued. The lead guest is responsible for the accuracy of names, contact details, participant count and pickup information.',
      'A temporary hold of 10 minutes protects your slot while you pay. If the payment session expires, the slot is released and you will need to select the date and time again.',
      'Booking details are sent to the appointed provider so the provider can prepare the arrival, safety registration and activity logistics.',
    ],
  },
  {
    title: '4. Prices and payment',
    body: [
      'All prices are in Indonesian Rupiah (IDR) and include the services listed on the package page. Payments are processed by Midtrans (QRIS, virtual accounts, e-wallets and cards). BaliWild never stores card numbers.',
      'A promotional price and a coupon code can never be combined. The amount shown at checkout is the amount charged.',
      'Pickup surcharges for outer or custom-quote areas, if any, are shown and agreed at checkout before payment and are part of the total price.',
    ],
  },
  {
    title: '5. Cancellation, reschedule and no-show',
    body: [
      'Cancellation at least 24 hours before the activity start: 20% cancellation fee, 80% refund of the total paid price.',
      'Cancellation less than 24 hours before the activity start: cancellation is not possible.',
      'Reschedule is free of charge when requested at least 24 hours before the activity start, subject to availability. The new date must be within the booking validity communicated with your booking.',
      'No-show (not arriving without confirming at least one day before): 100% cancellation fee, no refund.',
      'Approved refunds are returned to the original payment method within 3 business days after the cancellation is confirmed. See the Refund & Reschedule Policy page for the full policy and worked examples.',
    ],
  },
  {
    title: '6. Changes by us or by the weather',
    body: [
      'Adventure activities depend on weather, river conditions and safety assessments. If an activity cannot run safely, you will be offered another date or a full refund.',
      'We may adjust departure times, meeting points or routes for safety reasons without reducing the value of the experience.',
      'If the provider cannot deliver the activity or you are refused for safety reasons, BaliWild guarantees the reschedule-or-refund outcome above.',
    ],
  },
  {
    title: '7. Guest responsibilities',
    body: [
      'You must meet the age, weight and health requirements published on the package page.',
      'You must sign the digital safety waiver before the activity and complete any safety declaration requested at check-in. Registration at the meeting point or on pickup includes identity and safety checks.',
      'Arrive at the meeting point or pickup location at least 15 minutes before departure. Bring valid identification and the items listed under the package inclusions.',
      'Guests must follow the safety briefing and the instructions of the guide. Alcohol and drugs before or during the activity are not permitted.',
      'Providing false information on a waiver or safety declaration may void insurance cover for that participant.',
    ],
  },
  {
    title: '8. Pickup and meeting point',
    body: [
      'Self-drive packages start at the meeting point stated on the package page. Transfer packages include hotel pickup; the pickup area may carry a surcharge shown at checkout.',
      'If the pickup address is marked "TBA", it must be confirmed no later than one day before the activity. Some outer areas require a custom quote and cannot be booked instantly.',
      'Pickup times may shift within a reasonable window depending on traffic and provider schedules on the day.',
    ],
  },
  {
    title: '9. Liability and insurance',
    body: [
      'Adventure activities carry inherent risk. Participation is subject to the activity safety waiver, accepted at booking and re-confirmed at check-in.',
      'The appointed provider carries activity insurance covering its equipment, guides, instructors and the facility where applicable, as described on the package page. We recommend you also hold personal travel insurance for medical care, evacuation and personal belongings.',
      'BaliWild’s liability is limited to its obligations as coordinator of the booking process: reservation, payment, voucher, coordination and refunds. BaliWild is not the operator of the activity and is not liable for loss, injury or damage arising from the ordinary risks of an activity performed by the appointed provider, except where such exclusion would be prohibited by Indonesian law.',
      'Nothing in these terms limits liability for gross negligence or wilful misconduct. Where an event occurs, BaliWild will actively coordinate the response and resolution with the provider, including insurance claims assistance.',
    ],
  },
  {
    title: '10. Your data',
    body: [
      'We use your name, email, WhatsApp number, billing details and booking information to process the booking, issue the e-voucher, coordinate pickup and share the manifest with the appointed provider.',
      'We share only the information the provider needs to deliver the activity. We never publish partner or provider names, structures or commercial arrangements.',
      'Retention of personal data is limited to what is required for accounting, tax, disputes and safety audits, after which data is deleted or anonymised on request where the law allows.',
    ],
  },
  {
    title: '11. Dispute resolution and contact',
    body: [
      'These terms are governed by Indonesian law. Disputes are settled in the courts of Bali, Indonesia.',
      `Before legal action, contact us so we can resolve the matter directly: ${BRAND_EMAIL_SUPPORT} for an existing booking, or ${BRAND_EMAIL_HELLO} for general enquiries. Most issues are resolved within one business day.`,
    ],
  },
  {
    title: '12. Changes to these terms',
    body: [
      'We may update these terms from time to time. The version shown at the top of this page, and the version you accepted at booking, applies to your booking.',
      'Material changes are announced on this page; continued use of BaliWild after the change constitutes acceptance.',
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
      'To the fullest extent permitted by Indonesian law, I release the activity provider, its guides and staff, and BaliWild from liability for loss, injury or damage arising from the ordinary risks of the activity.',
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
      'I authorise the provider to arrange emergency medical assistance if needed, at my cost where the expense is not covered by the included insurance.',
      'I understand that the provider may photograph or film the activity for documentation and safety purposes.',
    ],
  },
  {
    title: '7. Acknowledgment',
    body: [
      'I have read and understood this waiver, I have had the opportunity to ask questions, and I accept it voluntarily. I understand that my acceptance is recorded with a timestamp and the waiver version.',
    ],
  },
];
