/**
 * Venture Bali Multi-Tenant OTA Platform
 * TypeScript Type Definitions
 * Match with prisma/schema.prisma
 */

// ============ ENUMS ============

export type FulfillmentMode = 'SELF_DRIVE' | 'PRIVATE_TRANSFER';
export type Difficulty = 'EASY' | 'MODERATE' | 'CHALLENGING';
export type PickupZoneType = 'ZONE_1' | 'ZONE_2' | 'ZONE_3' | 'ZONE_4';
export type VehicleClassType = 'STANDARD_SUV' | 'PREMIUM_MPV' | 'MINIVAN';
export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';
export type VoucherStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';
export type NotificationType = 'EMAIL' | 'WHATSAPP' | 'SMS';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

// ============ MULTI-LANGUAGE (Json) ============

export interface MultiLanguage {
  en?: string;
  id?: string;
  [key: string]: string | undefined;
}

// ============ CORE MODELS ============

export interface Tenant {
  id: string;
  domain: string;
  name: string;
  themeColor: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PickupZone {
  id: string;
  name: string;
  areaType: PickupZoneType;
  surchargeIdr: number;
  isCustomQuote: boolean;
  vehicleMaxPax: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleClass {
  id: string;
  name: VehicleClassType;
  label: string;
  description?: string;
  vehicleMaxPax: number;
  deltaIdr: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type SuitableFor = 'KIDS' | 'COUPLE' | 'FAMILY' | 'SOLO' | 'GROUP';

export interface Customer {
  id: string;
  email: string;
  name: string;
  countryCode: string;
  whatsapp: string;
  totalBookings: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ PRODUCT MODELS ============

export interface EssentialInfo {
  perfectFor: string[];
  whatToBring: string[];
  knowBeforeYouGo: string[];
}

export interface ItineraryItem {
  time: string;
  activity: string;
}

export interface Venture {
  id: string;
  slug: string;
  tenantId: string;
  locationId?: string;
  location?: Location;
  title: string;
  hook3Sec: string;
  shortDescription?: string;
  duration: string;
  badge?: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryItem[];
  essentialInfo: EssentialInfo;
  faqs?: FaqItem[];
  languages: string[];
  category: string;
  subcategory?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchTags?: string[];
  difficulty: Difficulty;
  suitableFor?: SuitableFor[];
  imageUrl: string;
  gallery: string[];
  videoUrl?: string;
  rating: number;
  variants?: Variant[];
  reviews?: Review[];
  articles?: Article[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ VARIANT & PRICING MODELS ============

export interface PriceTier {
  minPax: number;
  maxPax: number;
  pricePerPax: number;
}

export interface SlotTime {
  id: string;
  variantId: string;
  time: string;
  maxCapacity: number;
  currentBookings: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Addon {
  id: string;
  variantId: string;
  name: string;
  price: number;
  description?: string;
  requiresTransfer: boolean;
  isCombo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Variant {
  id: string;
  ventureId: string;
  title: string;
  shortDescription: string;
  badge?: string;
  priceTiers: PriceTier[];
  blackoutDates: string[];
  slotTimes?: SlotTime[];
  addons?: Addon[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ BOOKING & PAYMENT MODELS ============

export interface Booking {
  id: string;
  bookingCode: string;
  variantId: string;
  variant?: Variant;
  customerId: string;
  customer?: Customer;
  bookingDate: string;
  slotTimeId?: string;
  slotTime?: SlotTime;
  fulfillmentMode: FulfillmentMode;
  pickupZoneId?: string;
  pickupZone?: PickupZone;
  vehicleClassId?: string;
  vehicleClass?: VehicleClass;
  hotelAddress?: string;
  paxCount: number;
  vehicleCount: number;
  zoneSurchargeIdr: number;
  selectedAddons?: { id: string; name: string; price: number }[];
  totalPrice: number;
  paymentStatus: PaymentStatus;
  payment?: Payment;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  midtransOrderId: string;
  snapToken?: string;
  redirectUrl?: string;
  paymentMethod?: string;
  grossAmount: number;
  transactionTime?: Date;
  rawResponse?: Record<string, unknown>;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Voucher {
  id: string;
  bookingId: string;
  booking?: Booking;
  qrCodeData: string;
  issuedAt: Date;
  redeemedAt?: Date;
  redeemedBy?: string;
  status: VoucherStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingRequest {
  ventureId: string;
  userId: string;
  bookingDate: string;
  participants: number;
  participantNames: string[];
  contactEmail: string;
  contactPhone: string;
  specialRequests?: string;
  promoCode?: string;
}

export type UserRole = 'admin' | 'member' | 'guest';

// ============ CONTENT MODELS ============

export interface Article {
  id: string;
  slug: string;
  title: MultiLanguage;
  content: string;
  metaDesc: MultiLanguage;
  keywords: string[];
  tags: string[];
  publishedAt?: Date;
  aiGenerated: boolean;
  ventureId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  ventureId: string;
  customerId: string;
  customer?: Customer;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
}

export interface MediaAsset {
  id: string;
  url: string;
  altText: string;
  width?: number;
  height?: number;
  size?: number;
  isPrimary: boolean;
  ventureId?: string;
  createdAt: Date;
}

export interface NotificationLog {
  id: string;
  bookingId?: string;
  customerId?: string;
  type: NotificationType;
  recipient: string;
  subject?: string;
  content: string;
  status: NotificationStatus;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

// ============ API RESPONSE TYPES ============

export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { total: number; page: number; pageSize: number };
}

// ============ SIMPLIFIED VENTURE ITEM (for list views) ============

export interface VentureItem extends Omit<Venture, 'location'> {
  variants: Variant[];
  description: string;
  priceIdr: number;
  durationHours: number;
  minParticipants: number;
  maxParticipants: number;
  reviewCount: number;
  isAvailable: boolean;
  location: string;
}
