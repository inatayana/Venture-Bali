/**
 * OpenAPI 3.1 Specification for BaliWild API v1
 * 
 * This file generates the OpenAPI spec that can be used for:
 * - API documentation (Swagger UI, Redoc)
 * - Client SDK generation
 * - Contract testing
 * - API gateway configuration
 */

import type { OpenAPIV3_1 } from 'openapi-types';

/**
 * Base OpenAPI document structure
 */
export const openApiSpec: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'BaliWild Adventures API',
    version: '1.0.0',
    description: 'API for BaliWild Adventures - Adventure bookings across Bali with licensed local operators',
    contact: {
      name: 'BaliWild Support',
      email: 'support@baliwild.com',
      url: 'https://baliwild.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://api.baliwild.com/v1',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.baliwild.com/v1',
      description: 'Staging server',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Local development server',
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
    {
      ApiKeyAuth: [],
    },
  ],
  tags: [
    { name: 'Ventures', description: 'Adventure products and variants' },
    { name: 'Bookings', description: 'Booking management and operations' },
    { name: 'Payments', description: 'Payment processing and Midtrans integration' },
    { name: 'Customers', description: 'Customer management' },
    { name: 'Reviews', description: 'Review and rating system' },
    { name: 'Content', description: 'SEO articles and content management' },
    { name: 'Admin', description: 'Administrative operations (requires admin auth)' },
    { name: 'Webhooks', description: 'External webhook endpoints (Midtrans, WhatsApp, Telegram)' },
  ],
  paths: {},
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from /api/v1/auth/login',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for server-to-server communication',
      },
      TenantId: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Tenant-ID',
        description: 'Tenant identifier for multi-tenancy (optional, defaults to baliwild)',
      },
    },
    schemas: {
      // Common response wrappers
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
        required: ['success'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Resource not found' },
              details: { type: 'object' },
            },
            required: ['code', 'message'],
          },
        },
        required: ['success', 'error'],
      },
      PaginatedResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  items: { type: 'array', items: { type: 'object' } },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 20 },
                      total: { type: 'integer', example: 100 },
                      totalPages: { type: 'integer', example: 5 },
                    },
                    required: ['page', 'limit', 'total', 'totalPages'],
                  },
                },
                required: ['items', 'pagination'],
              },
            },
            required: ['data'],
          },
        ],
      },

      // Core entities
      Tenant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid', example: 'tenant-001' },
          domain: { type: 'string', example: 'baliwild' },
          name: { type: 'string', example: 'BaliWild Adventures' },
          themeColor: { type: 'string', format: 'color', example: '#FFEE00' },
          logoUrl: { type: ['string', 'null'], format: 'uri' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'domain', 'name', 'themeColor', 'isActive', 'createdAt', 'updatedAt'],
      },

      Venture: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          slug: { type: 'string', example: 'ubud-rice-terrace-atv' },
          title: { type: 'string', example: 'Ubud Rice Terrace ATV Adventure' },
          hook3Sec: { type: 'string', example: 'Ride through stunning rice terraces at sunrise' },
          shortDescription: { type: ['string', 'null'] },
          longDescription: { type: ['string', 'null'] },
          duration: { type: 'string', example: '3 hours' },
          badge: { type: ['string', 'null'] },
          category: { type: 'string', example: 'ATV' },
          subcategory: { type: ['string', 'null'] },
          difficulty: { type: 'string', enum: ['EASY', 'MODERATE', 'CHALLENGING'] },
          imageUrl: { type: 'string', format: 'uri' },
          gallery: { type: 'array', items: { type: 'string', format: 'uri' } },
          rating: { type: 'number', format: 'float', minimum: 0, maximum: 5 },
          priceIdr: { type: 'integer', minimum: 0, example: 450000 },
          minParticipants: { type: 'integer', example: 1 },
          maxParticipants: { type: 'integer', example: 8 },
          isAvailable: { type: 'boolean', example: true },
          location: { type: 'string', example: 'Ubud, Gianyar' },
          highlights: { type: 'array', items: { type: 'string' } },
          inclusions: { type: 'array', items: { type: 'string' } },
          exclusions: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'slug', 'title', 'hook3Sec', 'duration', 'category', 'difficulty', 'imageUrl', 'rating', 'priceIdr', 'isAvailable', 'location'],
      },

      Variant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          ventureId: { type: 'string', format: 'cuid' },
          title: { type: 'string', example: 'Self Drive ATV' },
          shortDescription: { type: 'string', example: 'Meet at base camp, ride yourself' },
          fulfillmentMode: { type: 'string', enum: ['SELF_DRIVE', 'SHARED_TRANSFER', 'PRIVATE_TRANSFER'] },
          badge: { type: ['string', 'null'] },
          transportBadge: { type: ['string', 'null'] },
          promoPriceIdr: { type: ['integer', 'null'] },
          promoLabel: { type: ['string', 'null'] },
          priceTiers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                minPax: { type: 'integer', example: 1 },
                maxPax: { type: 'integer', example: 4 },
                pricePerPax: { type: 'integer', example: 450000 },
                pricingModel: { type: 'string', enum: ['FLAT_PER_GUEST', 'AGE_TIERED'] },
                kidsPricePerPax: { type: ['integer', 'null'] },
                youthPricePerPax: { type: ['integer', 'null'] },
              },
              required: ['minPax', 'maxPax', 'pricePerPax', 'pricingModel'],
            },
          },
          imageUrl: { type: ['string', 'null'], format: 'uri' },
          duration: { type: ['string', 'null'] },
        },
        required: ['id', 'ventureId', 'title', 'shortDescription', 'fulfillmentMode', 'priceTiers'],
      },

      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          bookingCode: { type: 'string', example: 'BW-2024-001234' },
          variantId: { type: 'string', format: 'cuid' },
          customerId: { type: 'string', format: 'cuid' },
          bookingDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', example: '2024-12-25' },
          slotTimeId: { type: ['string', 'null'], format: 'cuid' },
          fulfillmentMode: { type: 'string', enum: ['SELF_DRIVE', 'SHARED_TRANSFER', 'PRIVATE_TRANSFER'] },
          paxCount: { type: 'integer', example: 2 },
          adultsCount: { type: 'integer', example: 2 },
          kidsCount: { type: 'integer', example: 0 },
          youthCount: { type: 'integer', example: 0 },
          totalPrice: { type: 'integer', minimum: 0, example: 900000 },
          discountIdr: { type: 'integer', default: 0 },
          paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'] },
          lifecycleStatus: { type: 'string', enum: ['AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'bookingCode', 'variantId', 'customerId', 'bookingDate', 'fulfillmentMode', 'paxCount', 'totalPrice', 'paymentStatus', 'lifecycleStatus'],
      },

      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          name: { type: 'string', example: 'John Doe' },
          countryCode: { type: 'string', example: 'ID' },
          whatsapp: { type: 'string', example: '+6281234567890' },
          totalBookings: { type: 'integer', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'email', 'name', 'countryCode', 'whatsapp'],
      },

      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          bookingId: { type: 'string', format: 'cuid' },
          midtransOrderId: { type: 'string' },
          snapToken: { type: ['string', 'null'] },
          redirectUrl: { type: ['string', 'null'], format: 'uri' },
          grossAmount: { type: 'integer', example: 900000 },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'bookingId', 'midtransOrderId', 'grossAmount', 'status'],
      },

      Review: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          ventureId: { type: 'string', format: 'cuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
          guestName: { type: ['string', 'null'] },
          guestLocation: { type: ['string', 'null'] },
          isApproved: { type: 'boolean', default: false },
          source: { type: 'string', enum: ['VERIFIED_BOOKING', 'FOUNDING_GUEST', 'IMPORTED'] },
          photos: { type: 'array', items: { type: 'string', format: 'uri' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'ventureId', 'rating', 'comment', 'isApproved', 'source', 'createdAt'],
      },

      // Request bodies
      CreateBookingRequest: {
        type: 'object',
        required: ['variantId', 'bookingDate', 'slotTimeId', 'fulfillmentMode', 'paxCount', 'customer'],
        properties: {
          variantId: { type: 'string', format: 'cuid' },
          bookingDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          slotTimeId: { type: 'string', format: 'cuid' },
          fulfillmentMode: { type: 'string', enum: ['SELF_DRIVE', 'SHARED_TRANSFER', 'PRIVATE_TRANSFER'] },
          pickupZoneId: { type: ['string', 'null'], format: 'cuid' },
          vehicleClassId: { type: ['string', 'null'], format: 'cuid' },
          hotelAddress: { type: ['string', 'null'] },
          paxCount: { type: 'integer', minimum: 1 },
          adultsCount: { type: ['integer', 'null'] },
          kidsCount: { type: ['integer', 'null'] },
          youthCount: { type: ['integer', 'null'] },
          selectedAddons: { type: ['array', 'null'], items: { type: 'object' } },
          customer: {
            type: 'object',
            required: ['email', 'name', 'countryCode', 'whatsapp'],
            properties: {
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              countryCode: { type: 'string' },
              whatsapp: { type: 'string' },
            },
          },
          couponCode: { type: ['string', 'null'] },
        },
      },

      CreateReviewRequest: {
        type: 'object',
        required: ['ventureId', 'rating', 'comment'],
        properties: {
          ventureId: { type: 'string', format: 'cuid' },
          bookingId: { type: ['string', 'null'], format: 'cuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', minLength: 10, maxLength: 2000 },
          guestName: { type: ['string', 'null'] },
          guestLocation: { type: ['string', 'null'] },
          photos: { type: ['array', 'null'], items: { type: 'string', format: 'uri' }, maxItems: 3 },
        },
      },

      // Query parameters
      PaginationParams: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
      VentureFilterParams: {
        allOf: [
          { $ref: '#/components/schemas/PaginationParams' },
          {
            type: 'object',
            properties: {
              category: { type: 'string' },
              difficulty: { type: 'string', enum: ['EASY', 'MODERATE', 'CHALLENGING'] },
              minPrice: { type: 'integer', minimum: 0 },
              maxPrice: { type: 'integer', minimum: 0 },
              isAvailable: { type: 'boolean' },
              search: { type: 'string' },
              sort: { type: 'string', enum: ['recommended', 'popular', 'price-low', 'price-high', 'rating', 'duration'] },
            },
          },
        ],
      },

      // Webhook payloads
      MidtransWebhookPayload: {
        type: 'object',
        properties: {
          transaction_time: { type: 'string' },
          transaction_status: { type: 'string' },
          transaction_id: { type: 'string' },
          status_message: { type: 'string' },
          status_code: { type: 'string' },
          signature_key: { type: 'string' },
          payment_type: { type: 'string' },
          order_id: { type: 'string' },
          gross_amount: { type: 'string' },
          payment_method: { type: 'string' },
          fraud_status: { type: 'string' },
        },
        required: ['transaction_time', 'transaction_status', 'order_id', 'gross_amount', 'signature_key'],
      },
    },
  },
};

/**
 * Generate OpenAPI spec as JSON string
 */
export function getOpenApiSpec(): string {
  return JSON.stringify(openApiSpec, null, 2);
}

/**
 * Generate OpenAPI spec as YAML string (requires js-yaml)
 */
export async function getOpenApiSpecYaml(): Promise<string> {
  const yaml = await import('js-yaml');
  return yaml.default.dump(openApiSpec);
}