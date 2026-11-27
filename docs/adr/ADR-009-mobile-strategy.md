# ADR-009: Mobile Strategy

**Date:** 2026-11-27
**Status:** APPROVED
**Deciders:** Senior Product & Database Architect, CTO, Founder
**Technical Story:** STRATEGY_20YEAR_ROADMAP.md §8 ADR-009

## Context

BaliWild needs a mobile strategy for:
- **Primary market**: International tourists (mobile-first booking)
- **Secondary market**: Domestic Indonesian travelers (WhatsApp-first, mobile web)
- **Current state**: PWA (Next.js + Service Worker), mobile-optimized UI, `manifest.ts`, `sw.js`
- **Gaps**: No push notifications, no offline booking, no app store presence, no native features (camera for QR, biometric auth, Apple/Google Pay)

## Decision

**Phase 1 (Now - Year 1): PWA Only — Invest in PWA excellence**
**Phase 2 (Year 2): Expo (React Native) — Shared codebase with web**

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **PWA Only (Forever)** | Single codebase, zero app store friction, instant updates, SEO indexable, no 30% fee, works on all devices | No push notifications (iOS Safari limited), no offline booking, no app store discovery, no native payments (Apple/Google Pay), limited background sync | ✅ **Phase 1** |
| **React Native (Expo)** | True native, push notifications, offline-first, app store presence, native payments, biometrics, camera, background tasks | Separate codebase (partial share), app store review delays, 30% fee on IAP (not our model), maintenance burden | ✅ **Phase 2** |
| **Flutter** | Single codebase (mobile + web), performant, Google backing | Dart learning curve, web support maturing, larger bundle, less ecosystem for our stack | ❌ Rejected |
| **Native (Swift/Kotlin)** | Best performance, full platform access | 2x codebase, high cost, slow iteration | ❌ Rejected |
| **Capacitor / Ionic** | Web-to-native wrapper, access to native plugins | Performance overhead, plugin maintenance, not truly native feel | ❌ Rejected |

## Consequences

### Phase 1: PWA Excellence (Now - Year 1)
**Investment Areas:**
- **Service Worker**: Offline caching for static assets, booking confirmation page, voucher display
- **Web Push**: VAPID keys + Push API (Chrome/Android, Firefox; iOS 16.4+)
- **Background Sync**: Queue booking submissions when offline
- **App-like UX**: `display: standalone`, splash screen, status bar theme
- **Install Prompt**: Smart install banner (not annoying)
- **Performance**: Lighthouse PWA score >90, LCP <2.5s on 3G

### Phase 2: Expo (Year 2)
**Architecture: Monorepo with shared packages**
```
baliwild/
├── apps/
│   ├── web/          # Next.js (current)
│   ├── mobile/       # Expo (new)
│   └── admin/        # Next.js (current)
├── packages/
│   ├── ui/           # Shared React components (Tailwind → NativeWind)
│   ├── api/          # Shared API client (TanStack Query)
│   ├── auth/         # Shared auth logic
│   ├── pricing/      # Shared pricing engine (pure TS)
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared constants, feature flags
```

**Migration Path:**
1. Extract `pricing.ts`, `types/venture.ts`, `lib/brand.ts` → `packages/`
2. Create Expo app with `expo-router` (file-based routing like Next.js)
3. Migrate screens: Home → Explore → Product Detail → Booking → Voucher
4. Add native: Push notifications (Expo Push), Biometric auth (Expo LocalAuthentication), Camera (QR scan), Apple/Google Pay
5. Shared TanStack Query cache + Supabase Realtime
6. Feature flag: `mobile_app_enabled` (PostHog)

## Consequences

### Positive
- **Phase 1**: Zero cost, single codebase, SEO preserved, instant deployment
- **Phase 2**: True native experience where it matters (push, offline, payments, camera), shared business logic (pricing, booking, auth), Expo managed workflow (EAS Build, Updates)

### Negative
- **Phase 1**: iOS push limitations (Safari 16.4+ only, no background push), no offline booking creation
- **Phase 2**: Maintenance of two platforms, app store review cycle, EAS Build costs (~$29/mo), native debugging complexity

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| PWA "good enough" delays native | Set hard trigger: Year 2 OR >50% mobile bookings OR competitor native app |
| Code sharing complexity | Start with pure TS packages (pricing, types, config); UI sharing via NativeWind later |
| App store rejection | Follow guidelines; no IAP (we use Midtrans web); privacy manifest ready |
| Push notification fatigue | Opt-in only; frequency caps; relevance scoring |

## Implementation Plan

### Phase 1: PWA Enhancements (Sprint 1-3)
```typescript
// 1. Enhanced Service Worker (public/sw.ts)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('baliwild-static-v1').then((cache) => 
      cache.addAll([
        '/',
        '/manifest.json',
        '/offline.html', // Custom offline page
      ])
    )
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first for static assets
  if (event.request.destination === 'image' || 
      event.request.destination === 'style' ||
      event.request.destination === 'script') {
    event.respondWith(
      caches.match(event.request).then((cached) => 
        cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open('baliwild-static-v1').then((cache) => cache.put(event.request, clone));
          return response;
        })
      )
    );
  }
  
  // Network-first for API (with offline fallback)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});

// 2. Background Sync for Booking (registration in booking flow)
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('booking-submit');
}

// 3. Web Push Setup (VAPID)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
});
await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) });
```

```typescript
// 4. Enhanced Manifest (public/manifest.ts)
export const manifest: MetadataManifest = {
  name: 'BaliWild — Own the Wild',
  short_name: 'BaliWild',
  description: 'Book authentic Bali adventures direct. No commissions. Instant confirmation.',
  start_url: '/',
  display: 'standalone',
  background_color: '#000000',
  theme_color: '#FFEE00',
  orientation: 'portrait-primary',
  scope: '/',
  icons: [
    { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
  categories: ['travel', 'lifestyle'],
  shortcuts: [
    {
      name: 'Explore Adventures',
      short_name: 'Explore',
      description: 'Browse all Bali adventures',
      url: '/explore',
      icons: [{ src: '/icons/explore.png', sizes: '192x192' }],
    },
    {
      name: 'My Bookings',
      short_name: 'Bookings',
      description: 'View your upcoming trips',
      url: '/trips',
      icons: [{ src: '/icons/bookings.png', sizes: '192x192' }],
    },
  ],
};
```

### Phase 2: Expo App (Year 2 - Sprint 1-6)
```bash
# 1. Initialize monorepo (if not already)
npx create-turbo@latest -e with-tailwind

# 2. Create Expo app
cd apps/mobile
npx create-expo-app@latest . --template expo-router

# 3. Configure NativeWind (Tailwind for React Native)
npm install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
# tailwind.config.js: shared with web (content: ['../../packages/ui/**/*.tsx'])

# 4. Shared packages
# packages/pricing → pure TS, no React deps
# packages/types → Zod schemas + TypeScript types
# packages/api → TanStack Query + Supabase client
# packages/auth → Supabase Auth helpers
```

```typescript
// 5. Push Notifications (Expo)
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) return;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await fetch('/api/push/register-expo', { 
    method: 'POST', 
    body: JSON.stringify({ token, platform: 'ios' | 'android' }) 
  });
}
```

## Monitoring & Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| PWA | Lighthouse PWA Score | >90 |
| PWA | Install Rate (visitors → install) | >2% |
| PWA | Push Opt-in Rate | >15% (Android) |
| Native | App Store Rating | >4.5 |
| Native | Push Delivery Rate | >98% |
| Native | Offline Booking Success | >95% |
| Native | Monthly Active Users (MAU) | >30% of web MAU |

## Rollback Plan

If Expo fails:
1. Revert to PWA-only; maintain PWA excellence
2. Evaluate Capacitor as lighter native wrapper
3. Document lessons learned in ADR-009-amendment

## References

- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- `STRATEGY_20YEAR_ROADMAP.md` §8 ADR-009
- `UI_UX_DESIGN_SYSTEM.md` (mobile-first principles)