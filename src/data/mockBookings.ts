import type { Booking } from '@/types/venture';
import { mockVentures } from './mockVentures';

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const dateAhead = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const mockBookings: Booking[] = [
  {
    id: 'bk-001',
    bookingCode: 'VB-2026-0001',
    variantId: 'var-001',
    customerId: 'cust-001',
    customer: {
      id: 'cust-001',
      email: 'sarah.mitchell@example.com',
      name: 'Sarah Mitchell',
      countryCode: '+61',
      whatsapp: '+61411222333',
      totalBookings: 3,
      createdAt: daysAgo(40),
      updatedAt: daysAgo(2),
    },
    bookingDate: dateAhead(2),
    fulfillmentMode: 'PRIVATE_TRANSFER',
    pickupZoneId: 'zone-2',
    vehicleClassId: 'vc-mpv',
    hotelAddress: 'Jl. Camplung Tanduk No. 9, Seminyak',
    paxCount: 4,
    vehicleCount: 1,
    zoneSurchargeIdr: 224000,
    selectedAddons: [
      { id: 'addon-001', name: 'Professional Photographer', price: 150000 },
    ],
    totalPrice: 2454000,
    paymentStatus: 'PAID',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'bk-002',
    bookingCode: 'VB-2026-0002',
    variantId: 'var-002',
    customerId: 'cust-002',
    customer: {
      id: 'cust-002',
      email: 'takeshi.k@example.com',
      name: 'Takeshi Kobayashi',
      countryCode: '+81',
      whatsapp: '+819011122233',
      totalBookings: 1,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
    },
    bookingDate: dateAhead(4),
    fulfillmentMode: 'SELF_DRIVE',
    paxCount: 2,
    vehicleCount: 0,
    zoneSurchargeIdr: 0,
    totalPrice: 900000,
    paymentStatus: 'PAID',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'bk-003',
    bookingCode: 'VB-2026-0003',
    variantId: 'var-001',
    customerId: 'cust-003',
    customer: {
      id: 'cust-003',
      email: 'linda.santoso@example.com',
      name: 'Linda Santoso',
      countryCode: '+65',
      whatsapp: '+6581234567',
      totalBookings: 2,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(0),
    },
    bookingDate: dateAhead(1),
    fulfillmentMode: 'PRIVATE_TRANSFER',
    pickupZoneId: 'zone-1',
    vehicleClassId: 'vc-suv',
    hotelAddress: 'Jl. Monkey Forest No. 21, Ubud',
    paxCount: 3,
    vehicleCount: 1,
    zoneSurchargeIdr: 0,
    totalPrice: 1650000,
    paymentStatus: 'PENDING',
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: 'bk-004',
    bookingCode: 'VB-2026-0004',
    variantId: 'var-003',
    customerId: 'cust-004',
    customer: {
      id: 'cust-004',
      email: 'mark.johnson@example.com',
      name: 'Mark Johnson',
      countryCode: '+44',
      whatsapp: '+447700111222',
      totalBookings: 5,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(3),
    },
    bookingDate: dateAhead(6),
    fulfillmentMode: 'SELF_DRIVE',
    paxCount: 2,
    vehicleCount: 0,
    zoneSurchargeIdr: 0,
    totalPrice: 1200000,
    paymentStatus: 'CANCELLED',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 'bk-005',
    bookingCode: 'VB-2026-0005',
    variantId: 'var-002',
    customerId: 'cust-005',
    customer: {
      id: 'cust-005',
      email: 'ayu.ksari@example.com',
      name: 'Ayu Kusumawardani',
      countryCode: '+62',
      whatsapp: '+6281234567890',
      totalBookings: 7,
      createdAt: daysAgo(90),
      updatedAt: daysAgo(0),
    },
    bookingDate: dateAhead(3),
    fulfillmentMode: 'PRIVATE_TRANSFER',
    pickupZoneId: 'zone-3',
    vehicleClassId: 'vc-van',
    hotelAddress: 'Jl. Raya Nusa Dua Selatan No. 1, Benoa',
    paxCount: 8,
    vehicleCount: 1,
    zoneSurchargeIdr: 320000,
    selectedAddons: [
      { id: 'combo-001', name: 'Ayung River Rafting Combo', price: 350000 },
    ],
    totalPrice: 4270000,
    paymentStatus: 'PENDING',
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: 'bk-006',
    bookingCode: 'VB-2026-0006',
    variantId: 'var-001',
    customerId: 'cust-006',
    customer: {
      id: 'cust-006',
      email: 'hans.mueller@example.com',
      name: 'Hans Müller',
      countryCode: '+49',
      whatsapp: '+4915112223334',
      totalBookings: 1,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
    bookingDate: dateAhead(5),
    fulfillmentMode: 'SELF_DRIVE',
    paxCount: 2,
    vehicleCount: 0,
    zoneSurchargeIdr: 0,
    totalPrice: 550000,
    paymentStatus: 'FAILED',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
];

export function resolveVariant(variantId: string): { ventureTitle: string; variantTitle: string } | null {
  for (const venture of mockVentures) {
    const variant = venture.variants?.find((v) => v.id === variantId);
    if (variant) {
      return { ventureTitle: venture.title, variantTitle: variant.title };
    }
  }
  return null;
}
