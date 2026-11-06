/**
 * Tenant Context - Multi-tenancy foundation
 * 
 * Provides request-scoped tenant resolution from:
 * 1. Subdomain (e.g., baliwild.baliwild.com, baliexperience.baliwild.com)
 * 2. Custom domain (e.g., baliwildadventures.com)
 * 3. Header (X-Tenant-ID for API clients)
 * 4. Session (for authenticated admin users)
 * 
 * Falls back to default tenant for backward compatibility.
 */

import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export interface TenantContext {
  id: string;
  domain: string;
  name: string;
  themeColor: string;
  logoUrl: string | null;
  isActive: boolean;
}

const DEFAULT_TENANT_ID = 'tenant-001';
const TENANT_CACHE_TTL = 60_000; // 1 minute

// In-memory cache for tenant lookups (per process)
const tenantCache = new Map<string, { tenant: TenantContext; expires: number }>();

/**
 * Resolve tenant from request context.
 * Priority: Header > Subdomain > Custom Domain > Session > Default
 */
export async function getTenantContext(): Promise<TenantContext> {
  // 1. Check header (for API clients)
  const headerTenantId = headers().get('x-tenant-id');
  if (headerTenantId) {
    return getTenantById(headerTenantId);
  }

  // 2. Check subdomain from host header
  const host = headers().get('host') || '';
  const subdomain = extractSubdomain(host);
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    const tenant = await getTenantByDomain(subdomain);
    if (tenant) return tenant;
  }

  // 3. Check custom domain
  const customDomainTenant = await getTenantByCustomDomain(host);
  if (customDomainTenant) return customDomainTenant;

  // 4. Check admin session (for admin panel)
  const sessionTenantId = await getSessionTenantId();
  if (sessionTenantId) {
    return getTenantById(sessionTenantId);
  }

  // 5. Fallback to default tenant
  return getTenantById(DEFAULT_TENANT_ID);
}

/**
 * Get tenant by ID with caching
 */
async function getTenantById(tenantId: string): Promise<TenantContext> {
  const cached = tenantCache.get(tenantId);
  if (cached && cached.expires > Date.now()) {
    return cached.tenant;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      domain: true,
      name: true,
      themeColor: true,
      logoUrl: true,
      isActive: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const context: TenantContext = {
    id: tenant.id,
    domain: tenant.domain,
    name: tenant.name,
    themeColor: tenant.themeColor,
    logoUrl: tenant.logoUrl,
    isActive: tenant.isActive,
  };

  tenantCache.set(tenantId, { tenant: context, expires: Date.now() + TENANT_CACHE_TTL });
  return context;
}

/**
 * Get tenant by subdomain (e.g., baliwild.baliwild.com)
 */
async function getTenantByDomain(subdomain: string): Promise<TenantContext | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { domain: subdomain },
    select: {
      id: true,
      domain: true,
      name: true,
      themeColor: true,
      logoUrl: true,
      isActive: true,
    },
  });

  if (!tenant || !tenant.isActive) return null;

  const context: TenantContext = {
    id: tenant.id,
    domain: tenant.domain,
    name: tenant.name,
    themeColor: tenant.themeColor,
    logoUrl: tenant.logoUrl,
    isActive: tenant.isActive,
  };

  tenantCache.set(tenant.id, { tenant: context, expires: Date.now() + TENANT_CACHE_TTL });
  return context;
}

/**
 * Get tenant by custom domain (e.g., baliwildadventures.com)
 */
async function getTenantByCustomDomain(host: string): Promise<TenantContext | null> {
  // Remove port if present
  const domain = host.split(':')[0];
  
  // Skip localhost and known subdomains
  if (domain === 'localhost' || domain.endsWith('.localhost')) return null;
  if (domain.startsWith('api.') || domain.startsWith('admin.')) return null;

  const tenant = await prisma.tenant.findFirst({
    where: { domain, isActive: true },
    select: {
      id: true,
      domain: true,
      name: true,
      themeColor: true,
      logoUrl: true,
      isActive: true,
    },
  });

  if (!tenant) return null;

  const context: TenantContext = {
    id: tenant.id,
    domain: tenant.domain,
    name: tenant.name,
    themeColor: tenant.themeColor,
    logoUrl: tenant.logoUrl,
    isActive: tenant.isActive,
  };

  tenantCache.set(tenant.id, { tenant: context, expires: Date.now() + TENANT_CACHE_TTL });
  return context;
}

/**
 * Extract subdomain from host (e.g., "baliwild.baliwild.com" -> "baliwild")
 */
function extractSubdomain(host: string): string | null {
  const domain = host.split(':')[0];
  const parts = domain.split('.');
  
  // Need at least 3 parts for subdomain (sub.domain.tld)
  if (parts.length < 3) return null;
  
  // Return first part as subdomain
  return parts[0];
}

/**
 * Get tenant ID from admin session cookie
 */
async function getSessionTenantId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie?.value) return null;

    // Verify session and extract tenantId
    // This would typically decode a JWT or lookup in session store
    // For now, return null to use default tenant
    // TODO: Implement proper session validation
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear tenant cache (useful for testing or after tenant updates)
 */
export function clearTenantCache(tenantId?: string): void {
  if (tenantId) {
    tenantCache.delete(tenantId);
  } else {
    tenantCache.clear();
  }
}

/**
 * Create a Prisma client with tenant-scoped queries
 * Usage: const tenantPrisma = getTenantPrisma(tenantId);
 * All queries will automatically include tenantId filter
 * 
 * TODO: Implement proper tenant scoping via Prisma middleware
 * Currently returns base client - tenant filtering handled by application layer
 */
// TODO: Implement proper tenant scoping via Prisma middleware when needed
// For now, tenant filtering is enforced at the application layer